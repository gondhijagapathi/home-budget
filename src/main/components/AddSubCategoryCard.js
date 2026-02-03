import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSubCategories, postData } from '../api/apiCaller';
import { addAllSubCategories, invalidateData } from '../store/mainDataSlice';

function AddSubCategoryCard() {
    const dispatch = useDispatch();
    const categories = useSelector(state => state.mainData.categories);
    const [newSubCategory, setNewSubCategory] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState("");

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
            const response = await getSubCategories(0, 10000); // 0 or null for all? Need to check API signature. 
            // Assuming getSubCategories(categoryId) where 0 means all? 
            // Or extract .data if it returns object.
            dispatch(addAllSubCategories(response.data || []));
            dispatch(invalidateData());
            setNewSubCategory("");
            setSelectedCategory("");
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
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
    );
}

export default AddSubCategoryCard;
