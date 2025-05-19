// For Admin User Management
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  isActive: boolean;
  accesses: string[] | null;
  createdAt: string;
}
