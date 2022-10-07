import * as React from 'react';
import BottomNav from './BottomNav';
import AddItem from './AddItem';
import ItemsList from './ItemsList';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AddItemDialog from './AddItemDialog';
import { useSelector } from 'react-redux'
import { getCategories, getMeasures, getShops, getUsers, getItems, getRecentSpendings } from './api/apiCaller';
import Recents from './Recents';
import EditDatabase from './EditDatabase';
import AlertSnack from './AlertSnack';

function DashBoard() {
    const addDialogOpen = useSelector(state => state.mainData.addDialogOpen)
    const tab = useSelector(state => state.mainData.tabView)
    const darkTheme = createTheme({
        palette: {
            mode: 'dark',
        },
    });

    React.useEffect(() => {
        getCategories();
        getMeasures();
        getShops();
        getUsers();
        getItems(0);
        getRecentSpendings();
    }, []);

    return (
        <ThemeProvider theme={darkTheme}>
            {tab === 'add' ? <ItemsList /> : tab === 'edit' ? <EditDatabase /> : <Recents />}
            <AddItem visible={tab === 'add'} />
            <BottomNav />
            <AddItemDialog isOpen={addDialogOpen} />
            <AlertSnack />
        </ThemeProvider>
    );
}

export default DashBoard;
