import { api } from "./api";

export async function getOrganizations() {
    const response = await api.get("/organizations/");
    return response.data;
}

export async function createOrganization(payload) {
    const response = await api.post("/organizations/", payload);
    return response.data;
}

export async function getOrganizationById(organizationId) {
    const response = await api.get(`/organizations/${organizationId}`);
    return response.data;
}

export async function getOrganizationAssessments(organizationId, statusFilter) {
    const response = await api.get(`/organizations/${organizationId}/assessments`, {
        params: statusFilter ? { status_filter: statusFilter } : {},
    });
    return response.data;
}
