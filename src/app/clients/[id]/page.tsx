'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Mail, Phone, Building, DollarSign, FileText, Eye, Download } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  created_at: string;
  due_date: string;
  description?: string;
}

interface ClientDetails {
  client: Client;
  invoices: Invoice[];
  outstandingBalance: number;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch client details');
        }
        const data = await response.json();
        setClientDetails(data);
      } catch (err) {
        console.error('Error fetching client details:', err);
        setError('Failed to load client details');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  const handleDownloadPDF = (invoiceId: string) => {
    window.open(`/api/invoice/${invoiceId}/pdf`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f1f5] p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse text-foreground">Loading client details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !clientDetails) {
    return (
      <div className="min-h-screen bg-[#f0f1f5] p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Client not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { client, invoices, outstandingBalance } = clientDetails;

  return (
    <div className="min-h-screen bg-[#f0f1f5] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/clients"
            className="inline-flex items-center text-primary hover:text-primary-dark mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Clients
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{client.name}</h1>
              {client.company && (
                <p className="text-gray-600">{client.company}</p>
              )}
            </div>
            <Link
              href={`/invoice/new?clientId=${client.id}`}
              className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-lg hover:from-primary-dark hover:to-primary transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Add Invoice
            </Link>
          </div>
        </div>

        {/* Client Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Outstanding Balance */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <DollarSign size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Outstanding Balance</h3>
                <p className="text-2xl font-bold text-red-600">R{outstandingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Mail size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
                <p className="text-gray-600">{client.email}</p>
                {client.phone && (
                  <p className="text-gray-600">{client.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Count */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <FileText size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Invoices</h3>
                <p className="text-2xl font-bold text-green-600">{invoices.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-black">Invoices</h2>
            <p className="text-gray-600">All invoices for {client.name}</p>
          </div>

          {invoices.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileText size={20} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {invoice.invoice_number}
                          </h3>
                          <p className="text-gray-600">{invoice.description || 'No description'}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-500">
                              Date: {new Date(invoice.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-gray-500">
                              Due: {new Date(invoice.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          R{invoice.total.toFixed(2)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/invoice/${invoice.id}`}
                          className="text-primary hover:text-primary-dark p-2 rounded transition-colors"
                          title="View Invoice"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDownloadPDF(invoice.id)}
                          className="text-secondary hover:text-accent p-2 rounded transition-colors"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-500 mb-6">
                This client doesn't have any invoices yet.
              </p>
              <Link
                href={`/invoice/new?clientId=${client.id}`}
                className="bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-3 rounded-lg hover:from-primary-dark hover:to-primary transition-all inline-flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Create First Invoice
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}