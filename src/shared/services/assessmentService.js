import { api } from "./api";

const toNumberOrValue = (value) => {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
};

export async function createAssessment({ organizationId, templateId, title }) {
    const response = await api.post("/assessments/", {
        organization_id: toNumberOrValue(organizationId),
        template_id: toNumberOrValue(templateId),
        title,
    });
    return response.data;
}

export async function getAssessmentById(assessmentId) {
    const response = await api.get(`/assessments/${assessmentId}`);
    return response.data;
}

export async function updateSubcategoryResponse({
    assessmentId,
    subcategoryId,
    selectedResponseId,
}) {
    const response = await api.put(
        `/assessments/${assessmentId}/subcategories/${subcategoryId}/response`,
        {
            selected_response_id: selectedResponseId,
        }
    );
    return response.data;
}

export async function updateSubcategoryComments({
    assessmentId,
    subcategoryId,
    internalComment,
    publicComment,
}) {
    const payload = {};
    if (internalComment !== undefined) {
        payload.internal_comment = internalComment;
    }
    if (publicComment !== undefined) {
        payload.public_comment = publicComment;
    }
    const response = await api.put(
        `/assessments/${assessmentId}/subcategories/${subcategoryId}/comments`,
        payload
    );
    return response.data;
}

export async function completeAssessment(assessmentId) {
    const response = await api.post(`/assessments/${assessmentId}/complete`);
    return response.data;
}
