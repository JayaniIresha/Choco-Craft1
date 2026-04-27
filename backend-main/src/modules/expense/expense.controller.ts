import { Request, Response } from "express";
import { expenseService } from "./expense.service";

export const createExpense = async (req: Request, res: Response) => {
  try {
    const expense = await expenseService.createExpense(req.body);
    res.status(201).json(expense);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;

    const result = await expenseService.getExpenses(page, limit, search, category);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id as string);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    res.json(expense);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id as string, req.body);
    res.json(expense);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};


export const deleteExpense = async (req: Request, res: Response) => {
  try {
    await expenseService.deleteExpense(req.params.id as string);
    res.json({ message: "Expense deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getExpenseStats = async (req: Request, res: Response) => {
  try {
    const stats = await expenseService.getExpenseStats();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getFinanceStats = async (req: Request, res: Response) => {
  try {
    const stats = await expenseService.getFinanceStats();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
