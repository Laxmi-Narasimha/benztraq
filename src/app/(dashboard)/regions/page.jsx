import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegionsPage() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Regions</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Regional Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Manage sales regions and territories here. (Coming Soon)</p>
                </CardContent>
            </Card>
        </div>
    );
}
