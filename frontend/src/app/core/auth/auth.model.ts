export type UserRole = 'ADMIN' | 'STAFF';

export interface AuthUser {
  username: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}
