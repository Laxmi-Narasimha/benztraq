import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { startOfMonth, endOfMonth, eachMonthOfInterval, format, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))

                },
            },
        }
    );

    try {
        const { searchParams } = new URL(request.url);
        const dateFrom = searchParams.get('from');
        const dateTo = searchParams.get('to');
        const salespersonIds = searchParams.get('users')?.split(',').filter(Boolean) || [];
        const organizationId = searchParams.get('org'); // If relevant

        // Get current user for RBAC
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // RBAC: ASM can only see themselves unless comparing (if allowed? usually no)
        // Manager can see anyone.

        let effectiveUserIds = salespersonIds;
        if (profile.role === 'asm') {
            // Force override for ASM
            effectiveUserIds = [user.id];
        }

        // Build Document Query - Fetch ALL types to separate later
        let query = supabase
            .from('documents')
            .select(`
                id,
                doc_type,
                doc_date,
                total_value,
                status,
                salesperson_user_id
            `)
            .in('doc_type', ['quotation', 'sales_order'])
            .gte('doc_date', dateFrom)
            .lte('doc_date', dateTo);

        if (effectiveUserIds.length > 0) {
            query = query.in('salesperson_user_id', effectiveUserIds);
        }

        // Apply Org ID if applicable (from profile usually)
        // query = query.eq('organization', ...); 

        const { data: docs, error: docsError } = await query;
        if (docsError) throw docsError;

        // Fetch Targets
        const years = new Set([
            new Date(dateFrom).getFullYear(),
            new Date(dateTo).getFullYear()
        ]);

        const { data: targetsData } = await supabase
            .from('annual_targets')
            .select('*')
            .in('year', Array.from(years))
            .in('salesperson_user_id', effectiveUserIds.length > 0 ? effectiveUserIds : []);

        // ------------------------------------------------------------------
        // Aggregation Logic
        // ------------------------------------------------------------------

        // Helper: Monthly buckets
        const months = eachMonthOfInterval({
            start: startOfMonth(new Date(dateFrom)),
            end: endOfMonth(new Date(dateTo))
        });

        // 1. Trend & Comparison Data
        const chartData = months.map(date => {
            const monthKey = format(date, 'MMM yyyy');
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);

            // Base object
            const point = { name: monthKey, date: date.toISOString() };

            // Helper to aggregate based on filter
            const aggregateMetrics = (filteredDocs) => {
                let revenue = 0;
                let orders_count = 0;
                let quotes_value = 0;
                let quotes_count = 0;

                filteredDocs.forEach(d => {
                    if (d.doc_type === 'sales_order') {
                        // Revenue = Total Value of non-cancelled orders
                        if (d.status !== 'cancelled') {
                            revenue += (d.total_value || 0);
                            orders_count++;
                        }
                    } else if (d.doc_type === 'quotation') {
                        quotes_value += (d.total_value || 0);
                        quotes_count++;
                    }
                });
                return { revenue, orders_count, quotes_value, quotes_count };
            };

            // Calculate for each user (Comparison View Keys)
            if (effectiveUserIds.length > 0) {
                effectiveUserIds.forEach(uid => {
                    const userDocs = docs.filter(d =>
                        d.salesperson_user_id === uid &&
                        isWithinInterval(new Date(d.doc_date), { start: monthStart, end: monthEnd })
                    );

                    const metrics = aggregateMetrics(userDocs);

                    // Assign specific keys for this user
                    point[`revenue_${uid}`] = metrics.revenue;
                    point[`orders_${uid}`] = metrics.orders_count;
                    point[`quotes_val_${uid}`] = metrics.quotes_value;
                    point[`quotes_${uid}`] = metrics.quotes_count;

                    // Target
                    const year = date.getFullYear();
                    const targetRec = targetsData?.find(t => t.salesperson_user_id === uid && t.year === year);
                    point[`target_${uid}`] = targetRec ? targetRec.annual_target / 12 : 0;
                });
            }

            // Always calculate Aggregate (Trend View Keys)
            const monthDocs = docs.filter(d =>
                isWithinInterval(new Date(d.doc_date), { start: monthStart, end: monthEnd })
            );

            // If filtering by user, monthDocs is ALREADY filtered by the query above
            const totalMetrics = aggregateMetrics(monthDocs);

            point['revenue'] = totalMetrics.revenue;
            point['orders'] = totalMetrics.orders_count;
            point['quotations'] = totalMetrics.quotes_count; // Count
            point['quotations_value'] = totalMetrics.quotes_value; // Value
            point['conversion'] = totalMetrics.quotes_count > 0
                ? Math.round((totalMetrics.orders_count / totalMetrics.quotes_count) * 100)
                : 0;

            // Aggregate Target
            const year = date.getFullYear();
            const relevantTargets = targetsData?.filter(t => t.year === year) || [];
            point['target'] = relevantTargets.reduce((sum, t) => sum + (Number(t.annual_target) / 12), 0);

            return point;
        });

        // 2. Pie Chart Data (Status mix for selected range/users)
        // Fetch ALL docs (Quotes + SOs) for Pie Mix?
        // Reuse same query params but without doc_type filter? 
        // Let's do a separate quick query for Pie stats to include Quotations
        let pieQuery = supabase
            .from('documents')
            .select('status, doc_type')
            .gte('doc_date', dateFrom)
            .lte('doc_date', dateTo);

        if (effectiveUserIds.length > 0) {
            pieQuery = pieQuery.in('salesperson_user_id', effectiveUserIds);
        }

        const { data: pieDocs } = await pieQuery;

        const statusCounts = {};
        pieDocs?.forEach(d => {
            const s = d.status ? (d.status.charAt(0).toUpperCase() + d.status.slice(1)) : 'Unknown';
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

        // 3. User Map (for frontend key decoding)
        // If we used IDs as keys, we need to send names
        let userMap = {};
        if (effectiveUserIds.length > 0) {
            const { data: userProfiles } = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', effectiveUserIds);

            userProfiles?.forEach(p => {
                userMap[p.user_id] = p.full_name;
            });
        }

        return NextResponse.json({
            revenueTrend: chartData,
            pieData,
            userMap, // Send map so frontend knows "uuid-123" is "John Doe"
            meta: {
                effectiveUserIds, // helpful for debug
                isComparison: effectiveUserIds.length > 1
            }
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
