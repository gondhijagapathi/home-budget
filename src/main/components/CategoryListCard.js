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
import { getCategories, getSubCategories, deleteCategory, updateCategory } from '../api/apiCaller';
import { addCategories, addAllSubCategories, invalidateData } from '../store/mainDataSlice';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

function CategoryListCard() {
    const dispatch = useDispatch();
    const categories = useSelector(state => state.mainData.categories);

    // State for editing categories
    const [editingCategoryId, setEditingCategoryId] = React.useState(null);
    const [editingCategoryName, setEditingCategoryName] = React.useState("");

    // State for deleting
    const [showConfirmDeleteCategoryDialog, setShowConfirmDeleteCategoryDialog] = React.useState(false);
    const [categoryToDelete, setCategoryToDelete] = React.useState(null);

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
            await updateCategory(editingCategoryId, editingCategoryName);
            toast.success("Category updated successfully!");
            const updatedCategories = await getCategories();
            dispatch(addCategories(updatedCategories));
            dispatch(invalidateData());
            handleCancelEditCategory(); // Reset editing state
        } catch (error) {
            toast.error(error.message);
        }
    };

    const confirmDeleteCategory = async () => {
        if (!categoryToDelete) return;
        try {
            await deleteCategory(categoryToDelete);
            toast.success("Category deleted successfully!");
            const updatedCategories = await getCategories();
            dispatch(addCategories(updatedCategories));
            dispatch(invalidateData());
            const updatedSubCategories = await getSubCategories(0);
            dispatch(addAllSubCategories(updatedSubCategories));
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
