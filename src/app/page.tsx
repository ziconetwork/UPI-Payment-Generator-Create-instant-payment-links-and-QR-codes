'use client';
import { useState } from 'react';
import QRCode from 'react-qr-code';

interface FormData {
  name: string;
  upiId: string;
  amount: string;
  message: string;
}

interface Errors {
  [key: string]: string;
}

export default function PaymentLinkGenerator() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    upiId: '',
    amount: '',
    message: ''
  });
  const [upiLink, setUpiLink] = useState<string>('');
  const [errors, setErrors] = useState<Errors>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};
    
    if (!formData.upiId.trim()) {
      newErrors.upiId = 'UPI ID is required';
    } else if (!/^[\w.-]+@[\w.-]+$/.test(formData.upiId)) {
      newErrors.upiId = 'Please enter a valid UPI ID';
    }
    
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateLink = async () => {
    if (!validateForm()) return;
    
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const link = `upi://pay?pa=${formData.upiId}&pn=${encodeURIComponent(
      formData.name || 'Payment'
    )}&am=${formData.amount}&cu=INR&tn=${encodeURIComponent(formData.message || 'Payment')}`;
    
    setUpiLink(link);
    setIsGenerating(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(upiLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert('Failed to copy link. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', upiId: '', amount: '', message: '' });
    setUpiLink('');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header with Your Logo */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            {/* Your Logo Here */}
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm">
              <img 
                src="/logo.png " 
                alt="Company Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">UPI Payment Generator</h1>
              <p className="text-gray-700 text-sm">Create instant payment links and QR codes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Details</h2>
              <p className="text-gray-700 text-sm">Fill in the details to generate your UPI payment link</p>
            </div>

            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your name or business name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* UPI ID Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  UPI ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => handleInputChange('upiId', e.target.value)}
                  placeholder="example@paytm"
                  className={`w-full px-4 py-3 border rounded-lg transition-colors text-gray-900 placeholder-gray-500 ${
                    errors.upiId 
                      ? 'border-red-400 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {errors.upiId && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.upiId}</p>
                )}
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Amount (INR) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 font-medium">₹</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-3 border rounded-lg transition-colors text-gray-900 placeholder-gray-500 ${
                      errors.amount 
                        ? 'border-red-400 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.amount}</p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Payment Description
                </label>
                <input
                  type="text"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="What is this payment for?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={generateLink}
                  disabled={isGenerating}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    'Generate Payment Link'
                  )}
                </button>
                
                {upiLink && (
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            {!upiLink ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h4.01M12 12v4.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-gray-700 text-sm">Fill in the payment details and click generate to create your UPI link and QR code</p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Link Generated</h3>
                  <p className="text-gray-700 text-sm">Share this link or QR code to receive payments</p>
                </div>

                {/* Payment Link */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Payment Link</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={upiLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-800"
                    />
                    <button
                      onClick={copyLink}
                      className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
                        copySuccess 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-900 mb-4">QR Code</label>
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                    <QRCode value={upiLink} size={200} />
                  </div>
                  <p className="text-xs text-gray-600 mt-3">Scan this QR code with any UPI app to make payment</p>
                </div>

                {/* Payment Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Summary</h4>
                  <div className="space-y-2 text-sm">
                    {formData.name && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Recipient:</span>
                        <span className="font-medium text-gray-900">{formData.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-700">UPI ID:</span>
                      <span className="font-medium text-gray-900">{formData.upiId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Amount:</span>
                      <span className="font-medium text-green-700">₹{formData.amount}</span>
                    </div>
                    {formData.message && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Description:</span>
                        <span className="font-medium text-gray-900">{formData.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm font-medium">
            By Zico Network 🚀
            Secure • Fast • Compatible with all UPI apps
          </p>
        </div>
      </div>
    </div>
  );
}
