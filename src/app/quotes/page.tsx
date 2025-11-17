'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Eye, Download, Search, Filter, ChevronUp, ChevronDown, ArrowUpDown, Plus, FileText } from 'lucide-react';

interface Quote {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string;
  items: {
    description: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: string;
  created_at: string;
  valid_until: string;
  description: string;
}

type SortField = 'id' | 'client_name' | 'total' | 'status' | 'created_at' | 'valid_until';
type SortDirection = 'asc' | 'desc';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await fetch('/api/quotes');
        if (!response.ok) {
          throw new Error('Failed to fetch quotes');
        }
        const data = await response.json();
        setQuotes(data.quotes || []);
      } catch (err) {
        console.error('Error fetching quotes:', err);
        setError('Failed to load quotes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes.filter(quote => {
      const matchesSearch = quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quote.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quote.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'created_at' || sortField === 'valid_until') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [quotes, searchTerm, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedQuotes.length / itemsPerPage);
  const paginatedQuotes = filteredAndSortedQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDownloadPDF = (quoteId: string) => {
    window.open(`/api/quote/${quoteId}/pdf`, '_blank');
  };

  const handleConvertToInvoice = async (quote: Quote) => {
    try {
      // Store quote data in localStorage for the invoice creation page
      const quoteData = {
        clientId: '', // Will be populated when user selects from dropdown
        clientName: quote.client_name,
        orderNumber: '', // Extract from description or leave empty
        description: quote.description,
        unitPrice: quote.items.length > 0 ? quote.items[0].price.toString() : '0',
        quantity: quote.items.length > 0 ? quote.items[0].quantity.toString() : '1',
        cost: quote.total.toString(),
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        source: 'quote',
        originalQuoteId: quote.id
      };

      localStorage.setItem('pendingInvoiceFromQuote', JSON.stringify(quoteData));
      
      // Navigate to invoice creation page
      window.location.href = '/invoice/new?from=quote';
    } catch (error) {
      console.error('Error preparing quote conversion:', error);
      alert('Failed to prepare quote for conversion. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={16} className="ml-1 opacity-50" />;
    return sortDirection === 'asc' ?
      <ChevronUp size={16} className="ml-1" /> :
      <ChevronDown size={16} className="ml-1" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse text-foreground">Loading quotes...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
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
              <h1 className="text-3xl font-bold text-black mb-2">Quotes</h1>
              <p className="text-gray-600">Manage and track all your quotes</p>
            </div>
            <Link
              href="/quote/new"
              className="bg-gradient-primary text-white px-6 py-3 rounded-lg hover:from-primary-dark hover:to-primary transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Create New Quote
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by client name, quote ID, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-600"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quotes Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      Quote #
                      <SortIcon field="id" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('client_name')}
                  >
                    <div className="flex items-center">
                      Client
                      <SortIcon field="client_name" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center">
                      Amount
                      <SortIcon field="total" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Date
                      <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('valid_until')}
                  >
                    <div className="flex items-center">
                      Valid Until
                      <SortIcon field="valid_until" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {quote.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{quote.client_name}</div>
                        <div className="text-gray-500 text-xs">{quote.client_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      R{quote.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(quote.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(quote.valid_until).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/quote/${quote.id}`}
                          className="text-primary hover:text-primary-dark p-1 rounded transition-colors"
                          title="View Quote"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDownloadPDF(quote.id)}
                          className="text-secondary hover:text-accent p-1 rounded transition-colors"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                        {(quote.status === 'accepted' || quote.status === 'sent') && (
                          <button
                            onClick={() => handleConvertToInvoice(quote)}
                            className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                            title="Convert to Invoice"
                          >
                            <FileText size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginatedQuotes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No quotes found matching your criteria.</p>
            </div>
          )}
        </div>


        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedQuotes.length)} of {filteredAndSortedQuotes.length} quotes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded text-sm ${
                    currentPage === page
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}