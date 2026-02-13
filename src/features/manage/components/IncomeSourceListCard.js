import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { financeService } from '../../../services/financeService';
import { setIncomeSources, invalidateData } from '../../../store/financeSlice';
import DeleteConfirmationDialog from '../../../components/DeleteConfirmationDialog';
import PaginationControls from '../../../components/PaginationControls';

function IncomeSourceListCard() {
    const dispatch = useDispatch();
    const lastUpdated = useSelector(state => state.finance.lastUpdated);

    // Local State
    const [sources, setSources] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);

    // Edit State
    const [editingId, setEditingId] = React.useState(null);
    const [editingName, setEditingName] = React.useState("");

    // Delete State
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
    const [idToDelete, setIdToDelete] = React.useState(null);

    const fetchSources = React.useCallback(async () => {
        try {
            const res = await financeService.getIncomeSources(currentPage, 15);
            setSources(res.data || []);
            setTotalPages(res.totalPages || 1);
        } catch (error) {
            console.error(error);
        }
    }, [currentPage]);

    React.useEffect(() => {
        fetchSources();
    }, [fetchSources]);

    React.useEffect(() => {
        if (lastUpdated) {
            fetchSources();
        }
    }, [fetchSources, lastUpdated]);

    const handleEditClick = (item) => {
        setEditingId(item.incomeSourceId);
        setEditingName(item.sourceName);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName("");
    };

    const handleSave = async () => {
        if (!editingName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }
        try {
            await financeService.updateIncomeSource(editingId, editingName);
            toast.success("Updated!");

            // 1. Refresh Local
            await fetchSources();

            // 2. Refresh Global
            const all = await financeService.getIncomeSources(1, 1000);
            dispatch(setIncomeSources(all.data || []));
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
            await financeService.deleteIncomeSource(idToDelete);
            toast.success("Deleted!");

            // 1. Refresh Local
            await fetchSources();

            // 2. Refresh Global
            const all = await financeService.getIncomeSources(1, 1000);
            dispatch(setIncomeSources(all.data || []));
            dispatch(invalidateData());

        } catch (err) {
            toast.error(err.message || "Delete failed");
        } finally {
            setIdToDelete(null);
            setConfirmDeleteOpen(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Income Sources</CardTitle>
                <CardDescription>View and edit income sources.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Source Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sources.map((item) => (
                                <TableRow key={item.incomeSourceId}>
                                    <TableCell className="font-medium">
                                        {editingId === item.incomeSourceId ? (
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                            />
                                        ) : (
                                            item.sourceName
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editingId === item.incomeSourceId ? (
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
                                                    <DropdownMenuItem onSelect={() => handleDeleteClick(item.incomeSourceId)}>
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
                title="Delete Income Source"
                description="Are you sure? This cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </Card>
    );
}

export default IncomeSourceListCard;
