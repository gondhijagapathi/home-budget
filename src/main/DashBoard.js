import * as React from 'react';
import BottomNav from './BottomNav';
import AddItem from './AddItem';
import ItemsList from './ItemsList';
import { ThemeProvider, createTheme } from '@mui/material/styles';

function DashBoard() {
    const darkTheme = createTheme({
        palette: {
            mode: 'dark',
        },
    });

    return (
        <ThemeProvider theme={darkTheme}>
            <ItemsList />
            <AddItem />
            <BottomNav />
        </ThemeProvider>
    );
}

export default DashBoard;
