import { api } from "./api";

export async function getTemplates() {
    const response = await api.get("/templates/");
    return response.data;
}

export async function getTemplateById(templateId) {
    const response = await api.get(`/templates/${templateId}`);
    return response.data;
}

export async function deleteTemplate(templateId) {
    const response = await api.delete(`/templates/${templateId}`);
    return response.data;
}

export async function createTemplate(payload) {
    const response = await api.post("/templates/", payload);
    return response.data;
}

export async function updateTemplate(templateId, payload) {
    const response = await api.put(`/templates/${templateId}`, payload);
    return response.data;
}
