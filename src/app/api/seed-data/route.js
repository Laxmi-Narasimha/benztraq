import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    // 1. Get all ASMs (users)
    const { data: users } = await supabase.from('profiles').select('user_id, full_name, role');
    if (!users || users.length === 0) return NextResponse.json({ error: 'No users found' });

    const customerNames = [
        'Maruti Suzuki', 'Tata Motors', 'Mahindra & Mahindra', 'Hero MotoCorp', 'Bajaj Auto',
        'Ashok Leyland', 'TVS Motor', 'Eicher Motors', 'Force Motors', 'SML Isuzu',
        'Honda Cars India', 'Hyundai Motor India', 'Toyota Kirloskar', 'Kia India', 'MG Motor',
        'Renault India', 'Skoda Auto Volkswagen', 'Nissan Motor India', 'PCA Motors', 'FCA India'
    ];

    const states = ['KA', 'MH', 'DL', 'TN', 'HR', 'GJ', 'UP', 'WB'];

    const report = [];

    // 2. Generate Data for current year
    const currentYear = new Date().getFullYear();

    for (const user of users) {
        // Only seed for sales roles
        if (!['vp', 'director', 'asm'].includes(user.role)) continue;

        let totalRevenue = 0;
        const numOrders = Math.floor(Math.random() * 15) + 5; // 5-20 orders per user

        for (let i = 0; i < numOrders; i++) {
            const isSale = Math.random() > 0.3; // 70% Sales, 30% Quotes
            const status = isSale ? 'sale' : (Math.random() > 0.5 ? 'sent' : 'draft');

            const month = Math.floor(Math.random() * 12); // 0-11
            const day = Math.floor(Math.random() * 28) + 1;
            const date = new Date(currentYear, month, day);

            const amount = Math.floor(Math.random() * 500000) + 50000; // 50k - 5.5L
            const customer = customerNames[Math.floor(Math.random() * customerNames.length)];
            const state = states[Math.floor(Math.random() * states.length)];

            // Create Order/Quote
            const { error } = await supabase.from('sales_orders').insert({
                name: `SO-${currentYear}-${Math.floor(Math.random() * 10000)}`,
                date_order: date.toISOString(),
                state: status === 'sale' ? 'sale' : 'draft', // Maps to sales_order state
                user_id: user.user_id,
                partner_id: `partner_${Math.floor(Math.random() * 1000)}`, // Dummy partner ID
                amount_total: amount,
                amount_untaxed: amount * 0.82, // Approx
                amount_tax: amount * 0.18,
                partner_invoice_id: `addr_${Math.floor(Math.random() * 1000)}`,
                partner_shipping_id: `addr_${Math.floor(Math.random() * 1000)}`,
                company_id: 1, // Default company
                currency_id: 20, // INR
                validity_date: new Date(date.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                note: 'Synthetic Data',
                partner_state_code: state // For Heatmap
            });

            if (status !== 'sale') {
                // Also insert into quotations table if it's a quote (conceptually)
                // However, our system might split them. 
                // For the "Funnel", we check `quotations.status` AND `sales_orders`

                await supabase.from('quotations').insert({
                    name: `QT-${currentYear}-${Math.floor(Math.random() * 10000)}`,
                    date_order: date.toISOString(),
                    status: status,
                    user_id: user.user_id,
                    customer_name: customer,
                    amount_total: amount,
                    validity_date: new Date(date.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                    note: 'Synthetic Data'
                });
            }

            if (!error) totalRevenue += isSale ? amount : 0;
        }
        report.push({ user: user.full_name, orders: numOrders, revenue: totalRevenue });
    }

    return NextResponse.json({ success: true, report });
}
