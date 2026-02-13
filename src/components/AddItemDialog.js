import * as React from 'react';
import { DatePickerDemo } from "@/components/ui/date-picker";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDispatch, useSelector } from 'react-redux';
import { financeService } from '../services/financeService';
import { setRecentSpendings, invalidateData } from '../store/financeSlice';
import { toast } from "sonner";
import uuid from 'react-uuid';

export default function AddItemDialog() {
    const dispatch = useDispatch();
    const [open, setOpen] = React.useState(false);

    // Transaction Type: "expense" or "income"
    const [transactionType, setTransactionType] = React.useState("expense");

    // Shared Fields
    const [amount, setAmount] = React.useState("");
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [selectedDate, setSelectedDate] = React.useState(new Date());

    // Expense Fields
    const [selectedCategory, setSelectedCategory] = React.useState("");
    const [selectedSubCategory, setSelectedSubCategory] = React.useState("");

    // Income Fields
    const [selectedIncomeSource, setSelectedIncomeSource] = React.useState("");
    const [description, setDescription] = React.useState("");

    // Redux Data
    const categories = useSelector(state => state.finance.categories);
    const allSubCategories = useSelector(state => state.finance.allSubCategories);
    const users = useSelector(state => state.user.users);
    const incomeSources = useSelector(state => state.finance.incomeSources);

    React.useEffect(() => {
        if (users.length > 0 && selectedUser === null) {
            setSelectedUser(users[0].personId);
        }
    }, [users, selectedUser]);

    const filteredSubcategories = allSubCategories.filter(sc => sc.categoryId === selectedCategory);

    const resetFormFields = () => {
        setAmount("");
        // Expense
        setSelectedCategory("");
        setSelectedSubCategory("");
        // Income
        setSelectedIncomeSource("");
        setDescription("");
    };

    const handleSubmit = async (shouldCloseDialog) => {
        if (!amount || !selectedUser || !selectedDate) {
            toast.error("Please fill out all required fields.");
            return;
        }

        try {
            if (transactionType === 'expense') {
                if (!selectedCategory || !selectedSubCategory) {
                    toast.error("Please select a category and subcategory.");
                    return;
                }

                const data = [
                    uuid(),
                    selectedSubCategory,
                    selectedUser,
                    parseFloat(amount),
                    format(selectedDate, "yyyy-MM-dd HH:mm:ss"),
                    selectedCategory,
                ];
                await financeService.addSpending({ data });

                // Refresh spendings
                const response = await financeService.getRecentSpendings(1, 10);
                dispatch(setRecentSpendings(response.data || []));
            } else {
                // Income
                if (!selectedIncomeSource) {
                    toast.error("Please select an income source.");
                    return;
                }

                const incomeData = {
                    incomeSourceId: selectedIncomeSource,
                    userId: selectedUser,
                    amount: parseFloat(amount),
                    dateOfIncome: format(selectedDate, "yyyy-MM-dd HH:mm:ss"),
                    description: description || ""
                };
                await financeService.addIncome(incomeData);
            }

            toast.success(`${transactionType === 'expense' ? 'Spending' : 'Income'} added successfully!`);
            dispatch(invalidateData());

            resetFormFields();
            if (shouldCloseDialog) {
                setOpen(false);
            }
        } catch (error) {
            toast.error(error.message || "Failed to add item");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add New Item</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription>
                        Add a new expense or income.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={transactionType} onValueChange={setTransactionType} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="expense">Expense</TabsTrigger>
                        <TabsTrigger value="income">Income</TabsTrigger>
                    </TabsList>

                    <div className="grid gap-4 py-4">
                        {/* Common: User */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user" className="text-right">User</Label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select User" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(u => (
                                        <SelectItem key={u.personId} value={u.personId}>{u.userName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Common: Date */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Date</Label>
                            <div className="col-span-3">
                                <DatePickerDemo date={selectedDate} setDate={setSelectedDate} />
                            </div>
                        </div>

                        {/* Common: Amount */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="col-span-3"
                                placeholder="0.00"
                            />
                        </div>

                        <TabsContent value="expense" className="space-y-4 mt-0">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Category</Label>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subcategory" className="text-right">Subcategory</Label>
                                <Select
                                    value={selectedSubCategory}
                                    onValueChange={setSelectedSubCategory}
                                    disabled={!selectedCategory}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Subcategory" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredSubcategories.map(sub => (
                                            <SelectItem key={sub.subCategoryId} value={sub.subCategoryId}>{sub.subCategoryName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        <TabsContent value="income" className="space-y-4 mt-0">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="source" className="text-right">Source</Label>
                                <Select value={selectedIncomeSource} onValueChange={setSelectedIncomeSource}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {incomeSources.map(src => (
                                            <SelectItem key={src.incomeSourceId} value={src.incomeSourceId}>{src.sourceName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="col-span-3"
                                    placeholder="Optional description"
                                />
                            </div>
                        </TabsContent>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleSubmit(false)}>Save & Add Another</Button>
                        <Button type="button" onClick={() => handleSubmit(true)}>Save Changes</Button>
                    </DialogFooter>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}