import * as React from 'react';
import { DatePickerDemo } from "@/components/ui/date-picker";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDispatch, useSelector } from 'react-redux';
import { postData, getRecentSpendings } from './api/apiCaller';
import { addRecentSpendings, invalidateData } from './store/mainDataSlice';
import { toast } from "sonner";
import uuid from 'react-uuid';


export default function AddItemDialog() {
    const dispatch = useDispatch();
    const [open, setOpen] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState("");
    const [selectedSubCategory, setSelectedSubCategory] = React.useState("");
    const [amount, setAmount] = React.useState("");
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [selectedDate, setSelectedDate] = React.useState(new Date());


    const categories = useSelector(state => state.mainData.categories);
    const allSubCategories = useSelector(state => state.mainData.allSubCategories);
    const users = useSelector(state => state.mainData.users);

    React.useEffect(() => {
        if (users.length > 0 && selectedUser === null) {
            setSelectedUser(users[0].personId);
        }
    }, [users, selectedUser]);

    const filteredSubcategories = allSubCategories.filter(sc => sc.categoryId === selectedCategory);

    const resetFormFields = () => {
        setSelectedCategory("");
        setSelectedSubCategory("");
        setAmount("");
        // setSelectedUser(null); // Keep the selected user as per common UX for adding multiple items
        // setSelectedDate(new Date()); // Removed as per user request
    };

    const handleSubmit = async (shouldCloseDialog) => {
        // e.preventDefault(); // No longer needed if buttons handle submission
        if (!selectedCategory || !selectedSubCategory || !amount || !selectedUser || !selectedDate) {
            toast.error("Please fill out all required fields.");
            return;
        }

        const data = [
            uuid(),
            selectedSubCategory,
            selectedUser,
            parseFloat(amount),
            format(selectedDate, "yyyy-MM-dd HH:mm:ss"),
            selectedCategory,
        ];

        try {
            await postData('spendings', { data });
            toast.success("Item added successfully!");
            
            const spendings = await getRecentSpendings();
            dispatch(addRecentSpendings(spendings));
            dispatch(invalidateData());
            
            resetFormFields(); // Reset fields regardless
            if (shouldCloseDialog) {
                setOpen(false); // Close dialog only if explicitly requested
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add New Item</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Spending</DialogTitle>
                    <DialogDescription>
                        Add a new transaction to your budget. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                {/* Removed onSubmit={handleSubmit} from form, buttons will now handle submission */}
                <form> 
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user" className="text-right">
                                User
                            </Label>
                            <Select
                                value={selectedUser}
                                onValueChange={setSelectedUser}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(user => (
                                        <SelectItem key={user.personId} value={user.personId}>
                                            {user.userName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Category
                            </Label>
                            <Select
                                value={selectedCategory}
                                onValueChange={setSelectedCategory}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.categoryId} value={cat.categoryId}>
                                            {cat.categoryName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subcategory" className="text-right">
                                Subcategory
                            </Label>
                            <Select
                                value={selectedSubCategory}
                                onValueChange={setSelectedSubCategory}
                                disabled={!selectedCategory}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a subcategory" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSubcategories.map(sub => (
                                        <SelectItem key={sub.subCategoryId} value={sub.subCategoryId}>
                                            {sub.subCategoryName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="col-span-3"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                                Date
                            </Label>
                            <div className="col-span-3">
                                <DatePickerDemo date={selectedDate} setDate={setSelectedDate} />
                            </div>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleSubmit(false)}>Save and Add Another</Button>
                        <Button type="button" onClick={() => handleSubmit(true)}>Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}