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
import { getSubCategories, deleteSubCategory, updateSubCategory } from '../api/apiCaller';
import { addAllSubCategories, invalidateData } from '../store/mainDataSlice';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

function SubCategoryListCard() {
    const dispatch = useDispatch();
    const categories = useSelector(state => state.mainData.categories);
    const allSubCategories = useSelector(state => state.mainData.allSubCategories);

    // State for editing subcategories
    const [editingSubCategoryId, setEditingSubCategoryId] = React.useState(null);
    const [editingSubCategoryName, setEditingSubCategoryName] = React.useState("");
    const [editingSubCategoryParentId, setEditingSubCategoryParentId] = React.useState("");

    // State for deleting
    const [showConfirmDeleteSubCategoryDialog, setShowConfirmDeleteSubCategoryDialog] = React.useState(false);
    const [subCategoryToDelete, setSubCategoryToDelete] = React.useState(null);

    const handleEditSubCategoryClick = (subCategory) => {
        setEditingSubCategoryId(subCategory.subCategoryId);
        setEditingSubCategoryName(subCategory.subCategoryName);
        setEditingSubCategoryParentId(subCategory.categoryId);
    };

    const handleCancelEditSubCategory = () => {
        setEditingSubCategoryId(null);
        setEditingSubCategoryName("");
        setEditingSubCategoryParentId("");
    };

    const handleSaveSubCategory = async () => {
        if (!editingSubCategoryName.trim()) {
            toast.error("Subcategory name cannot be empty.");
            return;
        }
        if (!editingSubCategoryParentId) {
            toast.error("Parent category must be selected.");
            return;
        }
        try {
            await updateSubCategory(editingSubCategoryId, editingSubCategoryName, editingSubCategoryParentId);
            toast.success("Subcategory updated successfully!");
            const updatedSubCategories = await getSubCategories(0);
            dispatch(addAllSubCategories(updatedSubCategories));
            dispatch(invalidateData());
            handleCancelEditSubCategory();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const confirmDeleteSubCategory = async () => {
        if (!subCategoryToDelete) return;
        try {
            await deleteSubCategory(subCategoryToDelete);
            toast.success("Subcategory deleted successfully!");
            const updatedSubCategories = await getSubCategories(0);
            dispatch(addAllSubCategories(updatedSubCategories));
            dispatch(invalidateData());
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubCategoryToDelete(null);
            setShowConfirmDeleteSubCategoryDialog(false);
        }
    };

    const handleDeleteSubCategoryClick = (id) => {
        setSubCategoryToDelete(id);
        setShowConfirmDeleteSubCategoryDialog(true);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>View & Delete Subcategories</CardTitle>
                <CardDescription>
                    Manage your existing subcategories.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subcategory Name</TableHead>
                                <TableHead>Parent Category</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allSubCategories.map((subCat) => (
                                <TableRow key={subCat.subCategoryId}>
                                    <TableCell className="font-medium">
                                        {editingSubCategoryId === subCat.subCategoryId ? (
                                            <Input
                                                value={editingSubCategoryName}
                                                onChange={(e) => setEditingSubCategoryName(e.target.value)}
                                            />
                                        ) : (
                                            subCat.subCategoryName
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingSubCategoryId === subCat.subCategoryId ? (
                                            <Select
                                                value={editingSubCategoryParentId}
                                                onValueChange={setEditingSubCategoryParentId}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select parent category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.categoryId} value={cat.categoryId}>
                                                            {cat.categoryName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            categories.find(cat => cat.categoryId === subCat.categoryId)?.categoryName || 'N/A'
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editingSubCategoryId === subCat.subCategoryId ? (
                                            <>
                                                <Button size="sm" variant="outline" onClick={handleCancelEditSubCategory} className="mr-2">
                                                    Cancel
                                                </Button>
                                                <Button size="sm" onClick={handleSaveSubCategory}>Save</Button>
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
                                                        onSelect={() => handleEditSubCategoryClick(subCat)}
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() => handleDeleteSubCategoryClick(subCat.subCategoryId)}
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
                isOpen={showConfirmDeleteSubCategoryDialog}
                onOpenChange={setShowConfirmDeleteSubCategoryDialog}
                title="Confirm Subcategory Deletion"
                description="Are you sure you want to delete this subcategory? This action cannot be undone."
                onConfirm={confirmDeleteSubCategory}
                onCancel={() => setShowConfirmDeleteSubCategoryDialog(false)}
            />
        </Card>
    );
}

export default SubCategoryListCard;
