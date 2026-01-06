"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Package,
    MapPin,
    Target,
    RefreshCw,
    Calendar,
    DollarSign,
    ShoppingCart,
    FileText,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Treemap,
    FunnelChart,
    Funnel,
    LabelList
} from "recharts";

// Chart color palette
const COLORS = [
    "#3B82F6", // blue
    "#10B981", // emerald
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#84CC16"  // lime
];

// Format currency
const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
};

// Format percentage
const formatPercent = (value) => `${value}%`;

/**
 * Analytics Dashboard Page
 * 25+ visualizations for sales, regional, product, and customer analytics
 */
export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("this_month");
    const [selectedRegion, setSelectedRegion] = useState("all");

    // Dashboard data
    const [kpis, setKpis] = useState({
        totalRevenue: 0,
        quotationCount: 0,
        orderCount: 0,
        conversionRate: 0,
        avgOrderValue: 0,
        activeCustomers: 0
    });

    const [salesData, setSalesData] = useState([]);
    const [regionalData, setRegionalData] = useState([]);
    const [productData, setProductData] = useState([]);
    const [funnelData, setFunnelData] = useState([]);
    const [customerSegments, setCustomerSegments] = useState([]);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            // Simulate API call with sample data
            // In production, this would fetch from /api/dashboard/analytics

            // KPIs
            setKpis({
                totalRevenue: 25847500,
                quotationCount: 342,
                orderCount: 187,
                conversionRate: 54.7,
                avgOrderValue: 138220,
                activeCustomers: 89
            });

            // Monthly sales trend
            setSalesData([
                { month: "Apr", revenue: 1850000, orders: 12, quotes: 24 },
                { month: "May", revenue: 2120000, orders: 15, quotes: 28 },
                { month: "Jun", revenue: 1980000, orders: 14, quotes: 25 },
                { month: "Jul", revenue: 2340000, orders: 18, quotes: 32 },
                { month: "Aug", revenue: 2650000, orders: 21, quotes: 35 },
                { month: "Sep", revenue: 2480000, orders: 19, quotes: 30 },
                { month: "Oct", revenue: 2890000, orders: 23, quotes: 38 },
                { month: "Nov", revenue: 3120000, orders: 26, quotes: 42 },
                { month: "Dec", revenue: 2950000, orders: 22, quotes: 36 },
                { month: "Jan", revenue: 3280000, orders: 28, quotes: 45 }
            ]);

            // Regional performance
            setRegionalData([
                { region: "Madhya Pradesh", revenue: 4850000, orders: 32, target: 5000000, achievement: 97 },
                { region: "Maharashtra", revenue: 5620000, orders: 41, target: 5500000, achievement: 102 },
                { region: "Karnataka", revenue: 3980000, orders: 28, target: 4000000, achievement: 99.5 },
                { region: "Rajasthan", revenue: 3450000, orders: 25, target: 3500000, achievement: 98.6 },
                { region: "Noida", revenue: 4280000, orders: 35, target: 4500000, achievement: 95.1 },
                { region: "West Zone", revenue: 3667500, orders: 26, target: 4000000, achievement: 91.7 }
            ]);

            // Product mix
            setProductData([
                { name: "VCI Bags", value: 7250000, count: 145 },
                { name: "Wooden Pallets", value: 5480000, count: 89 },
                { name: "Corrugated Boxes", value: 4320000, count: 112 },
                { name: "VCI Films", value: 3850000, count: 78 },
                { name: "VCI Papers", value: 2180000, count: 65 },
                { name: "Desiccants", value: 1520000, count: 156 },
                { name: "Others", value: 1247500, count: 42 }
            ]);

            // Sales funnel
            setFunnelData([
                { stage: "Leads", value: 450, fill: "#3B82F6" },
                { stage: "Qualified", value: 342, fill: "#10B981" },
                { stage: "Quoted", value: 245, fill: "#F59E0B" },
                { stage: "Negotiation", value: 187, fill: "#8B5CF6" },
                { stage: "Won", value: 156, fill: "#EC4899" }
            ]);

            // Customer segments
            setCustomerSegments([
                { name: "Automotive", value: 35 },
                { name: "Machinery", value: 25 },
                { name: "Electronics", value: 18 },
                { name: "Pharmaceutical", value: 12 },
                { name: "Others", value: 10 }
            ]);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedRegion]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // KPI Card Component
    const KPICard = ({ title, value, change, changeType, icon: Icon, format = "number" }) => (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-1">
                            {format === "currency" ? formatCurrency(value) :
                                format === "percent" ? `${value}%` : value.toLocaleString()}
                        </p>
                        {change !== undefined && (
                            <div className={`flex items-center gap-1 text-sm mt-1 ${changeType === "positive" ? "text-emerald-600" : "text-red-600"
                                }`}>
                                {changeType === "positive" ?
                                    <ArrowUpRight className="h-4 w-4" /> :
                                    <ArrowDownRight className="h-4 w-4" />
                                }
                                {change}% from last month
                            </div>
                        )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">
                        Sales performance, regional insights, and business intelligence
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this_week">This Week</SelectItem>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="this_quarter">This Quarter</SelectItem>
                            <SelectItem value="this_year">This Year</SelectItem>
                            <SelectItem value="last_year">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchDashboardData}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={kpis.totalRevenue}
                    change={12.5}
                    changeType="positive"
                    icon={DollarSign}
                    format="currency"
                />
                <KPICard
                    title="Quotations"
                    value={kpis.quotationCount}
                    change={8.3}
                    changeType="positive"
                    icon={FileText}
                />
                <KPICard
                    title="Sales Orders"
                    value={kpis.orderCount}
                    change={15.2}
                    changeType="positive"
                    icon={ShoppingCart}
                />
                <KPICard
                    title="Conversion Rate"
                    value={kpis.conversionRate}
                    change={-2.1}
                    changeType="negative"
                    icon={TrendingUp}
                    format="percent"
                />
                <KPICard
                    title="Avg Order Value"
                    value={kpis.avgOrderValue}
                    change={5.8}
                    changeType="positive"
                    icon={Target}
                    format="currency"
                />
                <KPICard
                    title="Active Customers"
                    value={kpis.activeCustomers}
                    change={3.2}
                    changeType="positive"
                    icon={Users}
                />
            </div>

            {/* Tabs for different analytics sections */}
            <Tabs defaultValue="sales" className="space-y-6">
                <TabsList className="grid w-full max-w-xl grid-cols-4">
                    <TabsTrigger value="sales" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Sales
                    </TabsTrigger>
                    <TabsTrigger value="regional" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Regional
                    </TabsTrigger>
                    <TabsTrigger value="products" className="gap-2">
                        <Package className="h-4 w-4" />
                        Products
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="gap-2">
                        <Users className="h-4 w-4" />
                        Customers
                    </TabsTrigger>
                </TabsList>

                {/* Sales Analytics */}
                <TabsContent value="sales" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Trend */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Revenue Trend</CardTitle>
                                <CardDescription>Monthly revenue and order count</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={salesData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="month" />
                                        <YAxis tickFormatter={formatCurrency} />
                                        <Tooltip
                                            formatter={(value, name) => [
                                                name === "revenue" ? formatCurrency(value) : value,
                                                name === "revenue" ? "Revenue" : name === "orders" ? "Orders" : "Quotes"
                                            ]}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3B82F6"
                                            fill="url(#colorRevenue)"
                                            name="Revenue"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="orders"
                                            stroke="#10B981"
                                            strokeWidth={2}
                                            dot={{ fill: "#10B981" }}
                                            name="Orders"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Sales Funnel */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Sales Funnel</CardTitle>
                                <CardDescription>Lead to conversion pipeline</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <FunnelChart>
                                        <Tooltip />
                                        <Funnel
                                            dataKey="value"
                                            data={funnelData}
                                            isAnimationActive
                                        >
                                            <LabelList
                                                position="right"
                                                fill="#000"
                                                stroke="none"
                                                dataKey="stage"
                                            />
                                            {funnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Funnel>
                                    </FunnelChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Quotes vs Orders */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quotes vs Orders</CardTitle>
                                <CardDescription>Monthly comparison</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={salesData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="quotes" fill="#F59E0B" name="Quotations" />
                                        <Bar dataKey="orders" fill="#10B981" name="Orders" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Regional Analytics */}
                <TabsContent value="regional" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Regional Performance */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Regional Performance</CardTitle>
                                <CardDescription>Revenue vs target by region</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={regionalData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis type="number" tickFormatter={formatCurrency} />
                                        <YAxis dataKey="region" type="category" width={120} />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                                        <Bar dataKey="target" fill="#E5E7EB" name="Target" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Achievement Radar */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Target Achievement</CardTitle>
                                <CardDescription>% of target achieved by region</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={regionalData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="region" />
                                        <PolarRadiusAxis angle={30} domain={[0, 120]} />
                                        <Radar
                                            name="Achievement %"
                                            dataKey="achievement"
                                            stroke="#8B5CF6"
                                            fill="#8B5CF6"
                                            fillOpacity={0.5}
                                        />
                                        <Tooltip formatter={(value) => `${value}%`} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Orders by Region */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Orders by Region</CardTitle>
                                <CardDescription>Order distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={regionalData}
                                            dataKey="orders"
                                            nameKey="region"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {regionalData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Product Analytics */}
                <TabsContent value="products" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Product Revenue Treemap */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Product Revenue Mix</CardTitle>
                                <CardDescription>Revenue contribution by product category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <Treemap
                                        data={productData}
                                        dataKey="value"
                                        aspectRatio={4 / 3}
                                        stroke="#fff"
                                        fill="#3B82F6"
                                    >
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                    </Treemap>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Product Sales */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Products by Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={productData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis type="number" tickFormatter={formatCurrency} />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Bar dataKey="value" fill="#10B981" name="Revenue">
                                            {productData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Product Count */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Count by Product</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={productData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#F59E0B" name="Orders">
                                            {productData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Customer Analytics */}
                <TabsContent value="customers" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Industry Segments */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer by Industry</CardTitle>
                                <CardDescription>Industry-wise distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={customerSegments}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            label={({ name, value }) => `${name} (${value}%)`}
                                        >
                                            {customerSegments.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value}%`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Customer Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Metrics</CardTitle>
                                <CardDescription>Key customer statistics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">New Customers (This Month)</p>
                                        <p className="text-2xl font-bold">12</p>
                                    </div>
                                    <Badge variant="default" className="bg-emerald-500">+8%</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Repeat Customers</p>
                                        <p className="text-2xl font-bold">67%</p>
                                    </div>
                                    <Badge variant="default" className="bg-blue-500">+3%</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Customer LTV</p>
                                        <p className="text-2xl font-bold">₹8.5L</p>
                                    </div>
                                    <Badge variant="default" className="bg-violet-500">+12%</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">At-Risk Customers</p>
                                        <p className="text-2xl font-bold">5</p>
                                    </div>
                                    <Badge variant="destructive">Action Needed</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
