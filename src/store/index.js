import { configureStore } from '@reduxjs/toolkit';
import financeReducer from './financeSlice';
import userReducer from './userSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
    reducer: {
        finance: financeReducer,
        user: userReducer,
        ui: uiReducer,
    },
});
