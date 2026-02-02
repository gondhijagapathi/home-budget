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

function Recents() {
    const dispatch = useDispatch();
    const recentSpendings = useSelector(state => state.mainData.recentSpendings);

    const handleDelete = async (id) => {
        try {
            await deleteSpending(id);
            const spendings = await getRecentSpendings();
            dispatch(addRecentSpendings(spendings));
            toast.success("Item deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete item.");
        }
    };

    return (
        <Card>
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
                                            <DropdownMenuItem onSelect={() => handleDelete(spend.spendingId)}>
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
        </Card>
    );
}

export default Recents;

