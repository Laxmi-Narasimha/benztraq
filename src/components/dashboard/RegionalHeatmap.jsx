'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RegionalHeatmap({ data }) {
    if (!data || data.length === 0) return null;

    const maxVal = Math.max(...data.map(d => d.value));

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-stone-700">Regional Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                        {data.map((region) => (
                            <div key={region.code} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-stone-700">{region.code}</span>
                                    <span className="text-stone-500">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(region.value)}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-neutral-900 rounded-full"
                                        style={{ width: `${(region.value / maxVal) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
