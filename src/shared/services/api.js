import axios from "axios";

const DEFAULT_BASE_URL = "https://multi-assessment-pro-be-production.up.railway.app";
const rawBaseUrl = import.meta.env.VITE_API_URL || DEFAULT_BASE_URL;
const isLocalBackendUrl =
    /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/)?$/i.test(rawBaseUrl);

export const BASE_URL = import.meta.env.DEV && isLocalBackendUrl ? "/api" : rawBaseUrl;

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || "";
        const isAuthRequest = ["/auth/login", "/auth/register", "/auth/google-login"].some(
            (path) => url.includes(path)
        );

        if (status === 401 && !isAuthRequest) {
            localStorage.removeItem("token");
            if (window.location.pathname !== "/login") {
                window.location.assign("/login");
            }
        }

        return Promise.reject(error);
    }
);
