export interface Company {
  id?: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  ownerId?: number | null;
}

