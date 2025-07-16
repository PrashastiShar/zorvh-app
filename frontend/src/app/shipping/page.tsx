// app/shipping/page.tsx

'use client';

import React from 'react';

export default function ShippingPage() {
  const shippingOptions = [
    {
      name: "Standard Delivery (within India)",
      price: "₹99",
      time: "5-7 business days",
      description: "Our most economical option for deliveries across India. Includes tracking and delivery confirmation."
    },
    {
      name: "Express Delivery (within India)",
      price: "₹249",
      time: "2-3 business days",
      description: "Priority handling for faster delivery to major Indian cities. Includes full tracking and signature confirmation."
    },
    {
      name: "Remote Area Delivery (within India)",
      price: "₹199",
      time: "7-10 business days",
      description: "For deliveries to remote or less accessible regions within India. Includes tracking."
    }
  ];

  return (
    <div className="min-h-screen bg-void-black text-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold text-treasure-gold mb-6">SHIPPING & DELIVERY</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            We ensure timely and secure delivery across India. Here's everything you need to know about our shipping process.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Shipping Options & Timelines</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shippingOptions.map((option, index) => (
              <div key={index} className="culture-card p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{option.name}</h3>
                  <span className="text-treasure-gold font-bold">{option.price}</span>
                </div>
                <p className="text-white mb-3">
                  <span className="font-semibold">Delivery Time:</span> {option.time}
                </p>
                <p className="text-white/80">{option.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Order Processing</h2>
            <div className="space-y-4 text-white/80">
              <p>All orders are processed within 1-2 business days (excluding weekends and public holidays).</p>
              <p>During festive seasons or sales events, processing may take an additional 1-2 days.</p>
              <p>Once your order ships, you'll receive a confirmation email with tracking information.</p>
            </div>
          </div>
          
          {/* This section is now focused on general delivery information within India */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Delivery Information</h2>
            <div className="space-y-4 text-white/80">
              <p>We partner with reliable courier services to ensure your package reaches you safely and on time across India.</p>
              <p>Please ensure your delivery address and contact details are accurate to avoid any delays.</p>
              <p>For any specific delivery instructions, please add them during checkout or contact our support team.</p>
            </div>
          </div>
        </div>

        <div className="mt-16 culture-card p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Tracking Your Order</h2>
          <div className="space-y-4 text-white/80">
            <p>Once your order ships, you'll receive an email with a tracking number and a link to track your package.</p>
            <p>You can also track your order by logging into your account on our website.</p>
            <p>If you have any issues with tracking, please contact our support team at shipping@zorvh.com.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
