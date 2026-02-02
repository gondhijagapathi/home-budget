import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
import { deleteSpending, getRecentSpendings } from './api/apiCaller';
import { addRecentSpendings } from './store/mainDataSlice';
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger // Also need DialogTrigger to manage dialog state
} from "@/components/ui/dialog"; // Import Dialog components


function Recents() {
    const dispatch = useDispatch(); // Correct usage of useDispatch
    const recentSpendings = useSelector(state => state.mainData.recentSpendings);

    const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = React.useState(false);
    const [spendingToDelete, setSpendingToDelete] = React.useState(null);

    React.useEffect(() => {
        const fetchRecent = async () => {
            try {
                const spendings = await getRecentSpendings();
                dispatch(addRecentSpendings(spendings));
            } catch (error) {
                toast.error(error.message); // Display specific error message
            }
        };
        fetchRecent();
    }, [dispatch]); // Dependency array includes dispatch

    const handleDeleteClick = (id) => {
        setSpendingToDelete(id);
        setShowConfirmDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!spendingToDelete) return; // Should not happen
        try {
            await deleteSpending(spendingToDelete);
            const spendings = await getRecentSpendings();
            dispatch(addRecentSpendings(spendings));
            toast.success("Item deleted successfully!");
        } catch (error) {
            toast.error(error.message); // Display specific error message
        } finally {
            setSpendingToDelete(null);
            setShowConfirmDeleteDialog(false);
        }
    };

    return (
        <Card className="w-full max-w-full">
            <CardHeader>
                <CardTitle>Recent Spendings</CardTitle>
                <CardDescription>A list of your last 10 transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Subcategory</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentSpendings.map((spend) => (
                            <TableRow key={spend.spendingId}>
                                <TableCell className="font-medium">{new Date(spend.dateOfSpending).toLocaleDateString()}</TableCell>
                                <TableCell>{spend.categoryName}</TableCell>
                                <TableCell>{spend.subCategoryName}</TableCell>
                                <TableCell className="text-right">₹{spend.amount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={() => handleDeleteClick(spend.spendingId)}>
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={showConfirmDeleteDialog} onOpenChange={setShowConfirmDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this spending record? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDeleteDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

export default Recents;

