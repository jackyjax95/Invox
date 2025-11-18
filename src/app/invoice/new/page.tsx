'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, Save, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface InvoiceData {
  invoice_number?: string;
  id?: string;
  user_id?: string;
  client_name?: string;
  client_email?: string;
  total?: number;
  status?: string;
  created_at?: string;
  due_date?: string;
  description?: string;
}

interface ParsedInvoice {
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  orderNumber: string;
  description: string;
  unitPrice: string;
  quantity: string;
  cost: string;
  date: string;
  dueDate: string;
}

function NewInvoicePageContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [parsedInvoice, setParsedInvoice] = useState<ParsedInvoice>({
    clientId: '',
    clientName: '',
    invoiceNumber: '',
    orderNumber: '',
    description: '',
    unitPrice: '',
    quantity: '1',
    cost: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
  });

  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>('');
  const [fromQuote, setFromQuote] = useState(false);
  const [originalQuoteId, setOriginalQuoteId] = useState<string>('');

  const searchParams = useSearchParams();

  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsRes = await fetch('/api/clients');
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          console.log('Fetched clients:', clientsData.clients); // Debug log
          setClients(clientsData.clients || []);
        } else {
          console.error('Failed to fetch clients:', clientsRes.status);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    const fetchNextInvoiceNumber = async () => {
      try {
        // Get current invoices to calculate next number
        const invoicesRes = await fetch('/api/invoices');
        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json();
          const existingNumbers = invoicesData.invoices
            .map((inv: InvoiceData) => parseInt(inv.invoice_number?.replace('INV', '') || '0'))
            .filter((num: number) => !isNaN(num));

          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          const nextInvoiceNumber = `INV${nextNumber.toString().padStart(5, '0')}`;
          setNextInvoiceNumber(nextInvoiceNumber);
        }
      } catch (error) {
        console.error('Error fetching next invoice number:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check if this is a conversion from quote
    const isFromQuote = searchParams.get('from') === 'quote';
    if (isFromQuote) {
      setFromQuote(true);

      // Get quote data from localStorage
      const quoteDataStr = localStorage.getItem('pendingInvoiceFromQuote');
      if (quoteDataStr) {
        try {
          const quoteData = JSON.parse(quoteDataStr);
          setParsedInvoice(prev => ({
            ...prev,
            clientName: quoteData.clientName || '',
            orderNumber: quoteData.orderNumber || '',
            description: quoteData.description || '',
            unitPrice: quoteData.unitPrice || '',
            quantity: quoteData.quantity || '1',
            cost: quoteData.cost || '',
            date: quoteData.date || '',
            dueDate: quoteData.dueDate || '',
          }));
          setOriginalQuoteId(quoteData.originalQuoteId || '');

          // Clear the localStorage data
          localStorage.removeItem('pendingInvoiceFromQuote');
        } catch (error) {
          console.error('Error parsing quote data:', error);
        }
      }
    }

    // Check if clientId is provided (from client detail page)
    const clientId = searchParams.get('clientId');
    if (clientId) {
      // Pre-select the client
      setParsedInvoice(prev => ({
        ...prev,
        clientId: clientId,
      }));
    }

    fetchClients();
    fetchNextInvoiceNumber();
  }, [searchParams]);

  // Calculate total cost automatically when unitPrice or quantity changes
  useEffect(() => {
    const unitPrice = parseFloat(parsedInvoice.unitPrice) || 0;
    const quantity = parseFloat(parsedInvoice.quantity) || 1;
    const calculatedTotal = unitPrice * quantity;

    // Only auto-calculate if no manual total has been entered
    if (!parsedInvoice.cost || parsedInvoice.cost === '' || calculatedTotal > 0) {
      setParsedInvoice(prev => ({
        ...prev,
        cost: calculatedTotal > 0 ? calculatedTotal.toFixed(2) : prev.cost
      }));
    }
  }, [parsedInvoice.unitPrice, parsedInvoice.quantity, parsedInvoice.cost]);

  const startListening = () => {
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
    parseTranscript(transcript);
  };

  const parseTranscript = (text: string) => {
    const lowerText = text.toLowerCase();

    // Enhanced parsing logic for invoice fields
    const clientMatch = lowerText.match(/(?:client|customer)\s+(?:name\s+)?(?:is\s+)?([a-zA-Z\s]+?)(?:\s+for|\s+amount|\s+dollar|\$|$)/i);
    const orderNumberMatch = lowerText.match(/(?:order\s+number|order\s+#|po\s+number|po\s+#)\s+(?:is\s+)?([a-zA-Z0-9\-]+?)(?:\s+for|\s+amount|\s+dollar|\$|$)/i);
    const unitPriceMatch = lowerText.match(/(?:unit\s+price|price\s+per|each|per\s+unit)\s+(?:of\s+)?\$?(\d+(?:\.\d{2})?)/i) ||
                           lowerText.match(/\$(\d+(?:\.\d{2})?)\s+(?:per|each)/i);
    const quantityMatch = lowerText.match(/(?:quantity|qty|amount)\s+(?:of\s+)?(\d+)(?:\s+items|\s+units|\s+pieces|$)/i);
    const costMatch = lowerText.match(/(?:total\s+cost|total\s+amount|cost)\s+(?:of\s+)?\$?(\d+(?:\.\d{2})?)/i) ||
                      lowerText.match(/\$(\d+(?:\.\d{2})?)\s+(?:total|cost)/i);
    const descriptionMatch = lowerText.match(/(?:for\s+)(.+?)(?:\s+amount|\s+dollar|\s+\$|\s+due|\s+date|$)/i);
    const dateMatch = lowerText.match(/(?:date|invoice date)\s+(?:is\s+)?([a-zA-Z0-9\s]+?)(?:\s+due|\s+amount|$)/i);
    const dueDateMatch = lowerText.match(/(?:due\s+date|due|payment due)\s+(?:is\s+|on\s+)?([a-zA-Z0-9\s]+?)(?:\s+for|\s+amount|$)/i);

    // Parse dates more intelligently
    const parseDate = (dateStr: string) => {
      if (!dateStr) return '';
      const today = new Date();
      const lowerDate = dateStr.toLowerCase().trim();

      if (lowerDate.includes('today')) return today.toISOString().split('T')[0];
      if (lowerDate.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
      if (lowerDate.includes('next week')) {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
      }
      if (lowerDate.includes('next month')) {
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        return nextMonth.toISOString().split('T')[0];
      }

      // Try to parse as a date
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }

      return dateStr; // fallback to original string
    };

    setParsedInvoice({
      clientId: '',
      clientName: clientMatch ? clientMatch[1].trim() : '',
      invoiceNumber: '',
      orderNumber: orderNumberMatch ? orderNumberMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      unitPrice: unitPriceMatch ? unitPriceMatch[1] : '',
      quantity: quantityMatch ? quantityMatch[1] : '1',
      cost: costMatch ? costMatch[1] : '',
      date: parseDate(dateMatch ? dateMatch[1].trim() : ''),
      dueDate: parseDate(dueDateMatch ? dueDateMatch[1].trim() : ''),
    });
  };


  const handleSave = async () => {
    try {
      // Validate required fields
      if (!parsedInvoice.clientId || !parsedInvoice.unitPrice) {
        alert('Please select a client and fill in unit price');
        return;
      }

      // Get current user (in a real app, this would come from auth)
      const userId = 'demo-user'; // Replace with actual user ID from auth

      // Calculate total cost
      const quantity = parseFloat(parsedInvoice.quantity) || 1;
      const unitPrice = parseFloat(parsedInvoice.unitPrice) || 0;
      const totalCost = parsedInvoice.cost ? parseFloat(parsedInvoice.cost) : (quantity * unitPrice);

      // Get selected client details
      const selectedClient = clients.find(client => client.id === parsedInvoice.clientId);

      // Ensure we have client name - if not set in parsedInvoice, get it from selected client
      const clientName = parsedInvoice.clientName || selectedClient?.name || '';

      // Validate that we have all required data
      if (!clientName) {
        alert('Please select a valid client');
        return;
      }

      if (totalCost <= 0) {
        alert('Please enter a valid total amount');
        return;
      }

      // Prepare invoice data
      const invoiceData = {
        client_name: clientName,
        client_email: selectedClient?.email || '',
        order_number: parsedInvoice.orderNumber,
        items: [{
          description: parsedInvoice.description || 'Services',
          quantity: quantity,
          price: unitPrice,
        }],
        total: totalCost,
        status: 'draft',
        created_at: new Date().toISOString(),
        due_date: parsedInvoice.dueDate ? new Date(parsedInvoice.dueDate).toISOString() : null,
        user_id: userId,
        // invoice_number will be auto-generated by the API
      };

      console.log('Sending invoice data:', invoiceData);
      console.log('Selected client:', selectedClient);
      console.log('Client name from parsedInvoice:', parsedInvoice.clientName);
      console.log('Final client name used:', clientName);
      console.log('Total cost:', totalCost);

      // Save to mock API instead of Firebase for now
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const savedInvoice = await response.json();
        console.log('Invoice saved with ID:', savedInvoice.id);
        console.log('Invoice number:', savedInvoice.invoice_number);

        alert(`Invoice saved successfully! Invoice Number: ${savedInvoice.invoice_number}`);

        // If this was created from a quote, show additional info
        if (fromQuote) {
          alert(`Invoice created from quote ${originalQuoteId}! You can now manage the invoice and track payment.`);
        }

        // Reset form
        setParsedInvoice({
          clientId: '',
          clientName: '',
          invoiceNumber: '',
          orderNumber: '',
          description: '',
          unitPrice: '',
          quantity: '1',
          cost: '',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        resetTranscript();
      } else {
        const errorData = await response.json();
        alert(`Error saving invoice: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice. Please try again.');
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-primary/5 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Speech recognition is not supported in this browser.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse text-foreground">Loading clients...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-primary hover:text-primary-dark mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>

          {fromQuote && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="text-blue-600 mr-2" size={20} />
                <div>
                  <h3 className="text-blue-800 font-medium">Converting from Quote</h3>
                  <p className="text-blue-700 text-sm">
                    This invoice is being created from quote {originalQuoteId}. Form fields have been pre-filled from the quote data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Voice Input</h2>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-4 rounded-full ${
                isListening
                  ? 'bg-accent hover:bg-accent-dark text-white'
                  : 'bg-primary hover:bg-primary-dark text-white'
              } transition-colors`}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <div>
              <p className="font-bold text-black">
                {isListening ? 'Listening...' : 'Click to start recording'}
              </p>
              <p className="text-sm text-black">
                Say something like: &ldquo;Create invoice for John Doe, order number PO-12345, for web development services, unit price 1500 dollars, quantity 1, due date next month&rdquo;
              </p>
            </div>
          </div>

          {transcript && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Transcript:</h3>
              <p className="text-gray-700">{transcript}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-black">Invoice Details</h2>
            <div className="text-right">
              <div className="text-sm text-gray-500">Invoice Number</div>
              <div className="text-lg font-bold text-primary">
                {nextInvoiceNumber || 'INV-XXXX-XXX'}
              </div>
            </div>
          </div>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Client *
                </label>
                <select
                  value={parsedInvoice.clientId}
                  onChange={(e) => {
                    const selectedClient = clients.find(client => client.id === e.target.value);
                    setParsedInvoice(prev => ({
                      ...prev,
                      clientId: e.target.value,
                      clientName: selectedClient ? selectedClient.name : '',
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                >
                  <option value="">Select a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company ? `(${client.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Number
                </label>
                <input
                  type="text"
                  value={parsedInvoice.orderNumber}
                  onChange={(e) => setParsedInvoice(prev => ({ ...prev, orderNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                  placeholder="e.g. PO-12345"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={parsedInvoice.description}
                onChange={(e) => setParsedInvoice(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                rows={3}
                placeholder="Enter invoice description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price (R) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={parsedInvoice.unitPrice}
                  onChange={(e) => setParsedInvoice(prev => ({ ...prev, unitPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={parsedInvoice.quantity}
                  onChange={(e) => setParsedInvoice(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={parsedInvoice.cost}
                  onChange={(e) => setParsedInvoice(prev => ({ ...prev, cost: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                  placeholder="Auto-calculated"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date (dd/mm/yyyy)
                </label>
                <input
                  type="date"
                  value={parsedInvoice.date}
                  onChange={(e) => setParsedInvoice(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (dd/mm/yyyy)
              </label>
              <input
                type="date"
                value={parsedInvoice.dueDate}
                onChange={(e) => setParsedInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                placeholder="dd/mm/yyyy"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
              >
                <Save size={20} />
                Save Invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse text-foreground">Loading...</div>
          </div>
        </div>
      </div>
    }>
      <NewInvoicePageContent />
    </Suspense>
  );
}