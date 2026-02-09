'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, FileText, IndianRupee } from 'lucide-react';

export function KPICards({ kpi }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-neutral-900 text-white border-neutral-900 shadow-premium">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-neutral-400 text-sm font-medium mb-1 uppercase tracking-wider">Total Revenue</p>
                        <h3 className="text-3xl font-bold tracking-tight text-white">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(kpi?.totalRevenue || 0)}
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <IndianRupee className="w-5 h-5 text-white" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white border-neutral-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-neutral-500 text-sm font-medium mb-1 uppercase tracking-wider">Active Pipeline</p>
                        <h3 className="text-3xl font-bold tracking-tight text-neutral-900">{kpi?.pipelineCount || 0}</h3>
                        <p className="text-xs text-neutral-400 mt-1">Quotations Sent/Draft</p>
                    </div>
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center border border-neutral-200">
                        <FileText className="w-5 h-5 text-neutral-600" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white border-neutral-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-neutral-500 text-sm font-medium mb-1 uppercase tracking-wider">Active Customers</p>
                        <h3 className="text-3xl font-bold tracking-tight text-neutral-900">{kpi?.activeCustomers || 0}</h3>
                        <p className="text-xs text-neutral-400 mt-1">Placed orders this year</p>
                    </div>
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center border border-neutral-200">
                        <Users className="w-5 h-5 text-neutral-600" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
