import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    addDialogOpen: false,
    tabView: "add",
    alert: {
        open: false,
        message: "",
        type: "error",
    },
    theme: "system",
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setAddDialogOpen: (state, action) => {
            state.addDialogOpen = action.payload;
        },
        setTabView: (state, action) => {
            state.tabView = action.payload;
        },
        setAlert: (state, action) => {
            state.alert = {
                open: action.payload.open,
                message: action.payload.message || "",
                type: action.payload.type || "error",
            };
        },
        closeAlert: (state) => {
            state.alert.open = false;
        },
    },
});

export const { setAddDialogOpen, setTabView, setAlert, closeAlert } = uiSlice.actions;

export default uiSlice.reducer;
