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

// Scanner (scratch detection)
export const verifyReturnImage = (orderId, beforeImages, afterImages) => {
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("before_front", beforeImages.front);
  formData.append("before_back", beforeImages.back);
  formData.append("before_left", beforeImages.left);
  formData.append("before_right", beforeImages.right);
  formData.append("after_front", afterImages.front);
  formData.append("after_back", afterImages.back);
  formData.append("after_left", afterImages.left);
  formData.append("after_right", afterImages.right);

  return API.post("/scanner/verify-360", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Reviews
export const getReviews = (itemId) => API.get(`/reviews/${itemId}`);
export const createReview = (itemId, data) =>
  API.post(`/reviews/${itemId}`, data);

// NLP Chatbot
export const queryChatbot = (text) => API.post("/chatbot/query", { text });

export default API;
