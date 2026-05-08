import axios from 'axios'

const API = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000' })

API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default API

// ── Auth ──────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  API.post('/auth/login', { username, password })

// ── Customers ─────────────────────────────────────────────
export const getCustomers = () => API.get('/customers/')
export const getCustomer  = (id: number) => API.get(`/customers/${id}`)
export const createCustomer = (data: any) => API.post('/customers/', data)
export const deleteCustomer = (id: number) => API.delete(`/customers/${id}`)

// ── Policies ──────────────────────────────────────────────
export const getPolicies        = () => API.get('/policies/')
export const getPolicyTypes     = () => API.get('/policies/types')
export const getCustomerPolicies = (id: number) => API.get(`/policies/customer/${id}`)
export const createPolicy       = (data: any) => API.post('/policies/', data)
export const deletePolicy       = (id: number) => API.delete(`/policies/${id}`)

// ── Premiums ──────────────────────────────────────────────
export const getAllPremiums       = () => API.get('/premiums/')
export const getCustomerPremiums = (id: number) => API.get(`/premiums/customer/${id}`)
export const payPremium          = (id: number) => API.post(`/premiums/${id}/pay`)

// ── Claims ────────────────────────────────────────────────
export const getAllClaims     = () => API.get('/claims/')
export const getCustomerClaims = (id: number) => API.get(`/claims/customer/${id}`)
export const fileClaim        = (data: any) => API.post('/claims/', data)
export const updateClaim      = (id: number, status: string) => API.patch(`/claims/${id}`, { status })
export const deleteClaim      = (id: number) => API.delete(`/claims/${id}`)

// ── Transactions ──────────────────────────────────────────
export const getAllTransactions      = () => API.get('/transactions/')
export const getCustomerTransactions = (id: number) => API.get(`/transactions/customer/${id}`)

// ── Admin ─────────────────────────────────────────────────
export const runQuery       = (sql: string) => API.post('/admin/query', { sql })
export const getSummary     = () => API.get('/admin/reports/summary')


// ── Add these two functions to your existing lib/api.ts ──────────────────────

export const buyPolicy = (policy_type_id: number) =>
  API.post('/policies/buy', { policy_type_id })   // POST /policies/buy