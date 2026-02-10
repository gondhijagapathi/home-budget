import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadReceipt, postData, getRecentSpendings } from './api/apiCaller';
import { toast } from "sonner";
import { Loader2, Trash2, Check, X } from "lucide-react";
import { useSelector, useDispatch } from 'react-redux';
import { addRecentSpendings, invalidateData } from './store/mainDataSlice';
import uuid from 'react-uuid';
import { format } from "date-fns";


const UploadReceipts = () => {
    const [file, extractedItems, setExtractedItems, isUploading, setIsUploading] = [
        useState(null)[0],
        useState([])[0],
        useState([])[1],
        useState(false)[0],
        useState(false)[1]
    ];

    // Fix hook usage - deconstruct correctly
    const [fileState, setFile] = useState(null);
    const [itemsState, setItems] = useState([]);
    const [uploadingState, setUploading] = useState(false);
    const [debugInfo, setDebugInfo] = useState(null);

    const dispatch = useDispatch();
    const categories = useSelector(state => state.mainData.categories);
    const allSubCategories = useSelector(state => state.mainData.allSubCategories);
    const users = useSelector(state => state.mainData.users);
    const incomeSources = useSelector(state => state.mainData.incomeSources);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!fileState) {
            toast.error("Please select a file first.");
            return;
        }

        setUploading(true);
        try {
            const response = await uploadReceipt(fileState);
            console.log("Upload response:", response);
            if (response.transactions) {
                const itemsWithIds = response.transactions.map(item => {
                    const type = (item.type || 'expense').toLowerCase();
                    const isExpense = type === 'expense';

                    let categoryId = "";
                    let subCategoryId = "";
                    let incomeSourceId = "";

                    if (isExpense) {
                        categoryId = categories.find(c => c.categoryName.toLowerCase() === (item.category || "").toLowerCase())?.categoryId || "";
                        if (categoryId && item.subcategory) {
                            const subs = allSubCategories.filter(s => s.categoryId === categoryId);
                            const match = subs.find(s => s.subCategoryName.toLowerCase() === item.subcategory.toLowerCase());
                            if (match) subCategoryId = match.subCategoryId;
                        }
                    } else {
                        // Try to match income source
                        // We might not have an exact name match logic yet, but let's try strict name or "Other" logic if we had it.
                        // For now, default to empty.
                        // If description contains source name?
                        if (item.category && item.category !== "Undetermined") {
                            // Sometimes Gemini puts source in category for income
                            incomeSourceId = incomeSources.find(s => s.sourceName.toLowerCase() === item.category.toLowerCase())?.incomeSourceId || "";
                        }
                    }

                    return {
                        ...item,
                        id: uuid(),
                        type: type,
                        userId: users.length > 0 ? users[0].personId : "",
                        date: item.date || format(new Date(), "yyyy-MM-dd"),
                        amount: Number(item.amount) || 0,
                        categoryId,
                        subCategoryId,
                        incomeSourceId
                    };
                });

                setItems(prev => [...prev, ...itemsWithIds]);
                if (response.debug) {
                    setDebugInfo(response.debug);
                }
                toast.success(`Successfully extracted ${itemsWithIds.length} items.`);
                setFile(null);
            }
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to process file: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateItem = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };

                if (field === 'type') {
                    // Reset fields relevant to the other type
                    if (value === 'expense') {
                        updated.incomeSourceId = "";
                    } else {
                        updated.categoryId = "";
                        updated.subCategoryId = "";
                    }
                }

                if (field === 'categoryId') {
                    updated.subCategoryId = "";
                }
                return updated;
            }
            return item;
        }));
    };

    const handleRemoveItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const momentFormat = (dateStr) => {
        if (dateStr.includes(":")) return dateStr;
        return `${dateStr} 12:00:00`;
    }

    const handleSaveItem = async (item) => {
        if (!item.amount || !item.date || !item.userId) {
            toast.error("Please fill in basic fields (Amount, Date, User)");
            return;
        }

        try {
            if (item.type === 'expense') {
                if (!item.categoryId || !item.subCategoryId) {
                    toast.error("Please select Category and Subcategory for expense.");
                    return;
                }
                const dataToSave = [
                    uuid(),
                    item.subCategoryId,
                    item.userId,
                    parseFloat(item.amount),
                    momentFormat(item.date),
                    item.categoryId
                ];
                await postData('spendings', { data: dataToSave });
            } else {
                // Income
                if (!item.incomeSourceId) {
                    toast.error("Please select an Income Source.");
                    return;
                }
                const incomeData = {
                    incomeSourceId: item.incomeSourceId,
                    userId: item.userId,
                    amount: parseFloat(item.amount),
                    dateOfIncome: momentFormat(item.date),
                    description: item.description || ""
                };
                await postIncome(incomeData);
            }

            toast.success("Item saved!");
            handleRemoveItem(item.id);

            dispatch(invalidateData());
            const response = await getRecentSpendings(1, 10);
            dispatch(addRecentSpendings(response.data || []));

        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save item: " + error.message);
        }
    };

    const filteredSubcategories = (categoryId) => {
        return allSubCategories.filter(sc => sc.categoryId === categoryId);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Import Bank Statement</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        disabled={uploadingState}
                    />
                    <Button onClick={handleUpload} disabled={!fileState || uploadingState}>
                        {uploadingState && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Process with Gemini
                    </Button>
                </CardContent>
            </Card>

            {itemsState.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Extracted Transactions ({itemsState.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">Type</TableHead>
                                                <TableHead className="w-[130px]">Date</TableHead>
                                                <TableHead className="w-[150px]">Description</TableHead>
                                                <TableHead className="w-[100px]">Amount</TableHead>
                                                <TableHead className="w-[120px]">User</TableHead>
                                                <TableHead className="w-[200px]">Details</TableHead>
                                                <TableHead className="w-[100px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {itemsState.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <Select value={item.type} onValueChange={(val) => handleUpdateItem(item.id, 'type', val)}>
                                                            <SelectTrigger className="w-[100px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="expense">Expense</SelectItem>
                                                                <SelectItem value="income">Income</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={item.date}
                                                            onChange={(e) => handleUpdateItem(item.id, 'date', e.target.value)}
                                                            type="date"
                                                            className="w-[130px]"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={item.amount}
                                                            type="number"
                                                            onChange={(e) => handleUpdateItem(item.id, 'amount', e.target.value)}
                                                            className="w-[100px]"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select value={item.userId} onValueChange={(val) => handleUpdateItem(item.id, 'userId', val)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="User" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {users.map(u => (
                                                                    <SelectItem key={u.personId} value={u.personId}>{u.userName}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.type === 'expense' ? (
                                                            <div className="flex flex-col gap-2">
                                                                <Select value={item.categoryId} onValueChange={(val) => handleUpdateItem(item.id, 'categoryId', val)}>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Category" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {categories.map(c => (
                                                                            <SelectItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <Select
                                                                    value={item.subCategoryId}
                                                                    onValueChange={(val) => handleUpdateItem(item.id, 'subCategoryId', val)}
                                                                    disabled={!item.categoryId}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Subcategory" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {filteredSubcategories(item.categoryId).map(sc => (
                                                                            <SelectItem key={sc.subCategoryId} value={sc.subCategoryId}>{sc.subCategoryName}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ) : (
                                                            <Select value={item.incomeSourceId} onValueChange={(val) => handleUpdateItem(item.id, 'incomeSourceId', val)}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Income Source" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {incomeSources.map(src => (
                                                                        <SelectItem key={src.incomeSourceId} value={src.incomeSourceId}>{src.sourceName}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => handleSaveItem(item)} className="h-8 w-8 text-green-600">
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="h-8 w-8 text-red-600">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>AI Debug Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Prompt Sent:</h3>
                                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs font-mono h-48 overflow-y-auto whitespace-pre-wrap">
                                        {debugInfo?.prompt || "No prompt available"}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Raw Response:</h3>
                                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs font-mono h-64 overflow-y-auto whitespace-pre-wrap">
                                        {debugInfo?.rawResponse || "No response available"}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>);
};

export default UploadReceipts;
