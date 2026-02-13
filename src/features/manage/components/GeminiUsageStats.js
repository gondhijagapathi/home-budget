import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { financeService } from '../../../services/financeService';
import { Loader2, AlertCircle, Activity, Zap, Layers, Calendar, IndianRupee } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

const GeminiUsageStats = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await financeService.getUsageStats();
                const result = response.data || response;
                setData(result);
            } catch (err) {
                console.error("Failed to fetch usage stats:", err);
                setError("Failed to load usage statistics.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <Card className="min-h-[200px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    const { summary, recentLogs } = data || { summary: {}, recentLogs: [] };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Gemini API Usage
                </CardTitle>
                <CardDescription>
                    Track AI model usage, tokens, and estimated costs (Gemini 2.5 Flash)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <Card className="bg-muted/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                            <IndianRupee className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₹{summary.totalCostINR?.toFixed(2) || '0.00'}</div>
                            <p className="text-xs text-muted-foreground">
                                @ ₹{summary.exchangeRate?.toFixed(2)}/USD
                                {summary.exchangeRate === 87 && " (Fallback)"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.todayRequests || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tokens Today</CardTitle>
                            <Zap className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{(summary.todayTokens || 0).toLocaleString()}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                            <Layers className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalRequests || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                            <Calendar className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{(summary.totalTokens || 0).toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Logs Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead className="text-right">Tokens</TableHead>
                                <TableHead className="text-right">Cost (INR)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentLogs.length > 0 ? (
                                recentLogs.map((log) => (
                                    <TableRow key={log.usageId || Math.random()}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                                        </TableCell>
                                        <TableCell>{log.purpose}</TableCell>
                                        <TableCell>{log.model}</TableCell>
                                        <TableCell className="text-right">
                                            {log.totalTokens?.toLocaleString()}
                                            <span className="text-xs text-muted-foreground block">
                                                (In: {log.inputTokens}, Out: {log.outputTokens})
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">₹{log.estimatedCostINR?.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No recent activity.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default GeminiUsageStats;
