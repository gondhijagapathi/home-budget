import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { getAdvisorInsight } from './api/apiCaller';
import { useSelector } from 'react-redux';
import { Skeleton } from "@/components/ui/skeleton";

const AIAdvisor = () => {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);
    const users = useSelector(state => state.mainData.users);
    const userId = users.length > 0 ? users[0].personId : 'default';

    const fetchInsight = async (forceRefresh = false) => {
        setLoading(true);
        try {
            const data = await getAdvisorInsight(userId, forceRefresh);
            if (data && data.insight) {
                setInsight(data.insight);
            }
        } catch (error) {
            console.error("Failed to fetch insight", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsight();
    }, [userId]);

    return (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border-indigo-200 dark:border-indigo-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <Sparkles className="h-4 w-4" />
                    AI Finance Advisor
                </CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fetchInsight(true)}
                    disabled={loading}
                    className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-[90%]" />
                        <Skeleton className="h-4 w-[80%]" />
                    </div>
                ) : (
                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                        {insight || "No insights available for today."}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AIAdvisor;
