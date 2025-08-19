'use client';
import { useState, useRef } from 'react';
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
  const [copySuccess, setCopySuccess] = useState<string>('');
  const qrRef = useRef<HTMLDivElement>(null);

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
      setCopySuccess('link');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      // Fallback for older browsers or webview
      const textArea = document.createElement('textarea');
      textArea.value = upiLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess('link');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const shareQR = async () => {
    try {
      if (navigator.share) {
        // Use native sharing if available
        await navigator.share({
          title: 'UPI Payment Request',
          text: `Pay ₹${formData.amount} to ${formData.name || formData.upiId}\n${formData.message ? `For: ${formData.message}` : ''}\n\nUPI Link:`,
          url: upiLink
        });
        setCopySuccess('shared');
        setTimeout(() => setCopySuccess(''), 2000);
      } else {
        // Fallback for browsers without Web Share API
        const shareText = `Pay ₹${formData.amount} to ${formData.name || formData.upiId}\n${formData.message ? `For: ${formData.message}` : ''}\n\nUPI Link: ${upiLink}`;
        
        await navigator.clipboard.writeText(shareText);
        setCopySuccess('shared');
        setTimeout(() => setCopySuccess(''), 2000);
        alert('Payment details copied to clipboard! You can now paste it anywhere to share.');
      }
    } catch (err) {
      console.log('Sharing failed:', err);
      // Final fallback
      alert('Sharing not supported on this device. Use the Copy Link button instead.');
    }
  };

  const downloadReceipt = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size for receipt
    canvas.width = 400;
    canvas.height = 600;
    
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 600);
    
    // Header background
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, 0, 400, 80);
    
    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('UPI Payment Receipt', 200, 35);
    ctx.font = '14px Arial';
    ctx.fillText('Scan QR or Use Link Below', 200, 55);
    
    // Content
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Payment Details:', 30, 120);
    
    // Payment info
    ctx.font = '14px Arial';
    let yPos = 150;
    
    if (formData.name) {
      ctx.fillStyle = '#666666';
      ctx.fillText('Recipient Name:', 30, yPos);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(formData.name, 30, yPos + 20);
      ctx.font = '14px Arial';
      yPos += 50;
    }
    
    ctx.fillStyle = '#666666';
    ctx.fillText('UPI ID:', 30, yPos);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(formData.upiId, 30, yPos + 20);
    ctx.font = '14px Arial';
    yPos += 50;
    
    ctx.fillStyle = '#666666';
    ctx.fillText('Amount:', 30, yPos);
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`₹${formData.amount}`, 30, yPos + 25);
    ctx.font = '14px Arial';
    yPos += 60;
    
    if (formData.message) {
      ctx.fillStyle = '#666666';
      ctx.fillText('Description:', 30, yPos);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(formData.message, 30, yPos + 20);
      yPos += 50;
    }
    
    // QR Code section
    const qrSize = 150;
    const qrX = (400 - qrSize) / 2;
    const qrY = yPos + 30;
    
    // QR background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
    ctx.strokeStyle = '#e5e5e5';
    ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
    
    // Get QR code as image and draw it
    const svg = qrRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      img.onload = () => {
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        
        // Footer
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Scan with any UPI app to pay', 200, qrY + qrSize + 30);
        ctx.fillText(`Generated on ${new Date().toLocaleDateString()}`, 200, qrY + qrSize + 50);
        ctx.fillText('Powered by Zico Network', 200, qrY + qrSize + 70);
        
        // Download
        const link = document.createElement('a');
        link.download = `UPI-Receipt-${formData.upiId}-${formData.amount}-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', upiId: '', amount: '', message: '' });
    setUpiLink('');
    setErrors({});
    setCopySuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile-Optimized Header with Your Logo */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white border-2 border-gray-200 shadow-lg">
              <img 
                src="/logo.png" 
                alt="Your Company Logo" 
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UPI Generator
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm">Instant payments made easy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile First */}
      <div className="px-4 py-6 sm:px-6 max-w-md mx-auto sm:max-w-6xl">
        <div className="space-y-6 sm:grid sm:grid-cols-2 sm:gap-8 sm:space-y-0">
          
          {/* Form Section - Mobile Optimized */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Payment Details</h2>
              <p className="text-gray-600 text-sm">Fill details to generate UPI link</p>
            </div>

            <div className="space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your name or business"
                  className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* UPI ID Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  UPI ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => handleInputChange('upiId', e.target.value)}
                  placeholder="yourname@paytm"
                  className={`w-full px-4 py-4 text-base border rounded-xl transition-all text-gray-900 placeholder-gray-400 ${
                    errors.upiId 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {errors.upiId && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.upiId}
                  </p>
                )}
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Amount (INR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 font-semibold text-lg">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-10 pr-4 py-4 text-base border rounded-xl transition-all text-gray-900 placeholder-gray-400 ${
                      errors.amount 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.amount}
                  </p>
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
                  placeholder="What's this payment for?"
                  className="w-full px-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Action Buttons - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={generateLink}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate Payment Link</span>
                    </div>
                  )}
                </button>
                
                {upiLink && (
                  <button
                    onClick={resetForm}
                    className="w-full sm:w-auto px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Result Section - Mobile Optimized */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            {!upiLink ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Fill payment details above to create your UPI link and QR code</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Payment Link Generated
                  </h3>
                  <p className="text-gray-600 text-sm">Share link or QR code to receive payments</p>
                </div>

                {/* Payment Link - Mobile Optimized */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                  <label className="block text-sm font-medium text-gray-900 mb-3">Payment Link</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={upiLink}
                      readOnly
                      className="flex-1 px-3 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 font-mono"
                    />
                    <button
                      onClick={copyLink}
                      className={`px-6 py-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                        copySuccess === 'link'
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      }`}
                    >
                      {copySuccess === 'link' ? (
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Copied!</span>
                        </div>
                      ) : 'Copy Link'}
                    </button>
                  </div>
                </div>

                {/* QR Code - Mobile Optimized */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-900 mb-4">QR Code</label>
                  <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-sm" ref={qrRef}>
                    <QRCode 
                      value={upiLink} 
                      size={typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : 220}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-3 mb-4">Scan with any UPI app to pay</p>
                  
                  {/* QR Action Buttons - Updated with proper functionality */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={shareQR}
                      className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all shadow-md ${
                        copySuccess === 'shared'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span>{copySuccess === 'shared' ? 'Shared!' : 'Share Payment'}</span>
                    </button>
                    <button
                      onClick={downloadReceipt}
                      className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download Receipt</span>
                    </button>
                  </div>
                </div>

                {/* Payment Summary - Mobile Optimized */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Payment Summary
                  </h4>
                  <div className="space-y-3 text-sm">
                    {formData.name && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Recipient:</span>
                        <span className="font-semibold text-gray-900 text-right">{formData.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">UPI ID:</span>
                      <span className="font-semibold text-gray-900 font-mono text-right break-all">{formData.upiId}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-blue-200">
                      <span className="text-gray-700 font-medium">Amount:</span>
                      <span className="font-bold text-green-700 text-lg">₹{formData.amount}</span>
                    </div>
                    {formData.message && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-700">Description:</span>
                        <span className="font-semibold text-gray-900 text-right ml-4">{formData.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Mobile Optimized with Your Logo */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-md border border-gray-200">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-white border border-gray-300">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-semibold text-gray-800">Zico Network</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Secure • Fast • Universal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
