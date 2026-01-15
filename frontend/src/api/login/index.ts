import request from '@/axios'
import type { LoginToken, UserLoginType } from './types'

export const loginApi = (data: UserLoginType): Promise<LoginToken> => {
  return request.post({
    url: '/api/v1/auth/token',
    data: {
      username: data.username,
      password: data.password
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }) as unknown as Promise<LoginToken>
}

export const loginOutApi = (): Promise<IResponse> => {
  return Promise.resolve({}) as Promise<IResponse>
}
