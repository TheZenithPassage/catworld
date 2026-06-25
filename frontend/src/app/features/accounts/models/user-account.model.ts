import { UserRole } from '../../../core/auth/auth.model';

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  enabled: boolean;
}

export interface CreateUserAccountRequest {
  username: string;
  password: string;
  role: UserRole;
}
