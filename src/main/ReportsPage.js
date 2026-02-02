import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { IndianRupee, Camera } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { addDays, format } from 'date-fns';
import { getSpendingsByDateRange } from './api/apiCaller';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useTheme } from '@/components/theme-provider';
import { getHighchartsTheme } from './highchartsTheme';
import { resetDataInvalidated } from './store/mainDataSlice';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';

function resolveTheme(theme) {
    if (theme === 'dark' || theme === 'light') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ReportsPage = () => {
    const dispatch = useDispatch(); // Get dispatch
    const dataInvalidated = useSelector(state => state.mainData.dataInvalidated); // Get dataInvalidated state
    const { theme } = useTheme();
    const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);

    const [date, setDate] = useState({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [spendings, setSpendings] = useState([]);
    const [chartData, setChartData] = useState({ categories: [], seriesData: [] });
    const [loading, setLoading] = useState(false); // Add loading state
    const totalSpend = spendings.reduce((acc, item) => acc + item.amount, 0);

    const reportRef = useRef(); // Create a ref for the report section

    const handleExportImage = () => {
        if (reportRef.current) {
            const computedStyle = window.getComputedStyle(reportRef.current);
            let backgroundColor = computedStyle.backgroundColor;

            // If the element's background is transparent, try to get the body's background
            if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
                backgroundColor = window.getComputedStyle(document.body).backgroundColor;
                // Fallback to white if body background is also transparent or not set
                if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
                    backgroundColor = '#ffffff';
                }
            }

            // Store original styles
            const exportButton = document.getElementById('export-button');
            const datePickerTrigger = document.getElementById('date-picker-range'); // The button inside DatePickerWithRange

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
                // Restore original styles
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

    const chartOptions = useMemo(() => {
        const themeOptions = getHighchartsTheme(resolvedTheme);
        return {
            ...themeOptions,
            chart: {
                ...themeOptions.chart,
                type: 'column',
            },
            title: {
                text: 'Spending by Category',
                ...themeOptions.title,
            },
            yAxis: {
                ...themeOptions.yAxis,
                title: {
                    text: 'Amount',
                    ...themeOptions.yAxis?.title,
                },
            },
            xAxis: {
                ...themeOptions.xAxis,
                categories: chartData.categories,
            },
            tooltip: {
                ...themeOptions.tooltip,
            },
            series: [{
                name: 'Spendings',
                data: chartData.seriesData,
            }],
        };
    }, [resolvedTheme, chartData]);

    useEffect(() => {
        const fetchSpendings = async () => {
            if (date?.from && date?.to) {
                setLoading(true); // Set loading to true
                const formattedStartDate = format(date.from, 'yyyy-MM-dd');
                const formattedEndDate = format(date.to, 'yyyy-MM-dd 23:59:59');
                try {
                    const data = await getSpendingsByDateRange(formattedStartDate, formattedEndDate);
                    setSpendings(data);

                    // Process data for chart
                    const categoryMap = {};
                    data.forEach(item => {
                        if (categoryMap[item.categoryName]) {
                            categoryMap[item.categoryName] += item.amount;
                        } else {
                            categoryMap[item.categoryName] = item.amount;
                        }
                    });

                    const categories = Object.keys(categoryMap);
                    const seriesData = Object.values(categoryMap);
                    setChartData({ categories, seriesData });

                } catch (error) {
                    console.error("Error fetching spendings:", error);
                } finally {
                    setLoading(false); // Set loading to false
                }
            }
        };

        fetchSpendings();

        if (dataInvalidated) {
            fetchSpendings();
            dispatch(resetDataInvalidated());
        }

    }, [date, dataInvalidated, dispatch]); // Add dataInvalidated and dispatch to dependency array
    return (
        <div className="flex flex-col gap-4 relative" ref={reportRef}> {/* Assign ref to the main container */}
            <div className="flex justify-between items-center mb-4">
                <div className="z-10"> {/* Export button on the left */}
                    <Button id="export-button" onClick={handleExportImage} variant="outline" size="sm">
                        <Camera className="mr-2 h-4 w-4" /> Export as Image
                    </Button>
                </div>
                <div className="z-10"> {/* DatePicker on the right */}
                    <DatePickerWithRange date={date} setDate={setDate} />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4"> {/* Container for Total Spending Card, removed mt-16 */}
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
                        <p className="text-xs text-muted-foreground">
                            For selected date range
                        </p>
                    </CardContent>
                </Card>
            </div>
            <Card> {/* Main Reports Card */}
                <CardHeader>
                    <CardTitle>Reports</CardTitle>
                    <CardDescription>
                        This is where financial reports and charts will be displayed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div id="chart-container" className="h-96">
                        {spendings.length > 0 ? (
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={chartOptions}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No data available for the selected date range.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportsPage;