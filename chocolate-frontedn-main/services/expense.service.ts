import api from "@/lib/api";

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetExpensesResult {
  expenses: Expense[];
  total: number;
  page: number;
  pages: number;
}

export interface ExpenseStats {
  total: number;
  byCategory: Record<string, number>;
  count: number;
}

export interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: string;
  expenseByCategory: Record<string, number>;
  revenueCount: number;
  expenseCount: number;
}

interface GetExpensesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export const expenseService = {
  async getExpenses(params: GetExpensesParams = {}): Promise<GetExpensesResult> {
    const { page = 1, limit = 10, search, category } = params;
    const response = await api.get("/expenses", {
      params: { page, limit, search, category },
    });
    return response.data;
  },

  async getExpenseById(id: string): Promise<Expense> {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  async createExpense(data: { title: string; category: string; amount: number; description?: string }): Promise<Expense> {
    const response = await api.post("/expenses", data);
    return response.data;
  },

  async updateExpense(id: string, data: { title?: string; category?: string; amount?: number; description?: string }): Promise<Expense> {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  async getStats(): Promise<ExpenseStats> {
    const response = await api.get("/expenses/stats");
    return response.data;
  },

  async getFinanceStats(): Promise<FinanceStats> {
    const response = await api.get("/expenses/finance-stats");
    return response.data;
  },
};
