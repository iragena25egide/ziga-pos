import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const companyId = localStorage.getItem("company_id");
      if (companyId) {
        config.headers["X-Company-ID"] = companyId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      response.data.status &&
      response.data.data !== undefined
    ) {
      response.data = response.data.data;
    }

    if (response.data && response.data.results !== undefined) {
      response.data = response.data.results;
    }
    return response;
  },
  (error) => {
    if (error.response?.data?.message) {
      console.warn("[API Error Response]:", error.response.data.message);
    }

    if (error.response?.status === 401) {
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.dispatchEvent(new Event("unauthorized_access"));
      }
    }
    return Promise.reject(error);
  },
);

export default api;
