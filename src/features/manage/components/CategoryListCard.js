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
import { setCategories, setAllSubCategories, invalidateData } from '../../../store/financeSlice';
import DeleteConfirmationDialog from '../../../components/DeleteConfirmationDialog';
import PaginationControls from '../../../components/PaginationControls';

function CategoryListCard() {
    const dispatch = useDispatch();
    const lastUpdated = useSelector(state => state.finance.lastUpdated);

    // Local state for paginated table
    const [categories, setCategories] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);

    // State for editing categories
    const [editingCategoryId, setEditingCategoryId] = React.useState(null);
    const [editingCategoryName, setEditingCategoryName] = React.useState("");

    // State for deleting
    const [showConfirmDeleteCategoryDialog, setShowConfirmDeleteCategoryDialog] = React.useState(false);
    const [categoryToDelete, setCategoryToDelete] = React.useState(null);

    const fetchCategories = React.useCallback(async () => {
        try {
            const response = await financeService.getCategories(currentPage, 15);
            setCategories(response.data || []);
            setTotalPages(response.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }, [currentPage]);

    React.useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    React.useEffect(() => {
        if (lastUpdated) {
            fetchCategories();
        }
    }, [lastUpdated, fetchCategories]);

    const handleEditCategoryClick = (category) => {
        setEditingCategoryId(category.categoryId);
        setEditingCategoryName(category.categoryName);
    };

    const handleCancelEditCategory = () => {
        setEditingCategoryId(null);
        setEditingCategoryName("");
    };

    const handleSaveCategory = async () => {
        if (!editingCategoryName.trim()) {
            toast.error("Category name cannot be empty.");
            return;
        }
        try {
            await financeService.updateCategory(editingCategoryId, editingCategoryName);
            toast.success("Category updated successfully!");

            // 1. Refresh local table
            await fetchCategories();

            // 2. Refresh global store (for dropdowns)
            const allCategories = await financeService.getCategories(1, 1000);
            dispatch(setCategories(allCategories.data || []));
            dispatch(invalidateData());

            handleCancelEditCategory(); // Reset editing state
        } catch (error) {
            toast.error(error.message);
        }
    };

    const confirmDeleteCategory = async () => {
        if (!categoryToDelete) return;
        try {
            await financeService.deleteCategory(categoryToDelete);
            toast.success("Category deleted successfully!");

            // 1. Refresh local table
            await fetchCategories();

            // 2. Refresh global store
            const allCategories = await financeService.getCategories(1, 1000);
            dispatch(setCategories(allCategories.data || []));

            const allSubCategories = await financeService.getSubCategories(0, 1, 1000);
            dispatch(setAllSubCategories(allSubCategories.data || []));

            dispatch(invalidateData());
        } catch (error) {
            toast.error(error.message);
        } finally {
            setCategoryToDelete(null);
            setShowConfirmDeleteCategoryDialog(false);
        }
    };

    const handleDeleteCategoryClick = (id) => {
        setCategoryToDelete(id);
        setShowConfirmDeleteCategoryDialog(true);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>View & Delete Categories</CardTitle>
                <CardDescription>
                    Manage your existing categories.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((cat) => (
                                <TableRow key={cat.categoryId}>
                                    <TableCell className="font-medium">
                                        {editingCategoryId === cat.categoryId ? (
                                            <Input
                                                value={editingCategoryName}
                                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                            />
                                        ) : (
                                            cat.categoryName
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editingCategoryId === cat.categoryId ? (
                                            <>
                                                <Button size="sm" variant="outline" onClick={handleCancelEditCategory} className="mr-2">
                                                    Cancel
                                                </Button>
                                                <Button size="sm" onClick={handleSaveCategory}>Save</Button>
                                            </>
                                        ) : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        aria-haspopup="true"
                                                        size="icon"
                                                        variant="ghost"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onSelect={() => handleEditCategoryClick(cat)}
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() => handleDeleteCategoryClick(cat.categoryId)}
                                                    >
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
                isOpen={showConfirmDeleteCategoryDialog}
                onOpenChange={setShowConfirmDeleteCategoryDialog}
                title="Confirm Category Deletion"
                description="Are you sure you want to delete this category? This action cannot be undone."
                onConfirm={confirmDeleteCategory}
                onCancel={() => setShowConfirmDeleteCategoryDialog(false)}
            />
        </Card>
    );
}

export default CategoryListCard;
