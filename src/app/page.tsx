'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, TrendingUp, DollarSign, CreditCard, Target, Rocket, Star } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Invoice {
  id: string;
  client_name: string;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  created_at: string;
}

interface Expense {
  id: string;
  vendor: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

const COLORS = ['#71C8C9', '#669EC9', '#5778AC', '#5E558D', '#544268'];

const motivationalMessages = [
  "🚀 You're crushing it! Keep that momentum going!",
  "💰 Money flows to those who hustle! You're doing great!",
  "⭐ Your business is shining bright! Keep up the excellent work!",
  "🎯 On target for success! You're hitting your goals!",
  "⚡ Lightning fast progress! You're unstoppable!",
  "🌟 You're a business superstar! Keep shining!",
];

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [motivationalMessage] = useState(() =>
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesRes, expensesRes] = await Promise.all([
          fetch('/api/invoices'),
          fetch('/api/expenses')
        ]);

        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json();
          setInvoices(invoicesData.invoices || []);
        }

        if (expensesRes.ok) {
          const expensesData = await expensesRes.json();
          setExpenses(expensesData.expenses || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate analytics with proper timezone handling
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthInvoices = invoices.filter(invoice => {
    // Convert UTC time to local time for comparison
    const invoiceDate = new Date(invoice.created_at);
    const localDate = new Date(invoiceDate.getTime() - invoiceDate.getTimezoneOffset() * 60000);
    return localDate.getMonth() === currentMonth && localDate.getFullYear() === currentYear;
  });

  const thisMonthExpenses = expenses.filter(expense => {
    // Convert UTC time to local time for comparison
    const expenseDate = new Date(expense.date);
    const localDate = new Date(expenseDate.getTime() - expenseDate.getTimezoneOffset() * 60000);
    return localDate.getMonth() === currentMonth && localDate.getFullYear() === currentYear;
  });

  const totalSalesThisMonth = thisMonthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalExpensesThisMonth = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const profitLoss = totalSalesThisMonth - totalExpensesThisMonth;

  // Debug logging
  console.log('Dashboard Analytics Debug:', {
    currentDate: now.toISOString(),
    currentMonth,
    currentYear,
    totalInvoices: invoices.length,
    thisMonthInvoices: thisMonthInvoices.length,
    thisMonthInvoicesDetails: thisMonthInvoices.map(inv => ({
      id: inv.id,
      client: inv.client_name,
      total: inv.total,
      created_at: inv.created_at,
      localMonth: new Date(new Date(inv.created_at).getTime() - new Date(inv.created_at).getTimezoneOffset() * 60000).getMonth(),
      localYear: new Date(new Date(inv.created_at).getTime() - new Date(inv.created_at).getTimezoneOffset() * 60000).getFullYear()
    })),
    totalSalesThisMonth
  });

  const pendingPayments = invoices
    .filter(invoice => invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + invoice.total, 0);

  // Prepare chart data with proper timezone handling
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      sales: 0,
      expenses: 0,
      year: date.getFullYear()
    };
  }).reverse();

  invoices.forEach(invoice => {
    const invoiceDate = new Date(invoice.created_at);
    // Convert UTC to local for accurate month calculation
    const localDate = new Date(invoiceDate.getTime() - invoiceDate.getTimezoneOffset() * 60000);
    const monthStr = localDate.toLocaleDateString('en-US', { month: 'short' });
    const year = localDate.getFullYear();
    
    const monthIndex = last6Months.findIndex(m => m.month === monthStr && m.year === year);
    if (monthIndex !== -1) {
      last6Months[monthIndex].sales += invoice.total;
    }
  });

  expenses.forEach(expense => {
    const expenseDate = new Date(expense.date);
    // Convert UTC to local for accurate month calculation
    const localDate = new Date(expenseDate.getTime() - expenseDate.getTimezoneOffset() * 60000);
    const monthStr = localDate.toLocaleDateString('en-US', { month: 'short' });
    const year = localDate.getFullYear();
    
    const monthIndex = last6Months.findIndex(m => m.month === monthStr && m.year === year);
    if (monthIndex !== -1) {
      last6Months[monthIndex].expenses += expense.amount;
    }
  });

  // Expense categories for pie chart
  const expenseCategories = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expenseCategories).map(([name, value]) => ({
    name,
    value
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Rocket className="text-primary" size={40} />
            Invox Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Your business is thriving! Here&apos;s what&apos;s happening:</p>
        </header>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-xl mb-8 shadow-lg">
          <div className="flex items-center gap-3">
            <Star className="text-yellow-200" size={24} />
            <p className="text-lg font-semibold">{motivationalMessage}</p>
          </div>
        </div>

        {/* Social Media Post Notification */}
        {(() => {
          const pendingPost = typeof window !== 'undefined' ? localStorage.getItem('pendingSocialPost') : null;
          if (pendingPost) {
            return (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl mb-8 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <p className="text-lg font-semibold">Milestone Achieved!</p>
                      <p className="text-sm opacity-90">You&apos;ve reached a new invoice milestone. Share your success on social media!</p>
                    </div>
                  </div>
                  <Link
                    href="/social-share"
                    className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Share Now →
                  </Link>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Sales This Month</h3>
                <p className="text-3xl font-bold text-primary">R{totalSalesThisMonth.toFixed(2)}</p>
              </div>
              <DollarSign className="text-primary" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-accent">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Expenses This Month</h3>
                <p className="text-3xl font-bold text-accent">R{totalExpensesThisMonth.toFixed(2)}</p>
              </div>
              <CreditCard className="text-accent" size={32} />
            </div>
          </div>

          <div className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${profitLoss >= 0 ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Profit/Loss This Month</h3>
                <p className={`text-3xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R{profitLoss.toFixed(2)}
                </p>
              </div>
              <TrendingUp className={profitLoss >= 0 ? 'text-green-500' : 'text-red-500'} size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-accent-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Payments</h3>
                <p className="text-3xl font-bold text-accent-dark">R{pendingPayments.toFixed(2)}</p>
              </div>
              <Target className="text-accent-dark" size={32} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales vs Expenses Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sales vs Expenses (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last6Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R${value}`, '']} />
                <Line type="monotone" dataKey="sales" stroke="#71C8C9" strokeWidth={3} name="Sales" />
                <Line type="monotone" dataKey="expenses" stroke="#5E558D" strokeWidth={3} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Categories Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Expense Categories</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`R${value}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No expense data available
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create Invoice</h3>
            <p className="text-gray-600 mb-4">Generate professional invoices for your clients</p>
            <Link
              href="/invoice/new"
              className="bg-gradient-primary text-white px-6 py-3 rounded-lg hover:bg-gradient-cyan-blue transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Create New Invoice
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Expense</h3>
            <p className="text-gray-600 mb-4">Track your business expenses easily</p>
            <Link
              href="/expense/new"
              className="bg-gradient-accent text-white px-6 py-3 rounded-lg hover:from-accent hover:to-secondary transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Add New Expense
            </Link>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Recent Invoices</h2>
            <div className="flex gap-4">
              <Link
                href="/invoices"
                className="text-primary hover:text-primary-dark font-medium"
              >
                View All Invoices →
              </Link>
              <Link
                href="/invoice/new"
                className="bg-gradient-primary text-white px-6 py-3 rounded-lg hover:from-primary-dark hover:to-primary transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Create New Invoice
              </Link>
            </div>
          </div>

          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-gray-900">{invoice.client_name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(invoice.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">R{invoice.total.toFixed(2)}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <Link
                    href={`/invoice/${invoice.id}`}
                    className="text-primary hover:text-primary-dark font-medium"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-gray-500 mb-6">Create your first invoice to get started on your journey to success!</p>
              <Link
                href="/invoice/new"
                className="bg-gradient-primary text-white px-8 py-3 rounded-lg hover:from-primary-dark hover:to-primary transition-all inline-flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Create Your First Invoice
              </Link>
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Recent Expenses</h2>
            <Link
              href="/expenses"
              className="text-primary hover:text-primary-dark font-medium"
            >
              View All Expenses →
            </Link>
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-gray-900">{expense.vendor}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString('en-GB')} • {expense.category}
                    </p>
                    {expense.description && (
                      <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-red-600">R{expense.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses yet</h3>
              <p className="text-gray-500 mb-6">Start tracking your business expenses to see them here!</p>
              <Link
                href="/expense/new"
                className="bg-gradient-accent text-white px-8 py-3 rounded-lg hover:from-accent hover:to-secondary transition-all inline-flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Add Your First Expense
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
