import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    categories: [],
    subCategories: [],
    allSubCategories: [],
    incomeSources: [],
    spendings: [],
    recentSpendings: [],
    lastUpdated: null,
};

export const financeSlice = createSlice({
    name: 'finance',
    initialState,
    reducers: {
        setCategories: (state, action) => {
            state.categories = action.payload;
        },
        setSubCategories: (state, action) => {
            state.subCategories = action.payload;
        },
        setAllSubCategories: (state, action) => {
            state.allSubCategories = action.payload;
        },
        setIncomeSources: (state, action) => {
            state.incomeSources = action.payload;
        },
        setSpendings: (state, action) => {
            state.spendings = action.payload;
        },
        addSpending: (state, action) => {
            state.spendings.push(action.payload);
        },
        removeSpending: (state, action) => {
            state.spendings = state.spendings.filter(s => s.id !== action.payload);
        },
        setRecentSpendings: (state, action) => {
            state.recentSpendings = action.payload;
        },
        invalidateData: (state) => {
            state.lastUpdated = new Date().toISOString();
        },
    },
});

export const {
    setCategories,
    setSubCategories,
    setAllSubCategories,
    setIncomeSources,
    setSpendings,
    addSpending,
    removeSpending,
    setRecentSpendings,
    invalidateData,
} = financeSlice.actions;

export default financeSlice.reducer;
