# ALK Trucking Management System

A comprehensive, full-stack web application designed to streamline logistics and trucking operations. Built for ALK Trucking, this platform centralizes fleet tracking, trip management, automated payroll, and operational costing into a single, intuitive interface.

## 🚀 Features

- **Fleet Management**: Track truck units, active status, capacity, and maintenance schedules.
- **Trip & Route Monitoring**: Manage trips from origin to destination, track expenses, and calculate net profits per trip.
- **Driver & Helper Payroll**: Automate trip-based earnings, allowances, and deductions to generate payroll.
- **Cost Analysis**: Granular breakdown of trip expenses (fuel, tolls, allowances) for accurate profit margins.
- **Real-time Dashboard**: Live overview of fleet status, top-performing drivers, and monthly revenue vs. cost trends.

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/) (Google OAuth)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

First, install the dependencies:

```bash
pnpm install
```

Set up your local environment variables by copying the example file:

```bash
cp .env.local.example .env.local
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗂️ Project Structure

- `/src/app/admin/*` - All dashboard and management modules.
- `/src/components/layout` - Shared UI layout wrappers (Sidebar, Header, AdminShell).
- `/src/components/ui` - Reusable interface components.
- `/public` - Static assets and branding images.

## 📝 License

This project is proprietary and restricted to authorized ALK Trucking personnel and administrators only.
