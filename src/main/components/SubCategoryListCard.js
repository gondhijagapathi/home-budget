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
import PaginationControls from './PaginationControls';

function SubCategoryListCard() {
    const dispatch = useDispatch();
    const lastUpdated = useSelector(state => state.mainData.lastUpdated);
    const categories = useSelector(state => state.mainData.categories);

    // Local state for Filtering & Pagination
    const [subCategories, setSubCategories] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [filterCategoryId, setFilterCategoryId] = React.useState("0"); // "0" for All

    // State for editing subcategories
    const [editingSubCategoryId, setEditingSubCategoryId] = React.useState(null);
    const [editingSubCategoryName, setEditingSubCategoryName] = React.useState("");
    const [editingSubCategoryParentId, setEditingSubCategoryParentId] = React.useState("");

    // State for deleting
    const [showConfirmDeleteSubCategoryDialog, setShowConfirmDeleteSubCategoryDialog] = React.useState(false);
    const [subCategoryToDelete, setSubCategoryToDelete] = React.useState(null);

    const fetchSubCategories = React.useCallback(async () => {
        try {
            // "0" usually means all in our backend logic (based on initial analysis of existing code, though controller checked !== "0")
            // Let's verify: In SubCategoryController: if (id && id !== "0")... so "0" works for getting all.
            const response = await getSubCategories(filterCategoryId, currentPage, 15);
            setSubCategories(response.data || []);
            setTotalPages(response.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch subcategories", error);
        }
    }, [filterCategoryId, currentPage]);

    React.useEffect(() => {
        fetchSubCategories();
    }, [fetchSubCategories]);

    React.useEffect(() => {
        if (lastUpdated) {
            fetchSubCategories();
        }
    }, [lastUpdated, fetchSubCategories]);

    // Reset page when filter changes
    const handleFilterChange = (val) => {
        setFilterCategoryId(val);
        setCurrentPage(1);
    };

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

            // 1. Refresh local
            await fetchSubCategories();

            // 2. Refresh global
            const allSub = await getSubCategories(0, 1, 1000);
            dispatch(addAllSubCategories(allSub.data || []));
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

            // 1. Refresh local
            await fetchSubCategories();

            // 2. Refresh global
            const allSub = await getSubCategories(0, 1, 1000);
            dispatch(addAllSubCategories(allSub.data || []));
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle>View & Delete Subcategories</CardTitle>
                        <CardDescription>
                            Manage your existing subcategories.
                        </CardDescription>
                    </div>
                    <div className="w-full md:w-auto">
                        <Select value={filterCategoryId} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Filter by Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">All Categories</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.categoryId} value={cat.categoryId}>
                                        {cat.categoryName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
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
                            {subCategories.map((subCat) => (
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
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
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
