import { addCategories, addSubCategories, addUsers, addRecentSpendings, addAllSubCategories } from '../store/mainDataSlice'
import store from '../store/store';

const api = async (url, method, body = null) => {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getCategories = async () => {
  const categories = await api('/api/categories', 'GET');
  store.dispatch(addCategories(categories));
};

export const getRecentSpendings = async () => {
  const spendings = await api('/api/spendings', 'GET');
  store.dispatch(addRecentSpendings(spendings));
};

export const getSubCategories = async (id) => {
  const subCategories = await api(`/api/subCategories/${id}`, 'GET');
  if (id === 0) {
    store.dispatch(addAllSubCategories(subCategories));
  } else {
    store.dispatch(addSubCategories(subCategories));
  }
};

export const getUsers = async () => {
  const users = await api('/api/users', 'GET');
  store.dispatch(addUsers(users));
};

export const createData = async (ext, data) => {
  return await api(`/api/${ext}`, 'POST', { data });
};

export const updateData = async (ext, data) => {
  return await api(`/api/${ext}`, 'PUT', data);
};

export const deleteSpending = async (id) => {
  return await api(`/api/spendings/delete/${id}`, 'DELETE');
};
