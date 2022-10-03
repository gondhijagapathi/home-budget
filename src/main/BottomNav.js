import * as React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Paper from '@mui/material/Paper';

function BottomNav() {
    const [value, setValue] = React.useState('add');

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
            <BottomNavigation
                showLabels
                value={value}
                onChange={(event, newValue) => {
                    setValue(newValue);
                }}>
                <BottomNavigationAction label="Add Items" value="add" icon={<AddCircleOutlineIcon />} />
                <BottomNavigationAction label="Recently Added" value="recents" icon={<RestoreIcon />} />
            </BottomNavigation></Paper>
    );
}

export default BottomNav;