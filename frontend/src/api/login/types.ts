export interface UserLoginType {
  username: string
  password: string
}

export interface LoginToken {
  access_token: string
  token_type: string
}

export interface UserType {
  username: string
  role: string
  roleId: string
}
