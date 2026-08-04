export interface User {
  id: string;
  email: string;
  name: string;
  primaryCurrency: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface FeedEvent {
  id: string;
  type: string;
  icon: string;
  title: string;
  description: string;
  createdAt: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

export interface Budget {
  id: string;
  userId: string;
  categoryId?: string;
  name: string;
  amount: number;
  currency: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  spent?: number;
  percentage?: number;
  remaining?: number;
  isOverBudget?: boolean;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  _count?: { transactions: number };
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  title?: string;
  description?: string;
  shop?: string;
  location?: string;
  photoUrl?: string;
  receiptUrl?: string;
  rating?: number;
  ratingDate?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  account?: Account;
  category?: Category;
  tags?: Array<{ tag: Tag }>;
}

export interface Transfer {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  receivedAmount: number;
  toCurrency: string;
  description?: string;
  createdAt: string;
  fromAccount?: Account;
  toAccount?: Account;
}

export interface Goal {
  id: string;
  userId: string;
  accountId?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  account?: Account;
}

export interface DashboardStats {
  totalBalance: number;
  todayIncome: number;
  todayExpense: number;
  savingsTotal: number;
}

export interface AnalyticsPeriod {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  balance: number;
  byCategory: CategoryStats[];
  topExpenses: Transaction[];
  trend: TrendData[];
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  total: number;
  count: number;
  percentage: number;
}

export interface TrendData {
  date: string;
  income: number;
  expense: number;
}
