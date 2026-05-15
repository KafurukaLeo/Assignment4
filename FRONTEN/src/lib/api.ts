import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_APP_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making request to: ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`Response from: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error("Request failed:", error.config?.url, error.message);
    return Promise.reject(error);
  },
);

export const apiFormData = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

// Add same interceptors as api for token handling and logging
apiFormData.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making request to: ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiFormData.interceptors.response.use(
  (response) => {
    console.log(`Response from: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error("Request failed:", error.config?.url, error.message);
    return Promise.reject(error);
  }
);

