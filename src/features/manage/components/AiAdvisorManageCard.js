import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AiAdvisorManageCard = () => {
    const [loading, setLoading] = useState(false);

    const handleDeleteLatest = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ai-insights/latest', {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Success", {
                    description: data.message || "Latest assessment deleted. The bot can now regenerate it."
                });
            } else {
                toast.error("Error", {
                    description: data.message || "Failed to delete assessment."
                });
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Error", {
                description: "An unexpected error occurred."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Financial Advisor</CardTitle>
                <CardDescription>
                    Manage the AI assistant's memory and reports.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col space-y-2">
                    <h3 className="text-sm font-medium">Weekly Assessment</h3>
                    <p className="text-sm text-gray-500">
                        The AI generates a weekly report every Monday. If you missed it or want to regenerate it (e.g., after fixing data), you can delete the latest record here.
                    </p>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteLatest}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Latest Weekly Assessment
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default AiAdvisorManageCard;
