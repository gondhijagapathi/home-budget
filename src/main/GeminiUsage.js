import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUsageStats } from './api/apiCaller';
import { Loader2 } from "lucide-react";

const GeminiUsage = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await getUsageStats();
            setStats(res);
        } catch (error) {
            console.error("Failed to fetch usage stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Gemini API Usage</CardTitle>
                    <CardDescription>Loading usage statistics...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Gemini API Usage</CardTitle>
                    <CardDescription>Failed to load data.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 md:col-span-2 xl:col-span-3">
            <CardHeader>
                <CardTitle>Gemini API Usage</CardTitle>
                <CardDescription>Monitor your AI model token consumption and costs.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Tokens Today</div>
                        <div className="text-2xl font-bold">{stats.today?.totalTokensToday || 0}</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Calls Today</div>
                        <div className="text-2xl font-bold">{stats.today?.callsToday || 0}</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Total Tokens (All Time)</div>
                        <div className="text-2xl font-bold">{stats.allTime?.totalTokensAllTime || 0}</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Total Calls (All Time)</div>
                        <div className="text-2xl font-bold">{stats.allTime?.callsAllTime || 0}</div>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead className="text-right">Input</TableHead>
                                <TableHead className="text-right">Output</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(stats.recentLogs || []).map((log) => (
                                <TableRow key={log.usageId}>
                                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>{log.purpose}</TableCell>
                                    <TableCell>{log.model}</TableCell>
                                    <TableCell className="text-right">{log.inputTokens}</TableCell>
                                    <TableCell className="text-right">{log.outputTokens}</TableCell>
                                    <TableCell className="text-right">{log.totalTokens}</TableCell>
                                </TableRow>
                            ))}
                            {(!stats.recentLogs || stats.recentLogs.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No usage history found.
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

export default GeminiUsage;
