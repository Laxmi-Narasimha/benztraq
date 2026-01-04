import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomersPage() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Customer Directory</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Customer relationships management is under construction.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
