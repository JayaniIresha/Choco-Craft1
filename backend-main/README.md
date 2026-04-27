# Chocolate ERP Backend

Node.js + Express + TypeScript + Prisma + MongoDB backend for the Integrated ERP & Customized Chocolate Manufacturing System.

## Tech Stack

- **Runtime**: Node.js 24
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: MongoDB
- **Authentication**: JWT + RBAC
- **Email**: Nodemailer (SMTP)

## Project Structure

```
src/
├── config/
│   └── prisma.ts          # Prisma client configuration
├── modules/
│   ├── auth/              # Authentication module
│   ├── users/             # User management
│   ├── orders/            # Order management
│   ├── finance/           # Finance & Payments
│   ├── inventory/         # Inventory management
│   ├── delivery/          # Delivery tracking
│   ├── production/        # Production management
│   └── supplier/          # Supplier management
├── middleware/
│   ├── auth.middleware.ts  # JWT authentication
│   └── role.middleware.ts  # Role-based access control
├── utils/
│   ├── softDelete.ts      # Soft delete utilities
│   └── email.ts           # Email service
├── routes/
│   └── index.ts           # Main route configuration
└── server.ts              # Express server setup

prisma/
└── schema.prisma          # Database schema definition
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env` file with the following variables:

```env
PORT=5001
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/chocolateERP"
JWT_SECRET=supersecretkey
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=test@gmail.com
EMAIL_PASS=password
```

### 3. Prisma Setup

Generate Prisma client:

```bash
npm run prisma:generate
```

Push schema to MongoDB:

```bash
npm run prisma:push
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:5001`

API endpoints at `http://localhost:5001/api`

## Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema changes to database
- `npm run prisma:studio` - Open Prisma Studio UI

## Database Models

### Core Models
- **User** - User accounts with roles
- **Order** - Customer orders
- **Feedback** - Order feedback and ratings

### Finance Module
- **Payment** - Order payments
- **Expense** - Expense tracking

### Inventory Module
- **Material** - Raw materials
- **StockUsage** - Material consumption tracking

### Delivery Module
- **Delivery** - Delivery tracking
- **DeliveryStaff** - Staff assignments

### Production Module
- **Production** - Production orders
- **Recipe** - Chocolate recipes with ingredients

### Supplier Module
- **Supplier** - Supplier information
- **PurchaseOrder** - Purchase orders

## Soft Delete Strategy

All models include `isDeleted` field. Instead of permanent deletion:

```typescript
// Soft delete
await prisma.user.update({
  where: { id },
  data: { isDeleted: true },
});

// Query active records
await prisma.user.findMany({
  where: { isDeleted: false },
});
```

## API Base URL

```
http://localhost:5001/api
```

## Branch Strategy (Git Workflow)

```
main (shared infrastructure)
├── feature/orders       (Orders & Feedback)
├── feature/finance      (Payments & Expenses)
├── feature/inventory    (Materials & Stock)
├── feature/delivery     (Delivery & Staff)
├── feature/production   (Production & Recipes)
└── feature/supplier     (Suppliers & POs)
```

Each developer works independently in their feature branch.

## Development Guidelines

1. Only modify files in your assigned module
2. Do not modify `prisma/schema.prisma` without team approval
3. Use conventional commit messages (feat:, fix:, refactor:, etc.)
4. Test endpoints before creating Pull Requests
5. Sync with main branch regularly

## Contributing

- Create feature branches from main
- Make commits with clear messages
- Push to feature branch
- Open Pull Request for code review
- Merge after approval

## Future Enhancements

- Dashboard analytics
- WebSocket delivery tracking
- Automated reports
- Scheduled jobs
- Audit logs
- Role-based permissions
