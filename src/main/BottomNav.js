import * as React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import StorageIcon from '@mui/icons-material/Storage';
import Paper from '@mui/material/Paper';
import { useDispatch, useSelector } from 'react-redux';
import { changeTab } from './store/mainDataSlice';

function BottomNav() {
    const dispatch = useDispatch()
    const tab = useSelector(state => state.mainData.tabView)

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
            <BottomNavigation
                showLabels
                value={tab}
                onChange={(event, newValue) => {
                    dispatch(changeTab(newValue));
                }}>
                <BottomNavigationAction label="Add" value="add" icon={<AddCircleOutlineIcon />} />
                <BottomNavigationAction label="Recent" value="recents" icon={<RestoreIcon />} />
                <BottomNavigationAction label="Database" value="edit" icon={<StorageIcon />} />
            </BottomNavigation></Paper>
    );
}

export default BottomNav;