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
      // Enhanced fallback for WebView
      const textArea = document.createElement('textarea');
      textArea.value = upiLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopySuccess('link');
        setTimeout(() => setCopySuccess(''), 2000);
      } catch (err2) {
        // Final fallback - show in alert
        alert(`UPI Link: ${upiLink}`);
      }
      
      document.body.removeChild(textArea);
    }
  };

  // Improved sharing with QR code image generation
  const shareQRImage = async () => {
    try {
      // Generate QR code as image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 500;
      
      if (!ctx) return;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 500);

      // Header
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, 400, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('UPI Payment QR Code', 200, 38);

      // Payment details
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      let yPos = 90;

      if (formData.name) {
        ctx.fillText(`Pay to: ${formData.name}`, 200, yPos);
        yPos += 25;
      }
      
      ctx.fillText(`Amount: ₹${formData.amount}`, 200, yPos);
      yPos += 20;
      
      if (formData.message) {
        ctx.font = '14px Arial';
        ctx.fillText(`For: ${formData.message}`, 200, yPos);
        yPos += 25;
      }

      // Get QR code and draw it
      const svg = qrRef.current?.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        
        img.onload = async () => {
          const qrSize = 200;
          const qrX = (400 - qrSize) / 2;
          ctx.drawImage(img, qrX, yPos + 20, qrSize, qrSize);
          
          // Footer
          ctx.fillStyle = '#666666';
          ctx.font = '12px Arial';
          ctx.fillText('Scan with any UPI app', 200, yPos + qrSize + 50);
          ctx.fillText('Powered by Zico Network', 200, yPos + qrSize + 70);

          // Share as image
          canvas.toBlob(async (blob) => {
            if (blob && navigator.share) {
              try {
                const file = new File([blob], 'upi-payment.png', { type: 'image/png' });
                await navigator.share({
                  title: 'UPI Payment Request',
                  text: `Pay ₹${formData.amount} to ${formData.name || formData.upiId}`,
                  files: [file]
                });
                setCopySuccess('shared');
                setTimeout(() => setCopySuccess(''), 2000);
              } catch (shareErr) {
                // Fallback to download
                downloadQRImage(canvas);
              }
            } else {
              // Fallback to download
              downloadQRImage(canvas);
            }
          }, 'image/png');
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    } catch (err) {
      console.log('Share failed:', err);
      // Fallback to text sharing
      shareTextFormat();
    }
  };

  const downloadQRImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = `UPI-Payment-${formData.amount}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    setCopySuccess('downloaded');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const shareTextFormat = async () => {
    const shareText = `💳 UPI Payment Request\n\n` +
      `💰 Amount: ₹${formData.amount}\n` +
      `👤 Pay to: ${formData.name || formData.upiId}\n` +
      `🏪 UPI ID: ${formData.upiId}\n` +
      (formData.message ? `📝 For: ${formData.message}\n` : '') +
      `\n🔗 UPI Link: ${upiLink}\n\n` +
      `📱 Tap the link or scan QR code to pay instantly!`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'UPI Payment Request',
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Payment details copied! You can paste and share anywhere.');
      }
      setCopySuccess('shared');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      // Final fallback
      alert(shareText);
    }
  };

  const downloadReceipt = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 600;
    
    if (!ctx) return;

    // Background with gradient effect
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 600);

    // Header
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, 400, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Payment Receipt', 200, 35);
    ctx.font = '14px Arial';
    ctx.fillText('Generated by Zico Network', 200, 55);

    // Content with better styling
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Payment Details', 30, 120);

    // Draw separator line
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 135);
    ctx.lineTo(370, 135);
    ctx.stroke();

    let yPos = 160;
    ctx.font = '14px Arial';

    // Payment information with better formatting
    const details = [
      { label: 'Recipient', value: formData.name || 'Not specified', color: '#374151' },
      { label: 'UPI ID', value: formData.upiId, color: '#6366f1' },
      { label: 'Amount', value: `₹${formData.amount}`, color: '#059669', bold: true },
      { label: 'Description', value: formData.message || 'No description', color: '#374151' }
    ];

    details.forEach(detail => {
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.fillText(`${detail.label}:`, 30, yPos);
      
      ctx.fillStyle = detail.color;
      ctx.font = detail.bold ? 'bold 16px Arial' : '14px Arial';
      ctx.fillText(detail.value, 30, yPos + 20);
      
      yPos += detail.bold ? 55 : 45;
    });

    // QR Code section with border
    const qrSize = 150;
    const qrX = (400 - qrSize) / 2;
    const qrY = yPos + 20;

    // QR background with shadow effect
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);

    // Add QR code
    const svg = qrRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      img.onload = () => {
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        
        // Footer information
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Scan with any UPI app to pay', 200, qrY + qrSize + 35);
        ctx.fillText(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 200, qrY + qrSize + 55);
        
        // Download
        const link = document.createElement('a');
        link.download = `UPI-Receipt-${formData.upiId}-${formData.amount}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
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
      {/* WebView Optimized Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-3 sm:py-4 sm:px-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white border-2 border-gray-200 shadow-lg">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="text-center">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UPI Generator
              </h1>
              <p className="text-gray-600 text-xs">Instant payments made easy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Optimized for WebView */}
      <div className="px-3 py-4 sm:px-6 max-w-md mx-auto sm:max-w-6xl">
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
          
          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Payment Details</h2>
              <p className="text-gray-600 text-sm">Fill details to generate UPI link</p>
            </div>

            <div className="space-y-4">
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
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400 touch-manipulation"
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
                  className={`w-full px-3 py-3 text-base border rounded-lg transition-all text-gray-900 placeholder-gray-400 touch-manipulation ${
                    errors.upiId 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {errors.upiId && (
                  <p className="mt-1 text-sm text-red-600 font-medium flex items-center">
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
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 font-semibold">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3 py-3 text-base border rounded-lg transition-all text-gray-900 placeholder-gray-400 touch-manipulation ${
                      errors.amount 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 font-medium flex items-center">
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
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400 touch-manipulation"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={generateLink}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg touch-manipulation"
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
                    className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all touch-manipulation"
                  >
                    Reset Form
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
            {!upiLink ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-gray-600 text-sm">Fill payment details to create your UPI link and QR code</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Payment Link Generated
                  </h3>
                  <p className="text-gray-600 text-sm">Share or use the options below</p>
                </div>

                {/* Payment Link */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <label className="block text-xs font-medium text-gray-700 mb-2">UPI Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiLink}
                      readOnly
                      className="flex-1 px-2 py-2 bg-white border border-gray-300 rounded text-xs text-gray-700 font-mono"
                    />
                    <button
                      onClick={copyLink}
                      className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                        copySuccess === 'link'
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } touch-manipulation`}
                    >
                      {copySuccess === 'link' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-900 mb-3">QR Code</label>
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm" ref={qrRef}>
                    <QRCode 
                      value={upiLink} 
                      size={window?.innerWidth < 640 ? 160 : 200}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 mb-4">Scan with any UPI app</p>
                  
                  {/* Enhanced Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={shareQRImage}
                      className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm transition-all touch-manipulation ${
                        copySuccess === 'shared'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span>{copySuccess === 'shared' ? 'Shared!' : 'Share QR'}</span>
                    </button>
                    
                    <button
                      onClick={shareTextFormat}
                      className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm transition-all border-2 touch-manipulation ${
                        copySuccess === 'text'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Share Text</span>
                    </button>
                    
                    <button
                      onClick={downloadReceipt}
                      className="flex items-center justify-center space-x-2 px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all touch-manipulation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="w-4 h-4 text-blue-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Payment Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    {formData.name && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Recipient:</span>
                        <span className="font-semibold text-gray-900">{formData.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-700">UPI ID:</span>
                      <span className="font-semibold text-gray-900 font-mono text-xs break-all">{formData.upiId}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-blue-200">
                      <span className="text-gray-700 font-medium">Amount:</span>
                      <span className="font-bold text-green-700 text-base">₹{formData.amount}</span>
                    </div>
                    {formData.message && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Description:</span>
                        <span className="font-semibold text-gray-900 text-right">{formData.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-200">
            <div className="w-5 h-5 rounded-full overflow-hidden bg-white border border-gray-300">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Zico Network</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-gray-600">Secure • Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
}
