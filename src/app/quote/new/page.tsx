'use client';

import { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface ParsedQuote {
  clientId: string;
  clientName: string;
  quoteNumber: string;
  orderNumber: string;
  description: string;
  unitPrice: string;
  quantity: string;
  cost: string;
  date: string;
  validUntil: string;
}

export default function NewQuotePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [parsedQuote, setParsedQuote] = useState<ParsedQuote>({
    clientId: '',
    clientName: '',
    quoteNumber: '',
    orderNumber: '',
    description: '',
    unitPrice: '',
    quantity: '1',
    cost: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
  });

  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextQuoteNumber, setNextQuoteNumber] = useState<string>('');

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsRes = await fetch('/api/clients');
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          console.log('Fetched clients:', clientsData.clients);
          setClients(clientsData.clients || []);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    const fetchNextQuoteNumber = async () => {
      try {
        // Get current quotes to calculate next number
        const quotesRes = await fetch('/api/quotes');
        if (quotesRes.ok) {
          const quotesData = await quotesRes.json();
          const existingNumbers = quotesData.quotes
            .map((quote: any) => parseInt(quote.id.replace('Q', '') || '0'))
            .filter((num: number) => !isNaN(num));

          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          const nextQuoteNumber = `Q${nextNumber.toString().padStart(5, '0')}`;
          setNextQuoteNumber(nextQuoteNumber);
        }
      } catch (error) {
        console.error('Error fetching next quote number:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
    fetchNextQuoteNumber();
  }, []);

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

    // Enhanced parsing logic for quote fields
    const clientMatch = lowerText.match(/(?:client|customer)\s+(?:name\s+)?(?:is\s+)?([a-zA-Z\s]+?)(?:\s+for|\s+amount|\s+dollar|\$|$)/i);
    const orderNumberMatch = lowerText.match(/(?:order\s+number|order\s+#|po\s+number|po\s+#)\s+(?:is\s+)?([a-zA-Z0-9\-]+?)(?:\s+for|\s+amount|\s+dollar|\$|$)/i);
    const unitPriceMatch = lowerText.match(/(?:unit\s+price|price\s+per|each|per\s+unit)\s+(?:of\s+)?\$?(\d+(?:\.\d{2})?)/i) ||
                           lowerText.match(/\$(\d+(?:\.\d{2})?)\s+(?:per|each)/i);
    const quantityMatch = lowerText.match(/(?:quantity|qty|amount)\s+(?:of\s+)?(\d+)(?:\s+items|\s+units|\s+pieces|$)/i);
    const costMatch = lowerText.match(/(?:total\s+cost|total\s+amount|cost)\s+(?:of\s+)?\$?(\d+(?:\.\d{2})?)/i) ||
                      lowerText.match(/\$(\d+(?:\.\d{2})?)\s+(?:total|cost)/i);
    const descriptionMatch = lowerText.match(/(?:for\s+)(.+?)(?:\s+amount|\s+dollar|\s+\$|\s+due|\s+date|$)/i);
    const dateMatch = lowerText.match(/(?:date|quote date)\s+(?:is\s+)?([a-zA-Z0-9\s]+?)(?:\s+valid|\s+amount|$)/i);
    const validUntilMatch = lowerText.match(/(?:valid\s+until|expires|expiry)\s+(?:is\s+|on\s+)?([a-zA-Z0-9\s]+?)(?:\s+for|\s+amount|$)/i);

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

    setParsedQuote({
      clientId: '',
      clientName: clientMatch ? clientMatch[1].trim() : '',
      quoteNumber: '',
      orderNumber: orderNumberMatch ? orderNumberMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      unitPrice: unitPriceMatch ? unitPriceMatch[1] : '',
      quantity: quantityMatch ? quantityMatch[1] : '1',
      cost: costMatch ? costMatch[1] : '',
      date: parseDate(dateMatch ? dateMatch[1].trim() : ''),
      validUntil: parseDate(validUntilMatch ? validUntilMatch[1].trim() : ''),
    });
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!parsedQuote.clientId || !parsedQuote.unitPrice) {
        alert('Please select a client and fill in unit price');
        return;
      }

      // Get current user (in a real app, this would come from auth)
      const userId = 'demo-user';

      // Calculate total cost
      const quantity = parseFloat(parsedQuote.quantity) || 1;
      const unitPrice = parseFloat(parsedQuote.unitPrice) || 0;
      const totalCost = parsedQuote.cost ? parseFloat(parsedQuote.cost) : (quantity * unitPrice);

      // Get selected client details
      const selectedClient = clients.find(client => client.id === parsedQuote.clientId);

      // Prepare quote data
      const quoteData = {
        client_name: parsedQuote.clientName,
        client_email: selectedClient?.email || '',
        order_number: parsedQuote.orderNumber,
        items: [{
          description: parsedQuote.description || 'Services',
          quantity: quantity,
          price: unitPrice,
        }],
        total: totalCost,
        status: 'draft',
        created_at: new Date().toISOString(),
        valid_until: parsedQuote.validUntil ? new Date(parsedQuote.validUntil).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: userId,
        description: parsedQuote.description,
      };

      // Save to mock API
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (response.ok) {
        const savedQuote = await response.json();
        console.log('Quote saved with ID:', savedQuote.id);

        alert(`Quote saved successfully! Quote Number: ${savedQuote.id}`);
        // Reset form
        setParsedQuote({
          clientId: '',
          clientName: '',
          quoteNumber: '',
          orderNumber: '',
          description: '',
          unitPrice: '',
          quantity: '1',
          cost: '',
          date: new Date().toISOString().split('T')[0],
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        resetTranscript();
      } else {
        const errorData = await response.json();
        alert(`Error saving quote: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Error saving quote. Please try again.');
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
          <h1 className="text-3xl font-bold text-gray-900">Create New Quote</h1>
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
                Say something like: &quot;Create quote for John Doe, order number PO-12345, for web development services, unit price 1500 dollars, quantity 1, valid for 30 days&quot;
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
            <h2 className="text-xl font-semibold text-black">Quote Details</h2>
            <div className="text-right">
              <div className="text-sm text-gray-500">Quote Number</div>
              <div className="text-lg font-bold text-primary">
                {nextQuoteNumber || 'Q-XXXXX'}
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
                  value={parsedQuote.clientId}
                  onChange={(e) => {
                    const selectedClient = clients.find(client => client.id === e.target.value);
                    setParsedQuote(prev => ({
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
                  value={parsedQuote.orderNumber}
                  onChange={(e) => setParsedQuote(prev => ({ ...prev, orderNumber: e.target.value }))}
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
                value={parsedQuote.description}
                onChange={(e) => setParsedQuote(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                rows={3}
                placeholder="Enter quote description"
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
                  value={parsedQuote.unitPrice}
                  onChange={(e) => setParsedQuote(prev => ({ ...prev, unitPrice: e.target.value }))}
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
                  value={parsedQuote.quantity}
                  onChange={(e) => setParsedQuote(prev => ({ ...prev, quantity: e.target.value }))}
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
                  value={parsedQuote.cost}
                  onChange={(e) => setParsedQuote(prev => ({ ...prev, cost: e.target.value }))}
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
                  value={parsedQuote.date}
                  onChange={(e) => setParsedQuote(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until (dd/mm/yyyy)
              </label>
              <input
                type="date"
                value={parsedQuote.validUntil}
                onChange={(e) => setParsedQuote(prev => ({ ...prev, validUntil: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-[#868d94]"
                placeholder="dd/mm/yyyy"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Save size={20} />
                Save Quote
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
