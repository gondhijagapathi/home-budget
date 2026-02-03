import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from "sonner";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
    deleteSpending,
    getRecentSpendings,
    getIncomes,
    deleteIncome,
    updateIncome
} from './api/apiCaller';
import { addRecentSpendings, invalidateData, resetDataInvalidated } from './store/mainDataSlice';
import PaginationControls from './components/PaginationControls';
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog';

function Recents() {
    const dispatch = useDispatch();
    const dataInvalidated = useSelector(state => state.mainData.dataInvalidated);

    // Global Data for Dropdowns (for editing Income)
    const incomeSources = useSelector(state => state.mainData.incomeSources);
    const users = useSelector(state => state.mainData.users);

    const [activeTab, setActiveTab] = React.useState("expenses");

    // --- EXPENSES STATE ---
    const [expenses, setExpenses] = React.useState([]);
    const [expensesPage, setExpensesPage] = React.useState(1);
    const [expensesTotalPages, setExpensesTotalPages] = React.useState(1);
    const [expenseToDelete, setExpenseToDelete] = React.useState(null);
    const [confirmDeleteExpenseOpen, setConfirmDeleteExpenseOpen] = React.useState(false);

    // --- INCOME STATE ---
    const [incomes, setIncomes] = React.useState([]);
    const [incomesPage, setIncomesPage] = React.useState(1);
    const [incomesTotalPages, setIncomesTotalPages] = React.useState(1);

    // Income Edit State
    const [incomeEditingId, setIncomeEditingId] = React.useState(null);
    const [incomeEditData, setIncomeEditData] = React.useState({});

    // Income Delete State
    const [incomeToDelete, setIncomeToDelete] = React.useState(null);
    const [confirmDeleteIncomeOpen, setConfirmDeleteIncomeOpen] = React.useState(false);


    // --- FETCH FUNCTIONS ---
    const fetchExpenses = React.useCallback(async () => {
        try {
            const res = await getRecentSpendings(expensesPage, 15);
            setExpenses(res.data || []);
            setExpensesTotalPages(res.totalPages || 1);
            // We also update Redux for legacy reasons if needed, but local state is better for pagination
            // dispatch(addRecentSpendings(res.data || [])); 
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch expenses");
        }
    }, [expensesPage]);

    const fetchIncomes = React.useCallback(async () => {
        try {
            const res = await getIncomes(null, null, incomesPage, 15);
            setIncomes(res.data || []);
            setIncomesTotalPages(res.totalPages || 1);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch incomes");
        }
    }, [incomesPage]);

    // --- EFFECTS ---
    React.useEffect(() => {
        if (activeTab === 'expenses') fetchExpenses();
        if (activeTab === 'income') fetchIncomes();
    }, [activeTab, fetchExpenses, fetchIncomes]);

    React.useEffect(() => {
        if (dataInvalidated) {
            if (activeTab === 'expenses') fetchExpenses();
            if (activeTab === 'income') fetchIncomes();
            // dispatch(resetDataInvalidated()); // Optional: Careful with loops
        }
    }, [dataInvalidated, activeTab, fetchExpenses, fetchIncomes]);


    // --- EXPENSE HANDLERS ---
    const handleDeleteExpenseClick = (id) => {
        setExpenseToDelete(id);
        setConfirmDeleteExpenseOpen(true);
    };

    const confirmDeleteExpense = async () => {
        if (!expenseToDelete) return;
        try {
            await deleteSpending(expenseToDelete);
            toast.success("Expense deleted");
            await fetchExpenses();
            dispatch(invalidateData());
        } catch (error) {
            toast.error(error.message || "Delete failed");
        } finally {
            setExpenseToDelete(null);
            setConfirmDeleteExpenseOpen(false);
        }
    };


    // --- INCOME HANDLERS ---
    const handleEditIncomeClick = (item) => {
        setIncomeEditingId(item.incomeId);
        setIncomeEditData({
            incomeSourceId: item.incomeSourceId,
            userId: item.userId,
            amount: item.amount,
            dateOfIncome: item.dateOfIncome,
            description: item.description
        });
    };

    const handleCancelIncomeEdit = () => {
        setIncomeEditingId(null);
        setIncomeEditData({});
    };

    const handleSaveIncome = async () => {
        try {
            await updateIncome(incomeEditingId, incomeEditData);
            toast.success("Income updated!");
            await fetchIncomes();
            dispatch(invalidateData());
            handleCancelIncomeEdit();
        } catch (err) {
            toast.error(err.message || "Update failed");
        }
    };

    const handleDeleteIncomeClick = (id) => {
        setIncomeToDelete(id);
        setConfirmDeleteIncomeOpen(true);
    };

    const confirmDeleteIncome = async () => {
        if (!incomeToDelete) return;
        try {
            await deleteIncome(incomeToDelete);
            toast.success("Income deleted");
            await fetchIncomes();
            dispatch(invalidateData());
        } catch (err) {
            toast.error(err.message || "Delete failed");
        } finally {
            setIncomeToDelete(null);
            setConfirmDeleteIncomeOpen(false);
        }
    };


    return (
        <Card className="w-full max-w-full">
            <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Manage your expenses and income.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                        <TabsTrigger value="income">Income</TabsTrigger>
                    </TabsList>

                    {/* EXPENSES TAB */}
                    <TabsContent value="expenses">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Subcategory</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center">No expenses found</TableCell></TableRow>
                                    ) : (
                                        expenses.map((spend) => (
                                            <TableRow key={spend.spendingId}>
                                                <TableCell>{format(new Date(spend.dateOfSpending), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell>{spend.categoryName}</TableCell>
                                                <TableCell>{spend.subCategoryName}</TableCell>
                                                <TableCell className="text-right">₹{spend.amount.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleDeleteExpenseClick(spend.spendingId)}>
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-4">
                            <PaginationControls
                                currentPage={expensesPage}
                                totalPages={expensesTotalPages}
                                onPageChange={setExpensesPage}
                            />
                        </div>
                    </TabsContent>

                    {/* INCOME TAB */}
                    <TabsContent value="income">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomes.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center">No income found</TableCell></TableRow>
                                    ) : (
                                        incomes.map((item) => (
                                            <TableRow key={item.incomeId}>
                                                <TableCell>
                                                    {incomeEditingId === item.incomeId ? (
                                                        <Input
                                                            type="date"
                                                            value={incomeEditData.dateOfIncome ? format(new Date(incomeEditData.dateOfIncome), 'yyyy-MM-dd') : ''}
                                                            onChange={(e) => setIncomeEditData({ ...incomeEditData, dateOfIncome: e.target.value })}
                                                        />
                                                    ) : (
                                                        format(new Date(item.dateOfIncome), 'MMM dd, yyyy')
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {incomeEditingId === item.incomeId ? (
                                                        <Select
                                                            value={incomeEditData.incomeSourceId}
                                                            onValueChange={(val) => setIncomeEditData({ ...incomeEditData, incomeSourceId: val })}
                                                        >
                                                            <SelectTrigger className="w-[120px]">
                                                                <SelectValue placeholder="Source" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {incomeSources.map(s => (
                                                                    <SelectItem key={s.incomeSourceId} value={s.incomeSourceId}>{s.sourceName}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        item.sourceName
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {incomeEditingId === item.incomeId ? (
                                                        <Select
                                                            value={incomeEditData.userId}
                                                            onValueChange={(val) => setIncomeEditData({ ...incomeEditData, userId: val })}
                                                        >
                                                            <SelectTrigger className="w-[100px]">
                                                                <SelectValue placeholder="User" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {users.map(u => (
                                                                    <SelectItem key={u.personId} value={u.personId}>{u.userName}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        item.userName
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {incomeEditingId === item.incomeId ? (
                                                        <Input
                                                            type="number"
                                                            value={incomeEditData.amount}
                                                            onChange={(e) => setIncomeEditData({ ...incomeEditData, amount: e.target.value })}
                                                        />
                                                    ) : (
                                                        `₹${item.amount}`
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {incomeEditingId === item.incomeId ? (
                                                        <Input
                                                            value={incomeEditData.description}
                                                            onChange={(e) => setIncomeEditData({ ...incomeEditData, description: e.target.value })}
                                                        />
                                                    ) : (
                                                        item.description
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {incomeEditingId === item.incomeId ? (
                                                        <>
                                                            <Button size="sm" variant="ghost" onClick={handleCancelIncomeEdit} className="mr-1">Cancel</Button>
                                                            <Button size="sm" onClick={handleSaveIncome}>Save</Button>
                                                        </>
                                                    ) : (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleEditIncomeClick(item)}>Edit</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDeleteIncomeClick(item.incomeId)}>Delete</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-4">
                            <PaginationControls
                                currentPage={incomesPage}
                                totalPages={incomesTotalPages}
                                onPageChange={setIncomesPage}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            {/* Dialogs */}
            <DeleteConfirmationDialog
                isOpen={confirmDeleteExpenseOpen}
                onOpenChange={setConfirmDeleteExpenseOpen}
                title="Delete Expense"
                description="Are you sure you want to delete this expense?"
                onConfirm={confirmDeleteExpense}
                onCancel={() => setConfirmDeleteExpenseOpen(false)}
            />
            <DeleteConfirmationDialog
                isOpen={confirmDeleteIncomeOpen}
                onOpenChange={setConfirmDeleteIncomeOpen}
                title="Delete Income"
                description="Are you sure you want to delete this income entry?"
                onConfirm={confirmDeleteIncome}
                onCancel={() => setConfirmDeleteIncomeOpen(false)}
            />
        </Card>
    );
}

export default Recents;

