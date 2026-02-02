import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories, getSubCategories, postData, deleteCategory, deleteSubCategory, updateCategory, updateSubCategory } from './api/apiCaller';
import { addCategories, addAllSubCategories, invalidateData } from './store/mainDataSlice'; // Import invalidateData
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; // Import Table components
import { MoreHorizontal } from "lucide-react"; // Import MoreHorizontal icon
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"; // Import Dialog components

function EditDatabase() {
    const dispatch = useDispatch();
    const categories = useSelector(state => state.mainData.categories);
    const allSubCategories = useSelector(state => state.mainData.allSubCategories);

    const [newCategory, setNewCategory] = React.useState("");
    const [newSubCategory, setNewSubCategory] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState("");

    // State for editing categories
    const [editingCategoryId, setEditingCategoryId] = React.useState(null);
    const [editingCategoryName, setEditingCategoryName] = React.useState("");

    // State for editing subcategories
    const [editingSubCategoryId, setEditingSubCategoryId] = React.useState(null);
    const [editingSubCategoryName, setEditingSubCategoryName] = React.useState("");
    const [editingSubCategoryParentId, setEditingSubCategoryParentId] = React.useState("");


    const [showConfirmDeleteCategoryDialog, setShowConfirmDeleteCategoryDialog] = React.useState(false);
    const [categoryToDelete, setCategoryToDelete] = React.useState(null);
    const [showConfirmDeleteSubCategoryDialog, setShowConfirmDeleteSubCategoryDialog] = React.useState(false);
    const [subCategoryToDelete, setSubCategoryToDelete] = React.useState(null);

    const handleAddCategory = async () => {
        if (!newCategory) {
            toast.error("Please enter a category name.");
            return;
        }
        try {
            await postData('categories', { categoryName: newCategory });
            toast.success("Category added successfully!");
            const updatedCategories = await getCategories();
            dispatch(addCategories(updatedCategories));
            setNewCategory("");
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleAddSubCategory = async () => {
        if (!selectedCategory || !newSubCategory) {
            toast.error("Please select a category and enter a subcategory name.");
            return;
        }
        try {
            await postData(`subCategories/${selectedCategory}`, {
                categoryId: selectedCategory,
                subCategoryName: newSubCategory,
            });
            toast.success("Subcategory added successfully!");
            const updatedSubCategories = await getSubCategories(0);
            dispatch(addAllSubCategories(updatedSubCategories));
            setNewSubCategory("");
            setSelectedCategory("");
        } catch (error) {
            toast.error(error.message);
        }
    };
    
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

    const handleEditSubCategoryClick = (subCategory) => {
        setEditingSubCategoryId(subCategory.subCategoryId);
        setEditingSubCategoryName(subCategory.subCategoryName);
        setEditingSubCategoryParentId(subCategory.categoryId); // Assuming subCategory has categoryId
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
            const updatedSubCategories = await getSubCategories(0); // Assuming 0 fetches all subcategories
            dispatch(addAllSubCategories(updatedSubCategories));
            dispatch(invalidateData());
            handleCancelEditSubCategory(); // Reset editing state
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
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            <Card>
                <CardHeader>
                    <CardTitle>Add a New Category</CardTitle>
                    <CardDescription>
                        Create a new top-level category for your expenses.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2">
                        <Label htmlFor="category-name">Category Name</Label>
                        <Input
                            id="category-name"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="e.g., Utilities"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAddCategory}>Add Category</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Add a New Subcategory</CardTitle>
                    <CardDescription>
                        Add a new subcategory under an existing main category.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="parent-category">Parent Category</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger id="parent-category">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.categoryId} value={cat.categoryId}>
                                            {cat.categoryName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subcategory-name">Subcategory Name</Label>
                            <Input
                                id="subcategory-name"
                                value={newSubCategory}
                                onChange={(e) => setNewSubCategory(e.target.value)}
                                placeholder="e.g., Electricity Bill"
                                disabled={!selectedCategory}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAddSubCategory} disabled={!selectedCategory}>
                        Add Subcategory
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>View & Delete Categories</CardTitle>
                    <CardDescription>
                        Manage your existing categories.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>View & Delete Subcategories</CardTitle>
                    <CardDescription>
                        Manage your existing subcategories.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>

            {/* Confirmation Dialog for Category Deletion */}
            <Dialog open={showConfirmDeleteCategoryDialog} onOpenChange={setShowConfirmDeleteCategoryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Category Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this category? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDeleteCategoryDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDeleteCategory}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Subcategory Deletion */}
            <Dialog open={showConfirmDeleteSubCategoryDialog} onOpenChange={setShowConfirmDeleteSubCategoryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Subcategory Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this subcategory? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDeleteSubCategoryDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDeleteSubCategory}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default EditDatabase;