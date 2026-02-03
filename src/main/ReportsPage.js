import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { IndianRupee, Camera, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { addDays, format } from 'date-fns';
import { calculateKPIs, processChartData, processSankeyData, separateTransactions } from './utils/reportUtils';
import { getSpendingsByDateRange, getIncomes } from './api/apiCaller';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsSankey from 'highcharts/modules/sankey';
import { useTheme } from '@/components/theme-provider';
import { getHighchartsTheme } from './highchartsTheme';

import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PaginationControls from './components/PaginationControls';

function resolveTheme(theme) {
    if (theme === 'dark' || theme === 'light') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ReportsPage = () => {
    const dispatch = useDispatch();
    const lastUpdated = useSelector(state => state.mainData.lastUpdated);
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
    const [investments, setInvestments] = useState([]);
    const [assetBuilding, setAssetBuilding] = useState([]);
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
    const {
        totalSpend,
        totalInvestments,
        totalAssetBuilding,
        totalIncome,
        netSavings,
        cashAvailable,
        savingsRate,
        avgDailySpend
    } = useMemo(() => calculateKPIs(spendings, investments, assetBuilding, incomes, date), [spendings, investments, assetBuilding, incomes, date]);

    // Processed Data States
    const [categoryPieData, setCategoryPieData] = useState([]);
    const [subCategoryBarData, setSubCategoryBarData] = useState({ categories: [], data: [] });
    const [dailyTrendData, setDailyTrendData] = useState({ dates: [], spending: [], income: [] });
    const [sankeyData, setSankeyData] = useState([]);
    const [topTransactions, setTopTransactions] = useState([]);

    const reportRef = useRef();

    const handleExportImage = () => {
        if (reportRef.current) {
            toPng(reportRef.current, { cacheBust: true })
                .then((dataUrl) => {
                    const link = document.createElement('a');
                    link.download = 'home-budget-report.png';
                    link.href = dataUrl;
                    link.click();
                })
                .catch((err) => {
                    console.error('Failed to export dashboard:', err);
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
        title: { text: 'Cumulative Cash Flow (Month to Date)', ...baseChartOptions.title, style: { fontSize: '16px' } },
        xAxis: { ...baseChartOptions.xAxis, categories: dailyTrendData.dates },
        yAxis: { ...baseChartOptions.yAxis, title: { text: 'Amount' } },
        legend: { enabled: true },
        tooltip: { shared: true },
        series: [
            { name: 'Income', data: dailyTrendData.income, color: '#22c55e' }, // Green
            { name: 'Spending', data: dailyTrendData.spending, color: '#ef4444' } // Red
        ]
    }), [baseChartOptions, dailyTrendData]);

    const sankeyChartOptions = useMemo(() => {
        const dynamicHeight = Math.max(400, sankeyData.length * 30);
        return {
            ...baseChartOptions,
            chart: { ...baseChartOptions.chart, type: 'sankey', height: dynamicHeight },
            title: { text: 'Financial Flow (Income > Wallet > Spending)', ...baseChartOptions.title, style: { fontSize: '16px' } },
            tooltip: {
                headerFormat: null,
                pointFormat: '{point.fromNode.name} \u2192 {point.toNode.name}: <b>₹{point.weight:.2f}</b>',
                nodeFormat: '{point.name}: <b>₹{point.sum:.2f}</b>'
            },
            series: [{
                keys: ['from', 'to', 'weight'],
                data: sankeyData,
                type: 'sankey',
                name: 'Financial Flow',
                colorByPoint: true
            }],
            plotOptions: {
                sankey: {
                    dataLabels: {
                        enabled: true,
                        nodeFormat: '{point.name}',
                        style: {
                            fontSize: '12px',
                            color: baseChartOptions.title?.style?.color || (resolvedTheme === 'dark' ? '#cccccc' : '#333333'),
                            textOutline: 'none',
                            fontWeight: 'normal'
                        }
                    }
                }
            },
            xAxis: { visible: false },
            yAxis: { visible: false }
        };
    }, [baseChartOptions, sankeyData]);


    useEffect(() => {
        const fetchData = async () => {
            if (date?.from && date?.to) {
                setLoading(true);
                const formattedStartDate = format(date.from, 'yyyy-MM-dd');
                const formattedEndDate = format(date.to, 'yyyy-MM-dd 23:59:59');

                try {
                    // Fetch Spendings (High limit for analytics)
                    const spendResponse = await getSpendingsByDateRange(formattedStartDate, formattedEndDate, 1, 10000);
                    const allSpendData = spendResponse.data || [];

                    // Separate Investments and Expenses
                    const { expenses: expensesData, investments: investmentsData, assetBuilding: assetBuildingData } = separateTransactions(allSpendData);

                    setSpendings(expensesData);
                    setInvestments(investmentsData);
                    setAssetBuilding(assetBuildingData);

                    // Fetch Top 15 Largest Transactions (DB Sorted)
                    // We now want ALL transactions (investments, asset building, expenses) in the top list
                    const sortedExpenses = [...allSpendData].sort((a, b) => b.amount - a.amount).slice(0, 15);
                    setTopTransactions(sortedExpenses);

                    // Fetch Incomes (High limit for analytics)
                    const incomeResponse = await getIncomes(formattedStartDate, formattedEndDate, 1, 10000);
                    const incomeData = incomeResponse.data || [];
                    setIncomes(incomeData);

                    // --- Processing for Charts (using expensesData) ---
                    // --- Processing for Charts (using expensesData) ---
                    // processChartData now takes (expenses, allSpendings, incomes)
                    // We pass 'allSpendData' (raw fetch result) for the Line Chart (Spending Trends)
                    const { pieData, barData, lineData } = processChartData(expensesData, allSpendData, incomeData);
                    // Financial Flow should show ALL data (Expenses + Investments + Asset Building)
                    const sankeyLinks = processSankeyData(allSpendData, incomeData);

                    setCategoryPieData(pieData);
                    setSubCategoryBarData(barData);
                    setDailyTrendData(lineData);
                    setSankeyData(sankeyLinks);

                } catch (error) {
                    console.error("Error fetching report data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        if (date?.from && date?.to) {
            fetchData();
        }
    }, [date, lastUpdated, dispatch]);

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
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        <CardTitle className="text-sm font-medium">Total Spending (Excl. Inv & Asset)</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalSpend.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            ~ ₹{avgDailySpend.toFixed(0)} / day
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Asset Building</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalAssetBuilding.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Investments</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalInvestments.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cash Available</CardTitle>
                        <Wallet className="h-4 w-4 text-teal-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${cashAvailable >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{cashAvailable.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            (Liquid Cash)
                        </p>
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
                        <p className="text-xs text-muted-foreground mt-1">
                            {savingsRate.toFixed(1)}% savings rate
                        </p>
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

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Financial Flow</CardTitle>
                        <CardDescription>Visualizing how money moves from Income Sources to Expenses & Savings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HighchartsReact highcharts={Highcharts} options={sankeyChartOptions} />
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