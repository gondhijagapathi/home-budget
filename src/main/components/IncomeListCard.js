import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getIncomes, deleteIncome, updateIncome } from '../api/apiCaller';
import { invalidateData } from '../store/mainDataSlice';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import PaginationControls from './PaginationControls';
import { format } from 'date-fns';

function IncomeListCard() {
    const dispatch = useDispatch();
    const incomeSources = useSelector(state => state.mainData.incomeSources); // From Redux (all sources)
    const users = useSelector(state => state.mainData.users);

    // Local State
    const [incomes, setIncomes] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);

    // Filter State (Optional, but good for table view)
    // For now, let's just show recent incomes. 
    // Wait, the API supports startDate/endDate. 
    // We can default to "All time" (no filtering) or "Last 30 days".
    // Let's implement without date filter first, or empty dates = all.

    // Edit State
    const [editingId, setEditingId] = React.useState(null);
    const [editData, setEditData] = React.useState({});

    // Delete State
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
    const [idToDelete, setIdToDelete] = React.useState(null);

    const fetchIncomes = React.useCallback(async () => {
        try {
            // Fetch all time for the table view management
            const res = await getIncomes(null, null, currentPage, 15);
            setIncomes(res.data || []);
            setTotalPages(res.totalPages || 1);
        } catch (error) {
            console.error(error);
        }
    }, [currentPage]);

    React.useEffect(() => {
        fetchIncomes();
    }, [fetchIncomes]);

    const handleEditClick = (item) => {
        setEditingId(item.incomeId);
        setEditData({
            incomeSourceId: item.incomeSourceId,
            userId: item.userId,
            amount: item.amount,
            dateOfIncome: item.dateOfIncome,
            description: item.description
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleSave = async () => {
        try {
            await updateIncome(editingId, editData);
            toast.success("Income updated!");

            // 1. Refresh Local
            await fetchIncomes();

            // 2. Invalidate Data (Reports need refresh)
            dispatch(invalidateData());

            handleCancelEdit();
        } catch (err) {
            toast.error(err.message || "Update failed");
        }
    };

    const handleDeleteClick = (id) => {
        setIdToDelete(id);
        setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await deleteIncome(idToDelete);
            toast.success("Deleted!");

            await fetchIncomes();
            dispatch(invalidateData());

        } catch (err) {
            toast.error(err.message || "Delete failed");
        } finally {
            setIdToDelete(null);
            setConfirmDeleteOpen(false);
        }
    };

    return (
        <Card className="col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-4">
            <CardHeader>
                <CardTitle>View & Edit Income Entries</CardTitle>
                <CardDescription>Manage your revenue records.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
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
                            {incomes.map((item) => (
                                <TableRow key={item.incomeId}>
                                    <TableCell>
                                        {editingId === item.incomeId ? (
                                            <Input
                                                type="date"
                                                value={editData.dateOfIncome ? format(new Date(editData.dateOfIncome), 'yyyy-MM-dd') : ''}
                                                onChange={(e) => setEditData({ ...editData, dateOfIncome: e.target.value })}
                                            />
                                        ) : (
                                            format(new Date(item.dateOfIncome), 'MMM dd, yyyy')
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === item.incomeId ? (
                                            <Select
                                                value={editData.incomeSourceId}
                                                onValueChange={(val) => setEditData({ ...editData, incomeSourceId: val })}
                                            >
                                                <SelectTrigger className="w-[150px]">
                                                    <SelectValue placeholder="Select Source" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {incomeSources.map(s => (
                                                        <SelectItem key={s.incomeSourceId} value={s.incomeSourceId}>
                                                            {s.sourceName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            item.sourceName || 'Unknown'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === item.incomeId ? (
                                            <Select
                                                value={editData.userId}
                                                onValueChange={(val) => setEditData({ ...editData, userId: val })}
                                            >
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue placeholder="Select User" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {users.map(u => (
                                                        <SelectItem key={u.personId} value={u.personId}>
                                                            {u.userName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            item.userName || 'Unknown'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === item.incomeId ? (
                                            <Input
                                                type="number"
                                                value={editData.amount}
                                                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                            />
                                        ) : (
                                            `₹${item.amount}`
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === item.incomeId ? (
                                            <Input
                                                value={editData.description}
                                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            />
                                        ) : (
                                            item.description
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editingId === item.incomeId ? (
                                            <>
                                                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="mr-2">
                                                    Cancel
                                                </Button>
                                                <Button size="sm" onClick={handleSave}>Save</Button>
                                            </>
                                        ) : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => handleEditClick(item)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleDeleteClick(item.incomeId)}>
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </CardContent>

            <DeleteConfirmationDialog
                isOpen={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
                title="Delete Income Entry"
                description="Are you sure? This cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </Card>
    );
}

export default IncomeListCard;
