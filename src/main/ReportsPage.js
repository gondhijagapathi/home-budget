import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { IndianRupee, Camera, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { addDays, format } from 'date-fns';
import { getSpendingsByDateRange, getIncomes } from './api/apiCaller';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useTheme } from '@/components/theme-provider';
import { getHighchartsTheme } from './highchartsTheme';
import { resetDataInvalidated } from './store/mainDataSlice';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PaginationControls from './components/PaginationControls';

function resolveTheme(theme) {
    if (theme === 'dark' || theme === 'light') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ReportsPage = () => {
    const dispatch = useDispatch();
    const dataInvalidated = useSelector(state => state.mainData.dataInvalidated);
    const { theme } = useTheme();
    const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);

    const [date, setDate] = useState(() => {
        const savedFrom = localStorage.getItem('reportStartDate');
        const savedTo = localStorage.getItem('reportEndDate');
        return {
            from: savedFrom ? new Date(savedFrom) : addDays(new Date(), -30),
            to: savedTo ? new Date(savedTo) : new Date(),
        };
    });

    useEffect(() => {
        if (date?.from) localStorage.setItem('reportStartDate', date.from.toISOString());
        if (date?.to) localStorage.setItem('reportEndDate', date.to.toISOString());
    }, [date]);
    const [spendings, setSpendings] = useState([]);
    const [incomes, setIncomes] = useState([]);

    // Pagination states
    const [spendingPage, setSpendingPage] = useState(1);
    const [spendingTotalPages, setSpendingTotalPages] = useState(1);

    // Note: We might want pagination for top transactions, but KPIs and Charts need ALL data for the period.
    // The previous implementation fetched ALL data for charts by just filtering by date.
    // Now backend is paginated.
    // IMP: For Charts and KPIs, we typically need AGGREGATED data or ALL raw data.
    // Requesting page=1, limit=1000 (or huge number) for now to support Charts,
    // OR we should have a separate "analytics" API.
    // Given current scope, I'll fetch a large batch for charts/KPIs (simulating "all" within reason) or loop pages.
    // BUT since the user asked for pagination "for all table in this project and update backend",
    // logic implies we likely use paginated calls for the Tables, but we need ALL data for headers/charts.
    // Backend doesn't support "get all without limit" easily unless max limit is high.
    // WORKAROUND: I'll use a high limit for the "analysis" fetch, and standard limit for tables if they were separate.
    // However, ReportsPage usually loads EVERYTHING to compute local stats.
    // Changing that to server-side aggregation is a huge refactor not explicitly requested (only "impliment income source table").
    // I will fetch with a high limit (e.g. 2000) for the charts/KPIs to try and capture "all" for the selected month.

    const [loading, setLoading] = useState(false);

    // KPI Calculations
    const totalSpend = spendings.reduce((acc, item) => acc + item.amount, 0);
    const totalIncome = incomes.reduce((acc, item) => acc + item.amount, 0);
    const netSavings = totalIncome - totalSpend;

    // Processed Data States
    const [categoryPieData, setCategoryPieData] = useState([]);
    const [subCategoryBarData, setSubCategoryBarData] = useState({ categories: [], data: [] });
    const [dailyTrendData, setDailyTrendData] = useState({ dates: [], data: [] });
    const [topTransactions, setTopTransactions] = useState([]);

    const reportRef = useRef();

    const handleExportImage = () => {
        if (reportRef.current) {
            html2canvas(reportRef.current, { useCORS: true }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'home-budget-report.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };

    const baseChartOptions = useMemo(() => getHighchartsTheme(resolvedTheme), [resolvedTheme]);

    const pieChartOptions = useMemo(() => ({
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'pie', height: 300 },
        title: { text: 'Spending Breakdown', ...baseChartOptions.title, style: { fontSize: '16px' } },
        tooltip: { pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>' },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: { enabled: false },
                showInLegend: true
            }
        },
        series: [{ name: 'Share', data: categoryPieData }]
    }), [baseChartOptions, categoryPieData]);

    const barChartOptions = useMemo(() => ({
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'bar', height: 300 },
        title: { text: 'Top 5 Expenses', ...baseChartOptions.title, style: { fontSize: '16px' } },
        xAxis: { ...baseChartOptions.xAxis, categories: subCategoryBarData.categories },
        yAxis: { ...baseChartOptions.yAxis, title: { text: 'Amount' } },
        legend: { enabled: false },
        series: [{ name: 'Amount', data: subCategoryBarData.data }]
    }), [baseChartOptions, subCategoryBarData]);

    const lineChartOptions = useMemo(() => ({
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'spline', height: 300 },
        title: { text: 'Daily Trend', ...baseChartOptions.title, style: { fontSize: '16px' } },
        xAxis: { ...baseChartOptions.xAxis, categories: dailyTrendData.dates },
        yAxis: { ...baseChartOptions.yAxis, title: { text: 'Amount' } },
        legend: { enabled: false },
        series: [{ name: 'Spending', data: dailyTrendData.data }]
    }), [baseChartOptions, dailyTrendData]);


    useEffect(() => {
        const fetchData = async () => {
            if (date?.from && date?.to) {
                setLoading(true);
                const formattedStartDate = format(date.from, 'yyyy-MM-dd');
                const formattedEndDate = format(date.to, 'yyyy-MM-dd 23:59:59');

                try {
                    // Fetch Spendings (High limit for analytics)
                    const spendResponse = await getSpendingsByDateRange(formattedStartDate, formattedEndDate, 1, 10000);
                    const spendData = spendResponse.data || [];
                    setSpendings(spendData);

                    // Fetch Top 15 Largest Transactions (DB Sorted)
                    const topSpendResponse = await getSpendingsByDateRange(formattedStartDate, formattedEndDate, 1, 15, 'amount', 'DESC');
                    setTopTransactions(topSpendResponse.data || []);

                    // Fetch Incomes (High limit for analytics)
                    const incomeResponse = await getIncomes(formattedStartDate, formattedEndDate, 1, 10000);
                    const incomeData = incomeResponse.data || [];
                    setIncomes(incomeData);

                    // --- Processing for Charts (using spendData) ---

                    // 1. Pie Chart
                    const categoryMap = {};
                    spendData.forEach(item => {
                        categoryMap[item.categoryName] = (categoryMap[item.categoryName] || 0) + item.amount;
                    });
                    setCategoryPieData(Object.entries(categoryMap).map(([name, y]) => ({ name, y })));

                    // 2. Bar Chart
                    const subCategoryMap = {};
                    spendData.forEach(item => {
                        subCategoryMap[item.subCategoryName] = (subCategoryMap[item.subCategoryName] || 0) + item.amount;
                    });
                    const sortedSubCats = Object.entries(subCategoryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
                    setSubCategoryBarData({
                        categories: sortedSubCats.map(i => i[0]),
                        data: sortedSubCats.map(i => i[1])
                    });

                    // 3. Line Chart
                    const dateMap = {};
                    spendData.forEach(item => {
                        const day = item.dateOfSpending?.split(' ')[0] || 'Unknown';
                        dateMap[day] = (dateMap[day] || 0) + item.amount;
                    });
                    const sortedDates = Object.keys(dateMap).sort();
                    setDailyTrendData({
                        dates: sortedDates.map(d => format(new Date(d), 'MMM dd')),
                        data: sortedDates.map(d => dateMap[d])
                    });

                    // 4. Top Transactions
                    // Fetching separately now via getSpendingsByDateRange with 'amount' sort.
                    // See above.

                } catch (error) {
                    console.error("Error fetching report data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();

        if (dataInvalidated) {
            fetchData();
            dispatch(resetDataInvalidated());
        }

    }, [date, dataInvalidated, dispatch]);

    return (
        <div className="flex flex-col gap-6 relative" ref={reportRef}>
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="z-10">
                    <Button id="export-button" onClick={handleExportImage} variant="outline" size="sm">
                        <Camera className="mr-2 h-4 w-4" /> Export Dashboard
                    </Button>
                </div>
                <div className="z-10">
                    <DatePickerWithRange date={date} setDate={setDate} />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalSpend.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalIncome.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{netSavings.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
                    <CardContent>
                        <HighchartsReact highcharts={Highcharts} options={pieChartOptions} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Top Expenses</CardTitle></CardHeader>
                    <CardContent>
                        <HighchartsReact highcharts={Highcharts} options={barChartOptions} />
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Spending Trends</CardTitle></CardHeader>
                    <CardContent>
                        <HighchartsReact highcharts={Highcharts} options={lineChartOptions} />
                    </CardContent>
                </Card>

                {/* Top Transactions Table (Top 15) */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Largest Transactions (Top 15)</CardTitle>
                        <CardDescription>Highest value transactions in selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Subcategory</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topTransactions.length > 0 ? (
                                    topTransactions.map((item) => (
                                        <TableRow key={item.spendingId}>
                                            <TableCell>{format(new Date(item.dateOfSpending), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{item.categoryName}</TableCell>
                                            <TableCell>{item.subCategoryName}</TableCell>
                                            <TableCell>{item.userName}</TableCell>
                                            <TableCell className="text-right font-medium">₹{item.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">No transactions found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ReportsPage;