'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Download, Mail, MessageCircle } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  client_name: string;
  client_email?: string;
  items: InvoiceItem[];
  total: number;
  status: string;
  created_at: string;
  due_date: string | null;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // Fetch from Supabase
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();

        if (error || !invoice) {
          setError('Invoice not found');
          return;
        }

        setInvoice(invoice);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const handleDownloadPDF = () => {
    window.open(`/api/invoice/${invoiceId}/pdf`, '_blank');
  };

  const handleShareWhatsApp = () => {
    if (!invoice) return;

    const message = `Invoice from Your Company Name\n\nInvoice ID: ${invoice.id}\nClient: ${invoice.client_name}\nTotal: R${invoice.total.toFixed(2)}\nDue Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB') : 'N/A'}\n\nPlease find the attached invoice.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = () => {
    if (!invoice) return;

    const subject = `Invoice ${invoice.id} from Your Company Name`;
    const body = `Dear ${invoice.client_name},\n\nPlease find attached invoice ${invoice.id} for R${invoice.total.toFixed(2)}.\n\nDue Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB') : 'N/A'}\n\nThank you for your business!\n\nBest regards,\nYour Company Name`;

    const mailtoUrl = `mailto:${invoice.client_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading invoice...</div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Invoice not found'}</p>
            <Link
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Dashboard
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
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-gray-600">Invoice ID: {invoice.id}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Status: <span className={`px-2 py-1 rounded-full text-sm ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>{invoice.status}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">From</h3>
              <p className="text-gray-700">Your Company Name</p>
              <p className="text-gray-700">123 Business St</p>
              <p className="text-gray-700">City, State 12345</p>
              <p className="text-gray-700">Phone: (123) 456-7890</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Bill To</h3>
              <p className="text-gray-700">{invoice.client_name}</p>
              {invoice.client_email && <p className="text-gray-700">{invoice.client_email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-600">Invoice Date: {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-GB') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Due Date: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB') : 'N/A'}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Qty</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Price</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">R{item.price.toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">R{(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right font-semibold">Total:</td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-semibold">R{invoice.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Send Invoice</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={20} />
              Download PDF
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageCircle size={20} />
              Share via WhatsApp
            </button>
            <button
              onClick={handleShareEmail}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Mail size={20} />
              Send via Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}