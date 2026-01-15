import request from '@/axios'

export const fetchCatalog = (locationId: number) => {
  return request.get<{ location_id: number; items: any[] }>({
    url: '/api/v1/catalog',
    params: { location: locationId }
  }) as unknown as Promise<{ location_id: number; items: any[] }>
}

export const listProducts = () => {
  return request.get({
    url: '/api/v1/products'
  }) as unknown as Promise<any[]>
}

export const adjustStock = (payload: {
  location_id: number
  product_id: number
  quantity: number
  unit: string
}) => {
  return request.post({
    url: '/api/v1/stock/adjust',
    data: payload
  }) as unknown as Promise<any>
}
