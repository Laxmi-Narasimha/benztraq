import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductsPage() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Product Catalog</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Product management features are coming soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
