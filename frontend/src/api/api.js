import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

// Request interceptor: Add JWT token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Auth
export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/auth/me");

// Items
export const getItems = (params) => API.get("/items", { params });
export const getItem = (id) => API.get(`/items/${id}`);
export const createItem = (data) => API.post("/items", data);
export const updateItem = (id, data) => API.put(`/items/${id}`, data);
export const deleteItem = (id) => API.delete(`/items/${id}`);

// Orders
export const getOrders = () => API.get("/orders");
export const getMyOrders = () => API.get("/orders/my-orders");
export const createOrder = (data) => API.post("/orders", data);
export const updateOrder = (id, data) => API.put(`/orders/${id}`, data);

// Reviews
export const getReviews = (itemId) => API.get(`/reviews/${itemId}`);
export const createReview = (itemId, data) =>
  API.post(`/reviews/${itemId}`, data);

export default API;
