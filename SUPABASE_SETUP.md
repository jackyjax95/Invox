# Supabase Setup Guide for Smart Invoice Application

## 🚀 Migration from Firebase to Supabase Complete!

Your Smart Invoice application has been successfully migrated from Firebase to Supabase. Follow these steps to get it running with a real database.

## 📋 Prerequisites

1. A Supabase account (free tier available at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Your Smart Invoice application code

## 🛠️ Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: `smart-invoice` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
4. Click "Create new project"

### 2. Get Your Project Credentials

1. Once your project is created, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like: `https://abcdefghijklmnop.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Configure Environment Variables

1. Open the `.env.local` file in your `invox` directory
2. Replace the placeholder values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `invox/supabase/migrations/001_initial_schema.sql`
3. Click **Run** to create all tables, indexes, and Row Level Security policies

### 5. Seed Sample Data (Optional)

1. In the SQL Editor, copy and paste the contents of `invox/supabase/seed.sql`
2. Click **Run** to populate your database with sample data

### 6. Enable Row Level Security (RLS)

RLS is already configured in the schema, but you can verify it in **Authentication** → **Policies** in your Supabase dashboard.

## 🔧 Database Schema Overview

### Tables Created:

1. **`users`** - User accounts
2. **`clients`** - Client/customer information
3. **`invoices`** - Invoice records with line items
4. **`quotes`** - Quote/estimate records
5. **`expenses`** - Business expense tracking

### Key Features:

- **UUID Primary Keys** for all tables
- **Row Level Security (RLS)** enabled for data privacy
- **Foreign Key Relationships** between tables
- **JSONB Fields** for flexible item storage
- **Indexes** for optimal query performance
- **Timestamps** with UTC timezone

## 🚀 Running the Application

1. Install dependencies:
```bash
cd invox
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔍 Testing Database Connection

The application will automatically connect to Supabase when you:

1. **Create an invoice** - Data saves to `invoices` table
2. **Create a quote** - Data saves to `quotes` table
3. **Add a client** - Data saves to `clients` table
4. **Add an expense** - Data saves to `expenses` table

## 🛡️ Security Features

- **Row Level Security (RLS)** ensures users only see their own data
- **JWT Authentication** via Supabase Auth
- **Secure API Keys** with proper scoping
- **SQL Injection Protection** via Supabase client

## 📊 Available API Endpoints

- `GET/POST /api/invoices` - Invoice management
- `GET/POST /api/quotes` - Quote management
- `GET/POST /api/clients` - Client management
- `GET/POST /api/expenses` - Expense tracking

## 🔧 Troubleshooting

### Common Issues:

1. **"Failed to fetch" errors** - Check your environment variables
2. **RLS policy errors** - Ensure RLS is enabled and policies are correct
3. **Connection timeouts** - Verify your Supabase project is active

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are loaded
3. Test Supabase connection in the dashboard
4. Check API routes are returning data

## 📈 Production Deployment

When deploying to production:

1. Update environment variables in your hosting platform
2. Ensure Supabase project allows your production domain
3. Set up proper CORS policies if needed
4. Consider enabling Supabase's built-in CDN for file storage

## 🎉 You're All Set!

Your Smart Invoice application is now running on Supabase with a robust, scalable database backend. Enjoy building invoices, quotes, and managing your business finances!