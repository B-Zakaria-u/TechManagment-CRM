// API Base URL - Change this to your backend URL
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    getToken() {
        return localStorage.getItem('token');
    }
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.auth !== false),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
                }
                return text;
            }

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            auth: false,
            body: JSON.stringify({ username, password }),
        });
    }

    async register(username, password, role, clientId = null) {
        return this.request('/auth/register', {
            method: 'POST',
            auth: false,
            body: JSON.stringify({ username, password, role, clientId }),
        });
    }

    // Orders endpoints
    async getOrders() {
        return this.request('/orders');
    }

    async getOrderById(id) {
        return this.request(`/orders/${id}`);
    }

    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }

    async updateOrder(id, orderData) {
        return this.request(`/orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(orderData),
        });
    }

    async deleteOrder(id) {
        return this.request(`/orders/${id}`, {
            method: 'DELETE',
        });
    }

    async importOrders(file) {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseURL}/orders/import`;
        const token = this.getToken();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Import failed');
        }

        return data;
    }
    async exportOrders() {
        const url = `${this.baseURL}/orders/export`;
        const token = this.getToken();

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Export failed');
        }

        return response.text();
    }

    // Clients endpoints
    async getClients() {
        return this.request('/clients');
    }

    async createClient(clientData) {
        return this.request('/clients', {
            method: 'POST',
            body: JSON.stringify(clientData),
        });
    }

    async updateClient(id, clientData) {
        return this.request(`/clients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(clientData),
        });
    }

    async deleteClient(id) {
        return this.request(`/clients/${id}`, {
            method: 'DELETE',
        });
    }

    async importClients(file) {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseURL}/clients/import`;
        const token = this.getToken();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Import failed');
        }

        return data;
    }
    async exportClients() {
        const url = `${this.baseURL}/clients/export`;
        const token = this.getToken();

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Export failed');
        }

        return response.text();
    }

    // Products endpoints
    async getProducts() {
        return this.request('/products');
    }

    async createProduct(productData) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData),
        });
    }

    async updateProduct(id, productData) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData),
        });
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE',
        });
    }

    async importProducts(file) {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseURL}/products/import`;
        const token = this.getToken();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Import failed');
        }

        return data;
    }

    async exportProducts() {
        const url = `${this.baseURL}/products/export`;
        const token = this.getToken();

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Export failed');
        }

        return response.text();
    }

    // Users endpoints
    async getUsers() {
        return this.request('/users');
    }

    async createUser(userData) {
        // Using register endpoint for creating users
        return this.register(userData.username, userData.password, userData.role, userData.clientId);
    }

    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE',
        });
    }

    async importUsers(file) {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseURL}/users/import`;
        const token = this.getToken();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Import failed');
        }

        return data;
    }
    async exportUsers() {
        const url = `${this.baseURL}/users/export`;
        const token = this.getToken();

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Export failed');
        }

        return response.text();
    }
}

export const api = new ApiService();
export default api;
