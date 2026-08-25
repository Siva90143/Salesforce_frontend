import axios from 'axios'

const BASE_URL = 'https://salesforcebackend-production-b61d.up.railway.app'

export const api = axios.create({ baseURL: BASE_URL })

export function loginUrl() {
  return `${BASE_URL}/auth/salesforce/login`
}

export async function getAuthStatus() {
  const { data } = await api.get('/auth/salesforce/status')
  return data
}

export async function logout() {
  await api.post('/auth/salesforce/logout')
}

export async function listRecords(objectName, page) {
  const { data } = await api.get(`/api/salesforce/${objectName}`, { params: { page } })
  return data
}

export async function getRecord(objectName, id) {
  const { data } = await api.get(`/api/salesforce/${objectName}/${id}`)
  return data
}

export async function updateRecord(objectName, id, fields) {
  await api.patch(`/api/salesforce/${objectName}/${id}`, fields)
}

export async function deleteRecord(objectName, id) {
  await api.delete(`/api/salesforce/${objectName}/${id}`)
}
