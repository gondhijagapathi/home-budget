import * as React from 'react';
import { useDispatch } from 'react-redux';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { financeService } from '../../../services/financeService';
import { setCategories, invalidateData } from '../../../store/financeSlice';

function AddCategoryCard() {
    const dispatch = useDispatch();
    const [newCategory, setNewCategory] = React.useState("");

    const handleAddCategory = async () => {
        if (!newCategory) {
            toast.error("Please enter a category name.");
            return;
        }
        try {
            await financeService.addCategory(newCategory);
            toast.success("Category added successfully!");
            const response = await financeService.getCategories(1, 1000);
            dispatch(setCategories(response.data || []));
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
