

async function apiCall(method, url, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Something went wrong');
    }

    return result;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}



export function getCategories(page = 1, limit = 15) {
  return apiCall('GET', `/api/categories?page=${page}&limit=${limit}`);
}

export function getRecentSpendings(page = 1, limit = 15) {
  return apiCall('GET', `/api/spendings?page=${page}&limit=${limit}`);
}

export function getSubCategories(id, page = 1, limit = 15) {
  return apiCall('GET', `/api/subCategories/${id}?page=${page}&limit=${limit}`);
}

export function getUsers(page = 1, limit = 15) {
  return apiCall('GET', `/api/users?page=${page}&limit=${limit}`);
}

export function postData(ext, data) {
  return apiCall('POST', `/api/${ext}`, data);
}

export function deleteSpending(id) {
  return apiCall('POST', `/api/spendings/delete/${id}`);
}

export function deleteCategory(id) {
  return apiCall('DELETE', `/api/categories/delete/${id}`);
}

export function deleteSubCategory(id) {
  return apiCall('DELETE', `/api/subCategories/delete/${id}`);
}

export function updateCategory(id, categoryName) {
  return apiCall('PUT', `/api/categories/${id}`, { categoryName });
}

export function updateSubCategory(id, subCategoryName, categoryId) {
  return apiCall('PUT', `/api/subCategories/${id}`, { subCategoryName, categoryId });
}

export function getSpendingsByDateRange(startDate, endDate, page = 1, limit = 15, sortBy = null, order = null) {
  const params = new URLSearchParams();
  if (startDate) {
    params.append('startDate', startDate);
  }
  if (endDate) {
    params.append('endDate', endDate);
  }
  params.append('page', page);
  params.append('limit', limit);
  if (sortBy) params.append('sortBy', sortBy);
  if (order) params.append('order', order);

  return apiCall('GET', `/api/spendings?${params.toString()}`);
}

// --- Income APIs ---

export function getIncomeSources(page = 1, limit = 15) {
  return apiCall('GET', `/api/incomeSources?page=${page}&limit=${limit}`);
}

export function postIncomeSource(sourceName) {
  return apiCall('POST', '/api/incomeSources', { sourceName });
}

export function updateIncomeSource(id, sourceName) {
  return apiCall('PUT', `/api/incomeSources/${id}`, { sourceName });
}

export function deleteIncomeSource(id) {
  return apiCall('DELETE', `/api/incomeSources/delete/${id}`);
}

export function getIncomes(startDate, endDate, page = 1, limit = 15) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  params.append('page', page);
  params.append('limit', limit);
  return apiCall('GET', `/api/incomes?${params.toString()}`);
}

export function postIncome(data) {
  return apiCall('POST', '/api/incomes', data);
}

export function updateIncome(id, data) {
  return apiCall('PUT', `/api/incomes/${id}`, data);
}

export function deleteIncome(id) {
  return apiCall('DELETE', `/api/incomes/delete/${id}`);
}

// --- Backup & Restore ---

export async function downloadBackup() {
  // Direct file download using fetch blob
  try {
    const response = await fetch('/api/backup');
    if (!response.ok) throw new Error('Backup failed');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Filename usually comes from Content-Disposition header, but we can generate one too
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = `home-budget-backup-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download backup failed:', error);
    throw error;
  }
}

export function restoreBackup(data) {
  return apiCall('POST', '/api/restore', data);
}

