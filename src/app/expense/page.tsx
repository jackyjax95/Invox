'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Search, Filter, Users } from 'lucide-react';

interface Expense {
  id: string;
  vendor: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  vatIncluded?: boolean;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch('/api/expenses');
        if (!response.ok) {
          throw new Error('Failed to fetch expenses');
        }
        const data = await response.json();
        setExpenses(data.expenses || []);
      } catch (err) {
        console.error('Error fetching expenses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categories = ['all', ...Array.from(new Set(expenses.map(e => e.category)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse text-foreground">Loading expenses...</div>
          </div>
  
  
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#f0f1f5] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Expenses</h1>
              <p className="text-gray-600">Track and manage your business expenses</p>
            </div>
            <Link
              href="/expense/new"
              className="bg-gradient-accent text-white px-6 py-3 rounded-lg hover:from-accent hover:to-secondary transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Add Expense
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Expenses</h3>
            <p className="text-3xl font-bold text-red-600">R{totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">This Month</h3>
            <p className="text-3xl font-bold text-red-600">
              R{expenses.filter(e => {
                const expenseDate = new Date(e.date);
                const now = new Date();
                return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
              }).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Categories</h3>
            <p className="text-3xl font-bold text-blue-600">{categories.length - 1}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by vendor or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-600"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
              >
                {categories.map((category) => (
                  <option key={category} value={category} className="text-gray-900">
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/expense/vendors"
              className="bg-gradient-secondary text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Users size={20} />
              Manage Vendors
            </Link>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {expenses.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{expense.vendor}</h3>
                          <p className="text-gray-600">{expense.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {expense.category}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(expense.date).toLocaleDateString('en-GB')}
                            </span>
                            {expense.vatIncluded && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                VAT Included
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${expense.amount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        R{Math.abs(expense.amount).toFixed(2)}
                        {expense.amount < 0 && ' (Credit)'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start tracking your business expenses to see them here!'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/expense/new"
                  className="bg-gradient-accent text-white px-8 py-3 rounded-lg hover:from-accent hover:to-secondary transition-all inline-flex items-center gap-2 shadow-lg"
                >
                  <Plus size={20} />
                  Add Your First Expense
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}