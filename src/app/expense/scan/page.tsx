'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, ArrowLeft, Save, RotateCcw, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { createWorker } from 'tesseract.js';

interface ExtractedData {
  vendor: string;
  amount: string;
  date: string;
  category: string;
  description: string;
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

export default function ExpenseScanPage() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    vendor: '',
    amount: '',
    date: '',
    category: '',
    description: '',
  });
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ExtractedData>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
        stopCamera();
        processImage(imageDataUrl);
      }
    }
  }, [stopCamera]);

  const processImage = async (imageDataUrl: string) => {
    setIsProcessing(true);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(imageDataUrl);
      await worker.terminate();

      const parsedData = parseReceiptText(text);
      setExtractedData(parsedData);
      setIsReviewing(true);
    } catch (error) {
      console.error('OCR processing error:', error);
      alert('Failed to process the image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseReceiptText = (text: string): ExtractedData => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    let vendor = '';
    let amount = '';
    let date = '';
    let category = 'Other';

    // Extract vendor (usually first line or prominent text)
    if (lines.length > 0) {
      vendor = lines[0].replace(/[^a-zA-Z\s&]/g, '').trim();
    }

    // Extract amount (look for currency patterns)
    const amountRegex = /\$?\d+\.?\d{0,2}/g;
    const amounts = text.match(amountRegex);
    if (amounts && amounts.length > 0) {
      // Take the largest amount as the total
      const numericAmounts = amounts.map(a => parseFloat(a.replace('$', '')));
      amount = Math.max(...numericAmounts).toString();
    }

    // Extract date (look for date patterns)
    const dateRegex = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/g;
    const dates = text.match(dateRegex);
    if (dates && dates.length > 0) {
      // Try to parse the first date found
      const parsedDate = new Date(dates[0]);
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate.toISOString().split('T')[0];
      }
    }

    // Default to today if no date found
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }

    // Try to categorize based on vendor keywords
    const lowerText = text.toLowerCase();
    if (lowerText.includes('restaurant') || lowerText.includes('cafe') || lowerText.includes('food')) {
      category = 'Meals & Entertainment';
    } else if (lowerText.includes('office') || lowerText.includes('supplies') || lowerText.includes('stationery')) {
      category = 'Office Supplies';
    } else if (lowerText.includes('taxi') || lowerText.includes('uber') || lowerText.includes('travel')) {
      category = 'Travel';
    } else if (lowerText.includes('software') || lowerText.includes('tech') || lowerText.includes('computer')) {
      category = 'Software & Tools';
    }

    return {
      vendor,
      amount,
      date,
      category,
      description: text.substring(0, 200), // First 200 chars as description
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ExtractedData> = {};

    if (!extractedData.vendor.trim()) {
      newErrors.vendor = 'Vendor is required';
    }

    if (!extractedData.amount || parseFloat(extractedData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!extractedData.date) {
      newErrors.date = 'Date is required';
    }

    if (!extractedData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendor: extractedData.vendor.trim(),
          description: extractedData.description.trim(),
          amount: extractedData.amount,
          category: extractedData.category,
          date: extractedData.date,
          receipt_image_url: capturedImage, // Store the image data URL
        }),
      });

      if (response.ok) {
        alert('Expense saved successfully!');
        resetForm();
      } else {
        const errorData = await response.json();
        alert(`Error saving expense: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCapturedImage(null);
    setExtractedData({
      vendor: '',
      amount: '',
      date: '',
      category: '',
      description: '',
    });
    setIsReviewing(false);
    setErrors({});
  };

  const handleInputChange = (field: keyof ExtractedData, value: string) => {
    setExtractedData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Camera className="text-blue-600" size={32} />
            Scan Expense Receipt
          </h1>
          <p className="text-gray-600 mt-2">Take a photo of your receipt to automatically extract expense details</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {!isReviewing ? (
            <div className="space-y-6">
              {!isCapturing && !capturedImage && (
                <div className="text-center">
                  <button
                    onClick={startCamera}
                    className="bg-gradient-blue-purple text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-3 mx-auto shadow-lg"
                  >
                    <Camera size={24} />
                    Start Camera
                  </button>
                  <p className="text-gray-500 mt-4">Position your receipt in the camera view</p>
                </div>
              )}

              {isCapturing && (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg border-2 border-dashed border-gray-300"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={capturePhoto}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Camera size={20} />
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {capturedImage && !isProcessing && (
                <div className="space-y-4">
                  <div className="text-center">
                    <img
                      src={capturedImage}
                      alt="Captured receipt"
                      className="max-w-full h-auto rounded-lg border border-gray-300 mx-auto"
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => processImage(capturedImage)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      Process Receipt
                    </button>
                    <button
                      onClick={resetForm}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw size={20} />
                      Retake
                    </button>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Processing receipt with OCR...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle size={20} />
                <span className="font-medium">Review Extracted Data</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor *
                  </label>
                  <input
                    type="text"
                    value={extractedData.vendor}
                    onChange={(e) => handleInputChange('vendor', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-black ${
                      errors.vendor ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.vendor && (
                    <p className="mt-1 text-sm text-red-600">{errors.vendor}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (R) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={extractedData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-black ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={extractedData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={extractedData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {expenseCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={extractedData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-black"
                  placeholder="Add any additional details..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button
                  onClick={resetForm}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={20} />
                  Scan Again
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-blue-purple text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {isSaving ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}