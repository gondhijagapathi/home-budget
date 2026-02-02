import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { IndianRupee, Camera } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { addDays, format, parseISO } from 'date-fns';
import { getSpendingsByDateRange } from './api/apiCaller';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useTheme } from '@/components/theme-provider';
import { getHighchartsTheme } from './highchartsTheme';
import { resetDataInvalidated } from './store/mainDataSlice';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function resolveTheme(theme) {
    if (theme === 'dark' || theme === 'light') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ReportsPage = () => {
    const dispatch = useDispatch();
    const dataInvalidated = useSelector(state => state.mainData.dataInvalidated);
    const { theme } = useTheme();
    const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);

    const [date, setDate] = useState({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [spendings, setSpendings] = useState([]);

    // Processed Data States
    const [categoryPieData, setCategoryPieData] = useState([]);
    const [subCategoryBarData, setSubCategoryBarData] = useState({ categories: [], data: [] });
    const [dailyTrendData, setDailyTrendData] = useState({ dates: [], data: [] });
    const [topTransactions, setTopTransactions] = useState([]);

    const [loading, setLoading] = useState(false);
    const totalSpend = spendings.reduce((acc, item) => acc + item.amount, 0);

    const reportRef = useRef();

    const handleExportImage = () => {
        if (reportRef.current) {
            const computedStyle = window.getComputedStyle(reportRef.current);
            let backgroundColor = computedStyle.backgroundColor;
            if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
                backgroundColor = window.getComputedStyle(document.body).backgroundColor;
                if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
                    backgroundColor = '#ffffff';
                }
            }

            const exportButton = document.getElementById('export-button');
            const datePickerTrigger = document.getElementById('date-picker-range');

            let originalExportButtonDisplay = '';
            let originalDatePickerBorder = '';

            if (exportButton) {
                originalExportButtonDisplay = exportButton.style.display;
                exportButton.style.display = 'none';
            }
            if (datePickerTrigger) {
                originalDatePickerBorder = datePickerTrigger.style.border;
                datePickerTrigger.style.border = 'none';
            }

            html2canvas(reportRef.current, {
                backgroundColor: backgroundColor,
                useCORS: true,
            }).then(canvas => {
                if (exportButton) {
                    exportButton.style.display = originalExportButtonDisplay;
                }
                if (datePickerTrigger) {
                    datePickerTrigger.style.border = originalDatePickerBorder;
                }

                const link = document.createElement('a');
                link.download = 'home-budget-report.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };

    // --- Chart Options Generators ---

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
                dataLabels: { enabled: false }, // Cleaner look
                showInLegend: true
            }
        },
        series: [{ name: 'Share', data: categoryPieData }]
    }), [baseChartOptions, categoryPieData]);

    const barChartOptions = useMemo(() => ({
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'bar', height: 300 },
        title: { text: 'Top 5 Expensive Sub-Categories', ...baseChartOptions.title, style: { fontSize: '16px' } },
        xAxis: { ...baseChartOptions.xAxis, categories: subCategoryBarData.categories },
        yAxis: { ...baseChartOptions.yAxis, title: { text: 'Amount' } },
        legend: { enabled: false },
        series: [{ name: 'Amount', data: subCategoryBarData.data }]
    }), [baseChartOptions, subCategoryBarData]);

    const lineChartOptions = useMemo(() => ({
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'spline', height: 300 },
        title: { text: 'Daily Spending Trend', ...baseChartOptions.title, style: { fontSize: '16px' } },
        xAxis: { ...baseChartOptions.xAxis, categories: dailyTrendData.dates },
        yAxis: { ...baseChartOptions.yAxis, title: { text: 'Amount' } },
        legend: { enabled: false },
        series: [{ name: 'Spending', data: dailyTrendData.data }]
    }), [baseChartOptions, dailyTrendData]);


    useEffect(() => {
        const fetchSpendings = async () => {
            if (date?.from && date?.to) {
                setLoading(true);
                const formattedStartDate = format(date.from, 'yyyy-MM-dd');
                const formattedEndDate = format(date.to, 'yyyy-MM-dd 23:59:59');
                try {
                    const data = await getSpendingsByDateRange(formattedStartDate, formattedEndDate);
                    setSpendings(data);

                    // 1. Process Pie Chart Data (By Category)
                    const categoryMap = {};
                    data.forEach(item => {
                        categoryMap[item.categoryName] = (categoryMap[item.categoryName] || 0) + item.amount;
                    });
                    const pieData = Object.entries(categoryMap).map(([name, y]) => ({ name, y }));
                    setCategoryPieData(pieData);

                    // 2. Process Bar Chart Data (Top 5 Sub-Categories)
                    const subCategoryMap = {};
                    data.forEach(item => {
                        subCategoryMap[item.subCategoryName] = (subCategoryMap[item.subCategoryName] || 0) + item.amount;
                    });
                    // Sort by amount desc and take top 5
                    const sortedSubCats = Object.entries(subCategoryMap)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);
                    setSubCategoryBarData({
                        categories: sortedSubCats.map(i => i[0]),
                        data: sortedSubCats.map(i => i[1])
                    });

                    // 3. Process Line Chart Data (Daily Trend)
                    const dateMap = {};
                    data.forEach(item => {
                        // Assuming dateOfSpending is "YYYY-MM-DD HH:mm:ss" - take only date part
                        const day = item.dateOfSpending.split(' ')[0];
                        dateMap[day] = (dateMap[day] || 0) + item.amount;
                    });
                    // Sort dates chronologically
                    const sortedDates = Object.keys(dateMap).sort();
                    setDailyTrendData({
                        dates: sortedDates.map(d => format(new Date(d), 'MMM dd')),
                        data: sortedDates.map(d => dateMap[d])
                    });

                    // 4. Top Transactions
                    const sortedTransactions = [...data].sort((a, b) => b.amount - a.amount).slice(0, 5);
                    setTopTransactions(sortedTransactions);


                } catch (error) {
                    console.error("Error fetching spendings:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchSpendings();

        if (dataInvalidated) {
            fetchSpendings();
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

            {/* KPI Card */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-2xl font-bold">Loading...</div>
                        ) : (
                            <div className="text-2xl font-bold">₹{totalSpend.toFixed(2)}</div>
                        )}
                        <p className="text-xs text-muted-foreground">For selected date range</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Spending by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {spendings.length > 0 ? (
                            <HighchartsReact highcharts={Highcharts} options={pieChartOptions} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">No Data</div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {spendings.length > 0 ? (
                            <HighchartsReact highcharts={Highcharts} options={barChartOptions} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">No Data</div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Line Chart (Full Width on md, or half width based on grid) */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Spending Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {spendings.length > 0 ? (
                            <HighchartsReact highcharts={Highcharts} options={lineChartOptions} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">No Data</div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. Top Transactions List (Full Width or half) */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Largest Transactions</CardTitle>
                        <CardDescription>The single biggest purchases in this period.</CardDescription>
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