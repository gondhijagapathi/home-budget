import * as React from 'react';
import { useDispatch } from 'react-redux';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { postIncomeSource, getIncomeSources } from '../api/apiCaller';
import { addIncomeSources, invalidateData } from '../store/mainDataSlice';

function AddIncomeSourceCard() {
    const dispatch = useDispatch();
    const [newSource, setNewSource] = React.useState("");

    const handleAddSource = async () => {
        if (!newSource) {
            toast.error("Please enter a source name.");
            return;
        }
        try {
            await postIncomeSource(newSource);
            toast.success("Income source added!");

            // Refresh global store
            const updatedSources = await getIncomeSources(1, 1000);
            dispatch(addIncomeSources(updatedSources.data || []));
            dispatch(invalidateData());

            setNewSource("");
        } catch (error) {
            toast.error(error.message || "Failed to add source");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Income Source</CardTitle>
                <CardDescription>
                    Create a new source (e.g., Salary, Investing).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2">
                    <Label htmlFor="source-name">Source Name</Label>
                    <Input
                        id="source-name"
                        value={newSource}
                        onChange={(e) => setNewSource(e.target.value)}
                        placeholder="e.g., Salary"
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleAddSource}>Add Source</Button>
            </CardFooter>
        </Card>
    );
}

export default AddIncomeSourceCard;
