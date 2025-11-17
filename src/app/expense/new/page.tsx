'use client';

import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Receipt, Camera, Search } from 'lucide-react';
import Link from 'next/link';

interface ExpenseLineItem {
  id: string;
  description: string;
  quantity: string;
  amount: string;
  category: string;
  vatIncluded: boolean;
}

interface ExpenseFormData {
  vendor: string;
  invoiceNumber: string;
  date: string;
  lineItems: ExpenseLineItem[];
  total: string;
  vatTotal: string;
  exclVatTotal: string;
}

const expenseCategories = [
  'Office Supplies',
  'Travel',
  'Meals & Entertainment',
  'Software & Tools',
  'Marketing',
  'Equipment',
  'Utilities',
  'Professional Services',
  'Other'
];

export default function NewExpensePage() {
  const [formData, setFormData] = useState<ExpenseFormData>({
    vendor: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    lineItems: [{
      id: '1',
      description: '',
      quantity: '1',
      amount: '',
      category: '',
      vatIncluded: false,
    }],
    total: '0.00',
    vatTotal: '0.00',
    exclVatTotal: '0.00',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [vendors, setVendors] = useState<{id: string, name: string}[]>([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');

  useEffect(() => {
    // Calculate totals when line items change
    calculateTotals();
  }, [formData.lineItems]);

  useEffect(() => {
    // Load vendors from localStorage (in production this would be from API)
    const loadVendors = () => {
      const storedVendors = localStorage.getItem('smart-invoice-vendors');
      if (storedVendors) {
        setVendors(JSON.parse(storedVendors));
      } else {
        // Mock vendors for demo
        const mockVendors = [
          { id: '1', name: 'DNS Supplies' },
          { id: '2', name: 'Tech Solutions Inc' },
          { id: '3', name: 'Office Depot' },
          { id: '4', name: 'Uber' },
          { id: '5', name: 'Starbucks' },
        ];
        setVendors(mockVendors);
        localStorage.setItem('smart-invoice-vendors', JSON.stringify(mockVendors));
      }
    };
    loadVendors();
  }, []);

  const calculateTotals = () => {
    let total = 0;
    let vatTotal = 0;
    let exclVatTotal = 0;

    formData.lineItems.forEach(item => {
      const quantity = parseFloat(item.quantity) || 1;
      const unitAmount = parseFloat(item.amount) || 0;
      const amount = quantity * unitAmount;

      if (item.vatIncluded) {
        // Amount includes VAT: VAT = 15% of amount, Excl. VAT = Amount - VAT
        const vatAmount = amount * 0.15;
        const exclAmount = amount - vatAmount;
        console.log(`VAT Included Item: Qty=${quantity}, Unit=${unitAmount}, Total=${amount}, VAT=${vatAmount.toFixed(2)}, Excl=${exclAmount.toFixed(2)}`);
        vatTotal += vatAmount;
        exclVatTotal += exclAmount;
        total += amount;
      } else {
        // Amount excludes VAT: Excl. VAT = Amount, no VAT added
        console.log(`VAT Excluded Item: Qty=${quantity}, Unit=${unitAmount}, Total=${amount}, Excl=${amount}, VAT=0`);
        exclVatTotal += amount;
        total += amount;
      }
    });

    console.log(`Totals: Excl=${exclVatTotal.toFixed(2)}, VAT=${vatTotal.toFixed(2)}, Total=${total.toFixed(2)}`);

    setFormData(prev => ({
      ...prev,
      total: total.toFixed(2),
      vatTotal: vatTotal.toFixed(2),
      exclVatTotal: exclVatTotal.toFixed(2),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Vendor is required';
    }

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (formData.lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    }

    formData.lineItems.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Description is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`item_${index}_quantity`] = 'Valid quantity is required';
      }
      if (!item.amount || item.amount === '' || isNaN(parseFloat(item.amount))) {
        newErrors[`item_${index}_amount`] = 'Valid amount is required';
      }
      if (!item.category) {
        newErrors[`item_${index}_category`] = 'Category is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Save each line item as a separate expense
      const savePromises = formData.lineItems.map(item =>
        fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendor: formData.vendor.trim(),
            invoiceNumber: formData.invoiceNumber.trim(),
            description: item.description.trim(),
            quantity: item.quantity,
            amount: item.amount,
            category: item.category,
            date: formData.date,
            vatIncluded: item.vatIncluded,
          }),
        })
      );

      const responses = await Promise.all(savePromises);
      const allSuccessful = responses.every(response => response.ok);

      if (allSuccessful) {
        alert('Expense saved successfully!');
        // Reset form
        setFormData({
          vendor: '',
          invoiceNumber: '',
          date: new Date().toISOString().split('T')[0],
          lineItems: [{
            id: '1',
            description: '',
            quantity: '1',
            amount: '',
            category: '',
            vatIncluded: false,
          }],
          total: '0.00',
          vatTotal: '0.00',
          exclVatTotal: '0.00',
        });
        setErrors({});
      } else {
        alert('Error saving some expense items. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      alert('Error saving expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ExpenseFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleVendorSearch = (value: string) => {
    setVendorSearchTerm(value);
    setFormData(prev => ({ ...prev, vendor: value }));
    setShowVendorDropdown(value.length > 0);
  };

  const selectVendor = (vendorName: string) => {
    setFormData(prev => ({ ...prev, vendor: vendorName }));
    setVendorSearchTerm(vendorName);
    setShowVendorDropdown(false);
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())
  );

  const handleLineItemChange = (itemId: string, field: keyof ExpenseLineItem, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));

    // Clear error for this field
    const itemIndex = formData.lineItems.findIndex(item => item.id === itemId);
    const errorKey = `item_${itemIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }

    // Recalculate totals when amounts, quantities, or VAT status change
    if (field === 'amount' || field === 'quantity' || field === 'vatIncluded') {
      setTimeout(calculateTotals, 100); // Small delay to ensure state is updated
    }
  };

  const addLineItem = () => {
    const newId = (formData.lineItems.length + 1).toString();
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: newId,
        description: '',
        quantity: '1',
        amount: '',
        category: '',
        vatIncluded: false,
      }]
    }));
  };

  const removeLineItem = (itemId: string) => {
    if (formData.lineItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter(item => item.id !== itemId)
      }));
      setTimeout(calculateTotals, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-primary hover:text-primary-dark mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Receipt className="text-primary" size={32} />
                Add New Expense
              </h1>
              <p className="text-gray-600 mt-2">Track your business expenses with ease</p>
            </div>
            <Link
              href="/expense/scan"
              className="bg-gradient-accent text-white px-6 py-3 rounded-lg hover:bg-gradient-secondary transition-all flex items-center gap-2 shadow-lg"
            >
              <Camera size={20} />
              Scan Receipt
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => handleVendorSearch(e.target.value)}
                    onFocus={() => setShowVendorDropdown(formData.vendor.length > 0)}
                    onBlur={() => setTimeout(() => setShowVendorDropdown(false), 200)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600 ${
                      errors.vendor ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Search or enter vendor name"
                  />
                  <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                {showVendorDropdown && filteredVendors.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredVendors.map((vendor) => (
                      <button
                        key={vendor.id}
                        type="button"
                        onClick={() => selectVendor(vendor.name)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-black"
                      >
                        {vendor.name}
                      </button>
                    ))}
                  </div>
                )}

                {errors.vendor && (
                  <p className="mt-1 text-sm text-red-600">{errors.vendor}</p>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Can't find your vendor? <Link href="/expense/vendors" className="text-primary hover:text-primary-dark">Add new vendor</Link>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600 ${
                    errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g. INV-001, ABC-123"
                />
                {errors.invoiceNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  + Add Item
                </button>
              </div>

              {formData.lineItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                    {formData.lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600 ${
                          errors[`item_${index}_description`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Item description"
                      />
                      {errors[`item_${index}_description`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_description`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(item.id, 'quantity', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600 ${
                          errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1"
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Price (R) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => handleLineItemChange(item.id, 'amount', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 placeholder-gray-600 ${
                          errors[`item_${index}_amount`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00 (use negative for credits)"
                      />
                      {errors[`item_${index}_amount`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_amount`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => handleLineItemChange(item.id, 'category', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-gray-900 ${
                          errors[`item_${index}_category`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select category</option>
                        {expenseCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {errors[`item_${index}_category`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_category`]}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={item.vatIncluded}
                        onChange={(e) => handleLineItemChange(item.id, 'vatIncluded', e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">VAT Included (15%)</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {item.vatIncluded && item.amount ?
                          `(VAT: R${(parseFloat(item.amount) * 0.15).toFixed(2)}, Excl: R${(parseFloat(item.amount) - parseFloat(item.amount) * 0.15).toFixed(2)})` :
                          ''
                        }
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Check if this item's amount already includes VAT</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Excl. VAT Total:</span>
                <span className="font-medium text-gray-900">
                  R{(() => {
                    let total = 0;
                    formData.lineItems.forEach(item => {
                      const amount = parseFloat(item.amount) || 0;
                      if (item.vatIncluded) {
                        total += amount - (amount * 0.15);
                      } else {
                        total += amount;
                      }
                    });
                    return total.toFixed(2);
                  })()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">VAT Total (15%):</span>
                <span className="font-medium text-gray-900">
                  R{(() => {
                    let total = 0;
                    formData.lineItems.forEach(item => {
                      const amount = parseFloat(item.amount) || 0;
                      if (item.vatIncluded) {
                        total += amount * 0.15;
                      }
                    });
                    return total.toFixed(2);
                  })()}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span className="text-gray-900">Invoice Total:</span>
                <span className="text-gray-900">
                  R{(() => {
                    let total = 0;
                    formData.lineItems.forEach(item => {
                      total += parseFloat(item.amount) || 0;
                    });
                    return total.toFixed(2);
                  })()}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-primary text-white px-8 py-3 rounded-lg hover:bg-gradient-cyan-blue transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {isSubmitting ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}