import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCategories, getUsers, getRecentSpendings, getSubCategories } from './api/apiCaller';
import { addCategories, addUsers, addRecentSpendings, addAllSubCategories } from './store/mainDataSlice';
import Recents from './Recents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, CreditCard } from 'lucide-react';

function DashBoard() {
    const dispatch = useDispatch();
    const recentSpendings = useSelector(state => state.mainData.recentSpendings);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [categories, allSubCategories, users, spendings] = await Promise.all([
                    getCategories(),
                    getSubCategories(0),
                    getUsers(),
                    getRecentSpendings(),
                ]);
                dispatch(addCategories(categories));
                dispatch(addAllSubCategories(allSubCategories));
                dispatch(addUsers(users));
                dispatch(addRecentSpendings(spendings));
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                // Here you would dispatch an action to show an error toast
            }
        };

        fetchData();
    }, [dispatch]);

    const totalSpend = recentSpendings.reduce((acc, item) => acc + item.amount, 0);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spending (Last 10)</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalSpend.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Based on the last 10 transactions
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{recentSpendings.length}</div>
                         <p className="text-xs text-muted-foreground">
                            Last 10 transactions
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div>
                <Recents />
            </div>
        </div>
    );
}

export default DashBoard;

