

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


export function getCategories() {
  return apiCall('GET', "/api/categories");
}

export function getRecentSpendings() {
  return apiCall('GET', "/api/spendings");
}

export function getSubCategories(id) {
  return apiCall('GET', `/api/subCategories/${id}`);
}

export function getUsers() {
  return apiCall('GET', "/api/users");
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

export function getSpendingsByDateRange(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) {
    params.append('startDate', startDate);
  }
  if (endDate) {
    params.append('endDate', endDate);
  }
  return apiCall('GET', `/api/spendings?${params.toString()}`);
}

