import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
})

export interface Item {
    id: string
    category: 'auto' | 'real_estate' | 'electronics'
    title: string
    price: number
    needsRevision: boolean
}

export interface ItemDetail extends Item {
    description?: string
    createdAt: string
    params: Record<string, string | number | undefined>
}

export interface ItemsResponse {
    items: Item[]
    total: number
}

export const getItems = async (params?: {
    q?: string
    limit?: number
    skip?: number
    categories?: string
    needsRevision?: boolean
    sortColumn?: string
    sortDirection?: string
}): Promise<ItemsResponse> => {
    const { data } = await api.get('/items', { params })
    return data
}

export const getItem = async (id: string): Promise<ItemDetail> => {
    const { data } = await api.get(`/items/${id}`)
    return data
}

export const updateItem = async (id: string, body: unknown) => {
    const { data } = await api.put(`/items/${id}`, body)
    return data
}