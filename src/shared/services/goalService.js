import { api } from './api'

export const getGoals = async (params = {}) => {
  const response = await api.get('/goals/', { params })
  return response.data
}

export const getGoalById = async (goalId) => {
  const response = await api.get(`/goals/${goalId}`)
  return response.data
}

export const createGoal = async (payload) => {
  const response = await api.post('/goals/', payload)
  return response.data
}

export const updateGoal = async (goalId, payload) => {
  const response = await api.put(`/goals/${goalId}`, payload)
  return response.data
}

export const deleteGoal = async (goalId) => {
  const response = await api.delete(`/goals/${goalId}`)
  return response.data
}

export const getGoalInitiatives = async (goalId) => {
  const response = await api.get(`/goals/${goalId}/initiatives`)
  return response.data
}

