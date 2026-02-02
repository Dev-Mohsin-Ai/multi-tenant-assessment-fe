import { api } from "./api";

// Signup
export async function signup(data) {
    const response = await api.post("/auth/register", data);
    return response.data;
}

// Login
export async function login(data) {
    const response = await api.post("/auth/login", data);
    return response.data;
}

// Google Login
export async function googleLogin(credential) {
    try {
        const response = await api.post("/auth/google-login", { credential });
        return response.data;
    } catch (err) {
        if (err.response?.status === 400 || err.response?.status === 422) {
            const response = await api.post("/auth/google-login", {
                token: credential,
                id_token: credential,
            });
            return response.data;
        }
        throw err;
    }
}
