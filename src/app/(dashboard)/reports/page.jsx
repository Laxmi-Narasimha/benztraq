import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Reports Under Development</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>This feature is currently being built. Check back soon for:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Weekly/Monthly Sales Reports</li>
                        <li>Team Performance Summaries</li>
                        <li>Regional Analysis</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
