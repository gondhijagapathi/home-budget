import * as React from 'react';
import { useDispatch } from 'react-redux';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCategories, postData } from '../api/apiCaller';
import { addCategories, invalidateData } from '../store/mainDataSlice';

function AddCategoryCard() {
    const dispatch = useDispatch();
    const [newCategory, setNewCategory] = React.useState("");

    const handleAddCategory = async () => {
        if (!newCategory) {
            toast.error("Please enter a category name.");
            return;
        }
        try {
            await postData('categories', { categoryName: newCategory });
            toast.success("Category added successfully!");
            const response = await getCategories(1, 1000);
            dispatch(addCategories(response.data || []));
            dispatch(invalidateData());
            setNewCategory("");
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
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
    );
}

export default AddCategoryCard;
