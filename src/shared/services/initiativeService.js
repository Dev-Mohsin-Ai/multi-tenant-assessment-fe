import { api } from './api'

export const getInitiatives = async (params = {}) => {
  const response = await api.get('/initiatives/', { params })
  return response.data
}

export const getInitiativeById = async (initiativeId) => {
  const response = await api.get(`/initiatives/${initiativeId}`)
  return response.data
}

export const createInitiative = async (payload) => {
  const response = await api.post('/initiatives/', payload)
  return response.data
}

export const updateInitiative = async (initiativeId, payload) => {
  const response = await api.put(`/initiatives/${initiativeId}`, payload)
  return response.data
}

export const deleteInitiative = async (initiativeId) => {
  const response = await api.delete(`/initiatives/${initiativeId}`)
  return response.data
}

export const unlinkInitiativeFromGoal = async (initiativeId) => {
  const response = await api.delete(`/initiatives/${initiativeId}/goal`)
  return response.data
}

export const getLinkedSubcategories = async (initiativeId) => {
  const response = await api.get(`/initiatives/${initiativeId}/linked-subcategories`)
  return response.data
}

export const linkSubcategories = async (initiativeId, subcategoryIds = []) => {
  const response = await api.post(
    `/initiatives/${initiativeId}/link-subcategories`,
    subcategoryIds
  )
  return response.data
}

export const unlinkSubcategory = async (initiativeId, subcategoryId) => {
  const response = await api.delete(
    `/initiatives/${initiativeId}/unlink-subcategories/${subcategoryId}`
  )
  return response.data
}

export const saveInitiativeAsTemplate = async (initiativeId) => {
  const response = await api.post(`/initiatives/${initiativeId}/save-template`)
  return response.data
}

export const getInitiativeTemplates = async () => {
  const response = await api.get('/initiatives/templates/')
  return response.data
}

export const getInitiativeTemplateById = async (templateId) => {
  const response = await api.get(`/initiatives/templates/${templateId}`)
  return response.data
}

export const updateInitiativeTemplate = async (templateId, payload) => {
  const response = await api.put(`/initiatives/templates/${templateId}`, payload)
  return response.data
}

export const deleteInitiativeTemplate = async (templateId) => {
  const response = await api.delete(`/initiatives/templates/${templateId}`)
  return response.data
}

export const applyInitiativeTemplate = async (initiativeId, templateId) => {
  const response = await api.post(`/initiatives/${initiativeId}/apply-template/${templateId}`)
  return response.data
}
