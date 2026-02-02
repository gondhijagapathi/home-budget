import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories, getSubCategories, postData } from './api/apiCaller';
import { addCategories, addAllSubCategories } from './store/mainDataSlice';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function EditDatabase() {
    const dispatch = useDispatch();
    const categories = useSelector(state => state.mainData.categories);

    const [newCategory, setNewCategory] = React.useState("");
    const [newSubCategory, setNewSubCategory] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState("");

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
            toast.error("Failed to add category.");
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
            toast.error("Failed to add subcategory.");
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
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
        </div>
    );
}

export default EditDatabase;