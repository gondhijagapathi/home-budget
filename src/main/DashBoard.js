import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Recents from './Recents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee } from 'lucide-react';
import AIAdvisor from './AIAdvisor';

function DashBoard() {
    const dispatch = useDispatch();
    const recentSpendings = useSelector(state => state.mainData.recentSpendings);

    return (
        <div className="flex flex-col gap-4">
            <div className="min-w-0">
                <AIAdvisor />
            </div>
            <div className="min-w-0">
                <Recents />
            </div>
        </div>
    );
}

export default DashBoard;