const BASE_URL = '/api';

async function apiCall(method, endpoint, data = null, isFormData = false) {
    try {
        const url = `${BASE_URL}${endpoint}`;
        const options = {
            method,
            headers: isFormData ? {} : {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            options.body = isFormData ? data : JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }

        return result;
    } catch (error) {
        console.error(`API call failed [${method} ${endpoint}]:`, error);
        throw error;
    }
}

export const get = (endpoint) => apiCall('GET', endpoint);
export const post = (endpoint, data, isFormData = false) => apiCall('POST', endpoint, data, isFormData);
export const put = (endpoint, data) => apiCall('PUT', endpoint, data);
export const del = (endpoint) => apiCall('DELETE', endpoint);

export const download = async (endpoint, filename = 'backup.json') => {
    try {
        const url = `/api${endpoint}`; // Use direct relative path to avoid double /api if BASE_URL already has it?
        // BASE_URL is '/api' in imported code step 133.
        // endpoint usually starts with /. So '/api' + '/backup'.
        // Wait, apiCall uses `${BASE_URL}${endpoint}` -> `/api/backup`.
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Download failed", error);
        throw error;
    }
};
