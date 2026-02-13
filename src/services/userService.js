import { get } from './api';

export const userService = {
    getUsers: (page = 1, limit = 15) => get(`/users?page=${page}&limit=${limit}`),
};
