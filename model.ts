export interface Coupon {
  id: string;
  userId: string;
  adminId: string;
  title: string;
  content: string;
  isActive: boolean;
  scheduledDate?: Date | null;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

export interface Suggestion {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}
