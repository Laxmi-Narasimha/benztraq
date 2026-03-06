/**
 * Sales Performance Analytics API
 * 
 * Enterprise-grade analytics engine inspired by Salesforce, HubSpot, Infor CRM.
 * Returns 30+ metrics per ASM including projections, pipeline health, velocity.
 * 
 * @module api/sales-performance
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';
import { isManager, isHeadOfSales, SYSTEM_USERS } from '@/lib/utils/rbac';

export const dynamic = 'force-dynamic';

// ============================================================================
// CONSTANTS
// ============================================================================

// Build email→region mapping from ASM definitions
const ASM_EMAIL_MAP = {};
SYSTEM_USERS.ASMS.forEach(asm => { ASM_EMAIL_MAP[asm.email] = asm.name; });
const ASM_EMAILS = Object.keys(ASM_EMAIL_MAP);

// Stage probabilities for weighted pipeline (Salesforce-style)
const STAGE_PROBABILITIES = {
    draft: 0.10,
    sent: 0.30,
    negotiation: 0.60,
    won: 1.0,
    lost: 0,
    cancelled: 0,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================================
// STATISTICAL HELPERS
// ============================================================================

/** Linear regression (least squares) */
function linearRegression(points) {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: 0, predict: () => 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (const { x, y } of points) {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    }

    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return { slope: 0, intercept: sumY / n, predict: () => sumY / n };

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    return {
        slope,
        intercept,
        predict: (x) => Math.max(0, slope * x + intercept),
    };
}

