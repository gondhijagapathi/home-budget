import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { addDays, format } from 'date-fns';
import { getSpendingsByDateRange } from './api/apiCaller';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useTheme } from '@/components/theme-provider';
import { getHighchartsTheme } from './highchartsTheme';

function resolveTheme(theme) {
    if (theme === 'dark' || theme === 'light') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ReportsPage = () => {
    const { theme } = useTheme();
    const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);

    const [date, setDate] = useState({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [spendings, setSpendings] = useState([]);
    const [chartData, setChartData] = useState({ categories: [], seriesData: [] });

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
                }
            }
        };

        fetchSpendings();
    }, [date]);
    return (
        <Card>
            <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>
                    This is where financial reports and charts will be displayed.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <DatePickerWithRange date={date} setDate={setDate} />
                </div>
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
    );
};

export default ReportsPage;
