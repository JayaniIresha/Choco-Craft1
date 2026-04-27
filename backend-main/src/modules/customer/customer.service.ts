import prisma from "../../config/prisma";
import { queryActive } from "../../utils/softDelete";

interface GetCustomersParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

interface GetCustomersResult {
  customers: any[];
  total: number;
  page: number;
  pages: number;
}

export const customerService = {
  async getCustomers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
  ): Promise<GetCustomersResult> {
    const skip = (page - 1) * limit;

    const where: any = {
      ...queryActive({}),
      ...(role && role !== "all" ? { role } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          reviews: {
            where: queryActive({}),
            select: { id: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const customersWithCounts = customers.map((customer) => ({
      ...customer,
      _count: {
        reviews: customer.reviews.length,
        orders: 0,
      },
    }));

    return {
      customers: customersWithCounts,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  },

  async getCustomerById(id: string) {
    const customer = await prisma.user.findFirst({
      where: { ...queryActive({}), id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        reviews: {
          where: queryActive({}),
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    return {
      ...customer,
      _count: {
        reviews: customer.reviews.length,
        orders: 0,
      },
    };
  },

  async updateCustomer(
    id: string,
    data: { name?: string; email?: string; role?: string },
  ) {
    const customer = await prisma.user.findFirst({
      where: { ...queryActive({}), id },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (data.email && data.email !== customer.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (existing) {
        throw new Error("Email already in use");
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.role && { role: data.role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  },

  async deleteCustomer(id: string) {
    const customer = await prisma.user.findFirst({
      where: { ...queryActive({}), id },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    await prisma.user.delete({
      where: { id },
    });

    return { message: "Customer deleted successfully" };
  },
};