/** Weighted Moving Average (recent months weighted more) */
function weightedMovingAvg(values, weights = null) {
    if (!values.length) return 0;
    if (!weights) {
        weights = values.map((_, i) => {
            const third = Math.floor(values.length / 3);
            if (i >= values.length - third) return 3;
            if (i >= values.length - 2 * third) return 2;
            return 1;
        });
    }
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedSum = values.reduce((acc, v, i) => acc + v * weights[i], 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/** Standard deviation */
function stdDev(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sqDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

/** Activity Score (0-100 composite) */
function calcActivityScore(visits, quotes, orders, conversionImprovement) {
    const visitScore = Math.min(visits / 30, 1) * 40;
    const quoteScore = Math.min(quotes / 10, 1) * 30;
    const orderScore = Math.min(orders / 5, 1) * 20;
    const improvementScore = Math.min(Math.max(conversionImprovement, 0) / 10, 1) * 10;
    return Math.round(visitScore + quoteScore + orderScore + improvementScore);
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
        const selectedUserId = searchParams.get('user_id');
        const userIsManager = isManager(currentUser.role);

        const supabase = createAdminClient();

        // =====================================================================
        // STEP 1: Get ASM profiles by EMAIL (reliable across name changes)
        // =====================================================================
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, role')
            .in('email', ASM_EMAILS)
            .eq('is_active', true);

        // Map email → profile, add region name
        const profileMap = {};
        (profiles || []).forEach(p => {
            if (!profileMap[p.email] && p.email) {
                profileMap[p.email] = {
                    ...p,
                    region: ASM_EMAIL_MAP[p.email] || p.full_name,
                };
            }
        });
        const asmProfiles = Object.values(profileMap);

        // If ASM, only show own data. Managers and Head of Sales see all ASMs.
        const canSeeAllASMs = userIsManager || isHeadOfSales(currentUser.role);

        const targetProfiles = canSeeAllASMs
            ? (selectedUserId ? asmProfiles.filter(p => p.user_id === selectedUserId) : asmProfiles)
            : asmProfiles.filter(p => p.user_id === currentUser.id);

        // Also include ASMs who are not in the email list but are logged-in ASMs viewing themselves
        if (!userIsManager && targetProfiles.length === 0) {
            targetProfiles.push({ user_id: currentUser.id, full_name: currentUser.full_name, email: currentUser.email, region: currentUser.full_name });
        }

        const targetUserIds = targetProfiles.map(p => p.user_id);

        if (targetUserIds.length === 0) {
            return NextResponse.json({
                success: true,
                asmData: [],
                availableAsms: asmProfiles.map(p => ({ id: p.user_id, name: p.full_name })),
                isManager: userIsManager,
                canSeeAllASMs,
                year,
            });
        }

        // =====================================================================
        // STEP 2: Fetch all data in parallel
        // =====================================================================
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const [visitsResult, quotationsResult, salesOrdersResult, targetsResult, snapshotsResult] = await Promise.all([
            // Visits
            supabase.from('sales_visits')
                .select('*')
                .in('user_id', targetUserIds)
                .gte('visit_date', startDate)
                .lte('visit_date', endDate),
            // Quotations
            supabase.from('documents')
                .select('id, salesperson_user_id, grand_total, doc_date, state, created_at, customer_name_raw')
                .eq('doc_type', 'quotation')
                .in('salesperson_user_id', targetUserIds)
                .gte('doc_date', startDate)
                .lte('doc_date', endDate),
            // Sales Orders
            supabase.from('documents')
                .select('id, salesperson_user_id, grand_total, doc_date, state, created_at, original_quotation_id, customer_name_raw')
                .eq('doc_type', 'sales_order')
                .in('salesperson_user_id', targetUserIds)
                .gte('doc_date', startDate)
                .lte('doc_date', endDate),
            // Targets
            supabase.from('annual_targets')
                .select('*')
                .eq('year', year)
                .in('salesperson_user_id', targetUserIds),
            // Monthly snapshots (precomputed)
            supabase.from('asm_monthly_snapshots')
                .select('*')
                .eq('year', year)
                .in('user_id', targetUserIds)
                .order('month', { ascending: true }),
        ]);

        const allVisits = visitsResult.data || [];
        const allQuotations = quotationsResult.data || [];
        const allSalesOrders = salesOrdersResult.data || [];
        const allTargets = targetsResult.data || [];
        const allSnapshots = snapshotsResult.data || [];

        // =====================================================================
        // STEP 3: Compute per-ASM metrics
        // =====================================================================
        const currentMonth = new Date().getMonth() + 1;
        const elapsedMonths = Math.max(1, currentMonth);

        const asmData = targetProfiles.map(profile => {
            const uid = profile.user_id;
            const name = profile.region || profile.full_name;

            // Filter data for this ASM
            const visits = allVisits.filter(v => v.user_id === uid);
            const quotations = allQuotations.filter(q => q.salesperson_user_id === uid);
            const salesOrders = allSalesOrders.filter(o => o.salesperson_user_id === uid);
            const target = allTargets.find(t => t.salesperson_user_id === uid);
            const snapshots = allSnapshots.filter(s => s.user_id === uid);

            // --- Tier 1: Input Metrics ---
            const totalVisits = visits.length;
            const uniqueCustomersVisited = new Set(visits.map(v => v.customer_id || v.customer_name).filter(Boolean)).size;
            const visitsByType = {};
            visits.forEach(v => { visitsByType[v.visit_type] = (visitsByType[v.visit_type] || 0) + 1; });
            const visitsByOutcome = {};
            visits.forEach(v => { visitsByOutcome[v.outcome] = (visitsByOutcome[v.outcome] || 0) + 1; });

            // --- Tier 2: Pipeline & Revenue ---
            const totalQuotations = quotations.length;
            const quotationValue = quotations.reduce((s, q) => s + (parseFloat(q.grand_total) || 0), 0);
            const totalOrders = salesOrders.length;
            const revenue = salesOrders.reduce((s, o) => s + (parseFloat(o.grand_total) || 0), 0);

            // Weighted pipeline (open quotes × stage probability)
            const openQuotes = quotations.filter(q => q.state !== 'won' && q.state !== 'lost' && q.state !== 'cancelled');
            const weightedPipeline = openQuotes.reduce((sum, q) => {
                const prob = STAGE_PROBABILITIES[q.state] || 0.10;
                return sum + (parseFloat(q.grand_total) || 0) * prob;
            }, 0);

            // Target & coverage
            const annualTarget = target ? parseFloat(target.annual_target) || 0 : 0;
            const remainingTarget = Math.max(0, annualTarget - revenue);
            const pipelineCoverage = remainingTarget > 0 ? weightedPipeline / remainingTarget : 0;

            // --- Tier 3: Efficiency ---
            const visitToQuoteRate = totalVisits > 0 ? (totalQuotations / totalVisits) * 100 : 0;
            const quoteToOrderRate = totalQuotations > 0 ? (totalOrders / totalQuotations) * 100 : 0;
            const overallConversion = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
            const revenuePerVisit = totalVisits > 0 ? revenue / totalVisits : 0;
            const avgDealSize = totalOrders > 0 ? revenue / totalOrders : 0;

            // --- Tier 4: Velocity ---
            // Calculate avg days to close (quote created → SO created)
            let totalDaysToClose = 0;
            let closedCount = 0;
            salesOrders.forEach(so => {
                if (so.original_quotation_id) {
                    const origQuote = quotations.find(q => q.id === so.original_quotation_id);
                    if (origQuote) {
                        const days = Math.max(0, (new Date(so.doc_date) - new Date(origQuote.doc_date)) / 86400000);
                        totalDaysToClose += days;
                        closedCount++;
                    }
                }
            });
            const avgDaysToClose = closedCount > 0 ? totalDaysToClose / closedCount : 0;
            const winRate = totalQuotations > 0 ? totalOrders / totalQuotations : 0;
            const salesVelocity = avgDaysToClose > 0
                ? (totalQuotations * avgDealSize * winRate) / avgDaysToClose
                : 0;

            // Stale deals (no activity 14+ days)
            const now = new Date();
            const staleDealCount = openQuotes.filter(q => {
                const created = new Date(q.created_at);
                return (now - created) / 86400000 > 14;
            }).length;

            // Deal aging distribution
            const dealAging = { '0-7d': 0, '7-14d': 0, '14-30d': 0, '30d+': 0 };
            openQuotes.forEach(q => {
                const days = (now - new Date(q.created_at)) / 86400000;
                if (days <= 7) dealAging['0-7d']++;
                else if (days <= 14) dealAging['7-14d']++;
                else if (days <= 30) dealAging['14-30d']++;
                else dealAging['30d+']++;
            });

            // Pipeline health score (0-100 composite)
            const coverageScore = Math.min(pipelineCoverage / 3, 1) * 30;
            const velocityScore = Math.min(salesVelocity / 500000, 1) * 25;
            const agingPenalty = staleDealCount > 3 ? -10 : staleDealCount > 0 ? -5 : 0;
            const convScore = Math.min(quoteToOrderRate / 50, 1) * 25;
            const activityPart = Math.min(totalVisits / 50, 1) * 20;
            const pipelineHealthScore = Math.max(0, Math.min(100,
                Math.round(coverageScore + velocityScore + agingPenalty + convScore + activityPart)));

            // --- Tier 5: Projections ---
            const quotaAttainment = annualTarget > 0 ? (revenue / annualTarget) * 100 : 0;
            const runRateProjection = (revenue / elapsedMonths) * 12;
            const gapToTarget = annualTarget - runRateProjection;

            // Monthly breakdown for trend
            const monthlyRevenue = Array(12).fill(0);
            const monthlyQuotes = Array(12).fill(0);
            const monthlyOrders = Array(12).fill(0);
            const monthlyVisits = Array(12).fill(0);

            salesOrders.forEach(o => {
                const m = new Date(o.doc_date).getMonth();
                monthlyRevenue[m] += parseFloat(o.grand_total) || 0;
                monthlyOrders[m]++;
            });
            quotations.forEach(q => {
                const m = new Date(q.doc_date).getMonth();
                monthlyQuotes[m]++;
            });
            visits.forEach(v => {
                const m = new Date(v.visit_date).getMonth();
                monthlyVisits[m]++;
            });

            // Linear regression on monthly revenue
            const actualMonths = monthlyRevenue.slice(0, currentMonth).map((v, i) => ({ x: i + 1, y: v }));
            const regression = linearRegression(actualMonths);

            // Projected revenue for each month
            const projectedRevenue = Array(12).fill(0);
            for (let i = 0; i < 12; i++) {
                projectedRevenue[i] = i < currentMonth
                    ? monthlyRevenue[i]
                    : regression.predict(i + 1);
            }
            const linearProjectionTotal = projectedRevenue.reduce((a, b) => a + b, 0);

            // Weighted moving average projection
            const actualValues = monthlyRevenue.slice(0, currentMonth).filter(v => v > 0);
            const wma = weightedMovingAvg(actualValues);
            const wmaProjection = revenue + wma * (12 - currentMonth);

            // Confidence band
            const monthlyStdDev = stdDev(actualValues);
            const confidenceHigh = Math.max(linearProjectionTotal, wmaProjection) + monthlyStdDev * (12 - currentMonth);
            const confidenceLow = Math.max(0, Math.min(linearProjectionTotal, wmaProjection) - monthlyStdDev * (12 - currentMonth));

            // Target hit probability
            const avgProjection = (runRateProjection + linearProjectionTotal + wmaProjection) / 3;
            let targetHitProbability = 0;
            if (annualTarget > 0) {
                const ratio = avgProjection / annualTarget;
                targetHitProbability = Math.min(99, Math.max(1, Math.round(ratio * 100)));
            }

            // Forecast categories (Salesforce-style)
            const forecastCategories = {
                closed: revenue,
                commit: weightedPipeline * 0.9,
                bestCase: weightedPipeline * 0.5,
                pipeline: quotationValue - weightedPipeline,
            };

            // --- Tier 6: Activity Score & Coaching ---
            // Win rate trend (compare last 3 months vs prior 3 months)
            let recentWinRate = 0, priorWinRate = 0;
            if (currentMonth >= 3) {
                const recentQuotes = quotations.filter(q => new Date(q.doc_date).getMonth() >= currentMonth - 3);
                const recentSOs = salesOrders.filter(o => new Date(o.doc_date).getMonth() >= currentMonth - 3);
                recentWinRate = recentQuotes.length > 0 ? (recentSOs.length / recentQuotes.length) * 100 : 0;

                if (currentMonth >= 6) {
                    const priorQuotes = quotations.filter(q => {
                        const m = new Date(q.doc_date).getMonth();
                        return m >= currentMonth - 6 && m < currentMonth - 3;
                    });
                    const priorSOs = salesOrders.filter(o => {
                        const m = new Date(o.doc_date).getMonth();
                        return m >= currentMonth - 6 && m < currentMonth - 3;
                    });
                    priorWinRate = priorQuotes.length > 0 ? (priorSOs.length / priorQuotes.length) * 100 : 0;
                }
            }
            const winRateTrend = recentWinRate - priorWinRate;

            const activityScore = calcActivityScore(totalVisits, totalQuotations, totalOrders, winRateTrend);

            // Coaching priority
            let coachingPriority = 'on_track';
            if (activityScore < 30 && quoteToOrderRate < 20) coachingPriority = 'needs_attention';
            else if (activityScore < 50 && quoteToOrderRate < 30) coachingPriority = 'monitor';

            // Coaching insights
            const coachingInsights = [];
            if (totalVisits < 10) coachingInsights.push('Low visit activity — increase field visits to generate more pipeline');
            if (visitToQuoteRate < 20) coachingInsights.push('Low visit-to-quote conversion — focus on qualifying prospects better before visiting');
            if (quoteToOrderRate < 15) coachingInsights.push('Low quote-to-order rate — work on negotiation and follow-up techniques');
            if (staleDealCount > 3) coachingInsights.push(`${staleDealCount} stale deals need follow-up — prioritize re-engagement`);
            if (avgDaysToClose > 30) coachingInsights.push('High average closing time — focus on faster deal progression');
            if (pipelineCoverage < 1) coachingInsights.push('Pipeline coverage below 1× — need more qualified opportunities');
            if (quotaAttainment > 80) coachingInsights.push('Great progress towards target! Keep up the momentum');

            // Monthly trend data for charts
            const monthlyTrend = MONTHS.map((label, i) => ({
                month: label,
                monthNum: i + 1,
                revenue: monthlyRevenue[i],
                quotations: monthlyQuotes[i],
                orders: monthlyOrders[i],
                visits: monthlyVisits[i],
                projected: projectedRevenue[i],
                target: annualTarget / 12,
            }));

            return {
                id: uid,
                name,
                email: profile.email,
                // Tier 1
                totalVisits,
                uniqueCustomersVisited,
                visitsByType,
                visitsByOutcome,
                // Tier 2
                totalQuotations,
                quotationValue,
                totalOrders,
                revenue,
                weightedPipeline,
                pipelineCoverage: Math.round(pipelineCoverage * 100) / 100,
                // Tier 3
                visitToQuoteRate: Math.round(visitToQuoteRate * 10) / 10,
                quoteToOrderRate: Math.round(quoteToOrderRate * 10) / 10,
                overallConversion: Math.round(overallConversion * 10) / 10,
                revenuePerVisit: Math.round(revenuePerVisit),
                avgDealSize: Math.round(avgDealSize),
                customerPenetration: uniqueCustomersVisited,
                // Tier 4
                avgDaysToClose: Math.round(avgDaysToClose * 10) / 10,
                salesVelocity: Math.round(salesVelocity),
                staleDealCount,
                dealAging,
                pipelineHealthScore,
                winRate: Math.round(winRate * 100),
                winRateTrend: Math.round(winRateTrend * 10) / 10,
                // Tier 5
                annualTarget,
                quotaAttainment: Math.round(quotaAttainment * 10) / 10,
                runRateProjection: Math.round(runRateProjection),
                linearProjection: Math.round(linearProjectionTotal),
                wmaProjection: Math.round(wmaProjection),
                gapToTarget: Math.round(gapToTarget),
                targetHitProbability,
                confidenceHigh: Math.round(confidenceHigh),
                confidenceLow: Math.round(confidenceLow),
                forecastCategories,
                // Tier 6
                activityScore,
                coachingPriority,
                coachingInsights,
                // Chart data
                monthlyTrend,
                // Open quotes state distribution
                quoteStateDistribution: {
                    draft: quotations.filter(q => q.state === 'draft').length,
                    sent: quotations.filter(q => q.state === 'sent').length,
                    negotiation: quotations.filter(q => !['draft', 'sent', 'won', 'lost', 'cancelled'].includes(q.state)).length,
                    won: totalOrders,
                    lost: quotations.filter(q => q.state === 'lost').length,
                },
            };
        });

        // =====================================================================
        // STEP 4: Aggregate stats
        // =====================================================================
        const totals = {
            totalVisits: asmData.reduce((s, a) => s + a.totalVisits, 0),
            totalQuotations: asmData.reduce((s, a) => s + a.totalQuotations, 0),
            totalOrders: asmData.reduce((s, a) => s + a.totalOrders, 0),
            totalRevenue: asmData.reduce((s, a) => s + a.revenue, 0),
            totalTarget: asmData.reduce((s, a) => s + a.annualTarget, 0),
            avgActivityScore: asmData.length > 0 ? Math.round(asmData.reduce((s, a) => s + a.activityScore, 0) / asmData.length) : 0,
            avgQuotaAttainment: asmData.length > 0 ? Math.round(asmData.reduce((s, a) => s + a.quotaAttainment, 0) / asmData.length * 10) / 10 : 0,
        };

        return NextResponse.json({
            success: true,
            asmData,
            totals,
            availableAsms: asmProfiles.map(p => ({ id: p.user_id, name: p.region || p.full_name })),
            isManager: userIsManager,
            canSeeAllASMs,
            year,
            currentMonth,
        });

    } catch (error) {
        console.error('[Sales Performance API] Fatal:', error.message, error.stack);
        return NextResponse.json({
            success: false,
            error: error.message,
            asmData: [],
            totals: {},
            availableAsms: [],
        }, { status: 200 });
    }
}
