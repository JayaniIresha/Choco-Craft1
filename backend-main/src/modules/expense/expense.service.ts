import prisma from "../../config/prisma";
import { queryActive } from "../../utils/softDelete";

export const expenseService = {
  async createExpense(data: { title: string; category: string; amount: number; description?: string }) {
    return prisma.expense.create({ data });
  },

  async getExpenses(
    page = 1,
    limit = 10,
    search?: string,
    category?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      ...queryActive(),
      ...(category && category !== "all" ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total, page, pages: Math.ceil(total / limit) };
  },

  async getExpenseById(id: string) {
    return prisma.expense.findFirst({
      where: { ...queryActive(), id },
    });
  },

  async updateExpense(id: string, data: { title?: string; category?: string; amount?: number; description?: string }) {
    const expense = await prisma.expense.findFirst({
      where: { ...queryActive(), id },
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    return prisma.expense.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.category && { category: data.category }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  },

  async deleteExpense(id: string) {
    const expense = await prisma.expense.findFirst({
      where: { ...queryActive(), id },
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    return prisma.expense.update({
      where: { id },
      data: { isDeleted: true },
    });
  },

  async getExpenseStats() {
    const expenses = await prisma.expense.findMany({
      where: queryActive(),
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    return {
      total,
      byCategory,
      count: expenses.length,
    };
  },

  async getFinanceStats() {
    const expenses = await prisma.expense.findMany({
      where: queryActive(),
    });

    const payments = await prisma.payment.findMany({
      where: { 
        ...queryActive(), 
        status: "completed",
        order: { isDeleted: false }
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const profit = totalRevenue - totalExpenses;

    const expenseByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    return {
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : "0",
      expenseByCategory,
      revenueCount: payments.length,
      expenseCount: expenses.length,
    };
  },
};
