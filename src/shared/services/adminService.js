import { api } from "./api";

export async function getAdminUsers() {
    const response = await api.get("/admin/users");
    return response.data;
}

export async function deactivateAdminUser(userId) {
    const response = await api.post(`/admin/users/${userId}/deactivate`);
    return response.data;
}

export async function activateAdminUser(userId) {
    const response = await api.post(`/admin/users/${userId}/activate`);
    return response.data;
}

export async function addUserToOrganization(userId, organizationId) {
    const response = await api.post(`/admin/users/${userId}/organizations/${organizationId}`);
    return response.data;
}

export async function removeUserFromOrganization(userId, organizationId) {
    const response = await api.delete(`/admin/users/${userId}/organizations/${organizationId}`);
    return response.data;
}

export async function makeUserAdmin(userId) {
    const response = await api.post(`/admin/users/${userId}/make-admin`);
    return response.data;
}
