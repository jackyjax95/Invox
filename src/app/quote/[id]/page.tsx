'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Mail, FileText, CheckCircle } from 'lucide-react';

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

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const quoteId = params.id as string;

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch('/api/quotes');
        if (!response.ok) {
          throw new Error('Failed to fetch quotes');
        }
        const data = await response.json();
        const foundQuote = data.quotes.find((q: Quote) => q.id === quoteId);
        
        if (foundQuote) {
          setQuote(foundQuote);
        } else {
          setError('Quote not found');
        }
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError('Failed to load quote details');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [quoteId]);

  const handleConvertToInvoice = async () => {
    if (!quote) return;
    
    setConverting(true);
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
      router.push('/invoice/new?from=quote');
    } catch (error) {
      console.error('Error preparing quote conversion:', error);
      alert('Failed to prepare quote for conversion. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!quote) return;
    window.open(`/api/quote/${quote.id}/pdf`, '_blank');
  };

  const handleSendEmail = () => {
    if (!quote) return;
    
    const subject = `Quote ${quote.id} - ${quote.client_name}`;
    const body = `Dear ${quote.client_name},\n\nPlease find attached quote ${quote.id} for R${quote.total.toFixed(2)}.\n\nThis quote is valid until ${new Date(quote.valid_until).toLocaleDateString('en-GB')}.\n\nPlease let us know if you have any questions.\n\nBest regards,\nYour Company Name`;

    const mailtoUrl = `mailto:${quote.client_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse text-foreground">Loading quote details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Quote not found'}</p>
            <Link href="/quotes" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
              ← Back to Quotes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/quotes"
            className="inline-flex items-center text-primary hover:text-primary-dark mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Quotes
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quote {quote.id}</h1>
              <p className="text-gray-600 mt-2">{quote.description || 'Quote details'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Client Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Client Information</h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Client Name</label>
                <p className="text-gray-900">{quote.client_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{quote.client_email}</p>
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Quote Details</h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-gray-900">{new Date(quote.created_at).toLocaleDateString('en-GB')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Valid Until</label>
                <p className="text-gray-900">{new Date(quote.valid_until).toLocaleDateString('en-GB')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Amount</label>
                <p className="text-2xl font-bold text-primary">R{quote.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleConvertToInvoice}
                disabled={converting || quote.status === 'rejected'}
                className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={16} />
                {converting ? 'Converting...' : 'Convert to Invoice'}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="w-full bg-secondary text-white px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download PDF
              </button>
              <button
                onClick={handleSendEmail}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                Send Email
              </button>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-black">Line Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unit Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quote.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">R{item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">R{(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Total:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-primary">
                    R{quote.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {quote.status === 'accepted' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="text-green-600 mr-2" size={20} />
              <span className="text-green-800 font-medium">This quote has been accepted and is ready to be converted to an invoice.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}