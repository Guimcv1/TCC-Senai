const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
const HEALTH_URL = API_URL.replace(/\/api\/?$/, '') + '/health'

export type Category = { id: number; name: string }
export type ProductIngredient = { ingredient_id: number; quantity: string }
export type Product = { id: number; name: string; base_price: string; category_id: number; active: boolean; ingredients: ProductIngredient[] }
export type Customer = { id: number; name: string; contact: string; address: string | null }
export type Employee = { id: number; name: string; role: string; active: boolean }
export type Supplier = { id: number; name: string; contact: string | null }
export type Ingredient = { id: number; name: string; stock_quantity: string; unit: string; supplier_id: number }
export type Addon = { id: number; name: string; price: string }
export type Order = {
  id: number
  channel: string
  delivery_type: string
  total: string
  customer_id: number | null
  employee_id: number | null
  table_id: number | null
  status_id: number
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Erro ${response.status} ao acessar a API`)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export const api = {
  categories: () => request<Category[]>('/categories'),
  createCategory: (data: { name: string }) => request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  products: () => request<Product[]>('/products'),
  createProduct: (data: Omit<Product, 'id'>) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Omit<Product, 'id'>) => request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  customers: () => request<Customer[]>('/customers'),
  createCustomer: (data: Omit<Customer, 'id'>) => request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: number, data: Omit<Customer, 'id'>) => request<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: number) => request<void>(`/customers/${id}`, { method: 'DELETE' }),
  employees: () => request<Employee[]>('/employees'),
  suppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (data: Omit<Supplier, 'id'>) => request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: number, data: Omit<Supplier, 'id'>) => request<Supplier>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: number) => request<void>(`/suppliers/${id}`, { method: 'DELETE' }),
  ingredients: () => request<Ingredient[]>('/ingredients'),
  createIngredient: (data: Omit<Ingredient, 'id'>) => request<Ingredient>('/ingredients', { method: 'POST', body: JSON.stringify(data) }),
  updateIngredient: (id: number, data: Omit<Ingredient, 'id'>) => request<Ingredient>(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIngredient: (id: number) => request<void>(`/ingredients/${id}`, { method: 'DELETE' }),
  addons: () => request<Addon[]>('/addons'),
  orders: () => request<Order[]>('/orders'),
  createOrder: (data: unknown) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  deleteOrder: (id: number) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
  updateOrderStatus: (id: number, status_id: number) => request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status_id }) }),
  health: () => fetch(HEALTH_URL).then((response) => response.json() as Promise<{ status: string }>),
}
