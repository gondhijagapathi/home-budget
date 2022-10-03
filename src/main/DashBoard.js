import * as React from 'react';
import BottomNav from './BottomNav';
import AddItem from './AddItem';
import ItemsList from './ItemsList';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AddItemDialog from './AddItemDialog';
import { useSelector } from 'react-redux'
import { getCategories, getMeasures } from './api/apiCaller';

function DashBoard() {
    const addDialogOpen = useSelector(state => state.mainData.addDialogOpen)
    const darkTheme = createTheme({
        palette: {
            mode: 'dark',
        },
    });

    React.useEffect(() => {
        getCategories();
        getMeasures();
    },[]);

    return (
        <ThemeProvider theme={darkTheme}>
            <ItemsList />
            <AddItem />
            <BottomNav />
            <AddItemDialog isOpen={addDialogOpen} />
        </ThemeProvider>
    );
}

export default DashBoard;
