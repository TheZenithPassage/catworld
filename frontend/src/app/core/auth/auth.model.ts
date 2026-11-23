export type UserRole = 'ADMIN' | 'STAFF';

export const DEMO_AUTHORIZATION = 'Demo';
export const DEMO_GENERATION_HEADER = 'X-CatWorld-Demo-Generation';

export interface AuthUser {
  username: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}
