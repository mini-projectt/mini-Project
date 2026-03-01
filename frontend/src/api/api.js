import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

// Items
export const getItems = (params) => API.get("/items", { params });
export const getItem = (id) => API.get(`/items/${id}`);
export const createItem = (data) => API.post("/items", data);
export const updateItem = (id, data) => API.put(`/items/${id}`, data);
export const deleteItem = (id) => API.delete(`/items/${id}`);

// Orders
export const getOrders = () => API.get("/orders");
export const createOrder = (data) => API.post("/orders", data);
export const updateOrder = (id, data) => API.put(`/orders/${id}`, data);

// Reviews
export const getReviews = (itemId) => API.get(`/reviews/${itemId}`);
export const createReview = (itemId, data) =>
  API.post(`/reviews/${itemId}`, data);

export default API;
