export interface Employee {
  id: string;
  full_name: string;
  initials: string;
  created_at: string;
  is_active: boolean;
}

export interface CreateEmployeeData {
  full_name: string;
  initials: string;
}

export interface UpdateEmployeeData {
  full_name?: string;
  initials?: string;
  is_active?: boolean;
} 