import { get, post, put, del, download } from './api';

export const financeService = {
    // Categories
    getCategories: (page = 1, limit = 15) => get(`/categories?page=${page}&limit=${limit}`),
    addCategory: (categoryName) => post('/categories', { categoryName }),
    updateCategory: (id, categoryName) => put(`/categories/${id}`, { categoryName }),
    deleteCategory: (id) => del(`/categories/delete/${id}`),

    // SubCategories
    getSubCategories: (id, page = 1, limit = 15) => get(`/subCategories/${id}?page=${page}&limit=${limit}`),
    addSubCategory: (categoryId, subCategoryName) => post(`/subCategories/${categoryId}`, { subCategoryName, categoryId }),
    updateSubCategory: (id, subCategoryName, categoryId) => put(`/subCategories/${id}`, { subCategoryName, categoryId }),
    deleteSubCategory: (id) => del(`/subCategories/delete/${id}`),

    // Income Sources
    getIncomeSources: (page = 1, limit = 15) => get(`/incomeSources?page=${page}&limit=${limit}`),
    addIncomeSource: (sourceName) => post('/incomeSources', { sourceName }),
    updateIncomeSource: (id, sourceName) => put(`/incomeSources/${id}`, { sourceName }),
    deleteIncomeSource: (id) => del(`/incomeSources/delete/${id}`),

    // Spendings
    getSpendings: (page = 1, limit = 15) => get(`/spendings?page=${page}&limit=${limit}`),
    getRecentSpendings: (page = 1, limit = 15) => get(`/spendings?page=${page}&limit=${limit}`),
    getSpendingsByDateRange: (startDate, endDate, page = 1, limit = 15, sortBy = null, order = null) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('page', page);
        params.append('limit', limit);
        if (sortBy) params.append('sortBy', sortBy);
        if (order) params.append('order', order);
        return get(`/spendings?${params.toString()}`);
    },
    addSpending: (data) => post('/spendings', data),
    deleteSpending: (id) => post(`/spendings/delete/${id}`),

    // Incomes
    getIncomes: (startDate, endDate, page = 1, limit = 15) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('page', page);
        params.append('limit', limit);
        return get(`/incomes?${params.toString()}`);
    },
    addIncome: (data) => post('/incomes', data),
    updateIncome: (id, data) => put(`/incomes/${id}`, data),
    deleteIncome: (id) => del(`/incomes/delete/${id}`),

    // Receipt
    uploadReceipt: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return post('/upload-receipt', formData, true);
    },



    // Backup & Restore
    restoreBackup: (data) => post('/restore', data),
    downloadBackup: () => download('/backup', 'home-budget-backup.json'), // Endpoint is /api/backup per routes/index.js

    // Usage Stats
    getUsageStats: () => get('/usage'),
};
