// app/returns/page.tsx
'use client';

import React from 'react';

export default function ReturnsPage() {
  const returnSteps = [
    {
      step: 1,
      title: "Initiate Your Return Online",
      description: "Log in to your ZORVH account, go to 'My Orders', and select the item you wish to return. Follow the prompts to initiate a return request within 7 days of delivery."
    },
    {
      step: 2,
      title: "Schedule Pickup or Self-Ship",
      description: "Depending on your location, you may be offered a free pickup service. If pickup is not available, you will receive clear instructions to self-ship the item to our returns center."
    },
    {
      step: 3,
      title: "Prepare Your Package",
      description: "Ensure the item is in its original condition, unworn, unwashed, with all original tags attached. Pack it securely, preferably in the original packaging, along with the original invoice."
    },
    {
      step: 4,
      title: "Receive Your Refund",
      description: "Once the returned item is received and inspected (typically within 3-5 business days of receipt), your refund will be processed to your original payment method. You will receive an email confirmation."
    }
  ];

  return (
    <div className="min-h-screen bg-void-black text-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold text-treasure-gold mb-6">RETURNS & EXCHANGES</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Not completely satisfied? We make returns and exchanges simple and straightforward, ensuring a hassle-free experience within India.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Our Return Policy</h2>
          
          <div className="culture-card p-8 rounded-xl shadow-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-treasure-gold mb-2">7</div>
                <div className="text-white/80">Days to Return</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-treasure-gold mb-2">100%</div>
                <div className="text-white/80">Money Back</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-treasure-gold mb-2">₹0</div>
                <div className="text-white/80">Restocking Fees</div>
              </div>
            </div>
            
            <div className="space-y-4 text-white/80">
              <p>We offer a 7-day return policy for most items from the date of delivery. Items must be in their original, unused, and unworn condition with all original tags and packaging intact.</p>
              <p>Please note that certain categories like innerwear, swimwear, and personalized items are non-returnable due to hygiene or customization reasons.</p>
              <p>For eligible returns, we offer a full refund to your original payment method. Free pickup may be available depending on your location; otherwise, self-shipment instructions will be provided.</p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">How to Return</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {returnSteps.map((step) => (
              <div key={step.step} className="culture-card p-6 rounded-xl shadow-lg">
                <div className="w-12 h-12 rounded-full bg-treasure-gold flex items-center justify-center text-black font-bold text-xl mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-white/80">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Exchanges</h2>
            <div className="space-y-4 text-white/80">
              <p>For exchanges (e.g., size or color), please initiate a return for the original item as per the 'How to Return' steps. Once the refund is processed, you can place a new order for the desired item.</p>
              <p>This ensures the fastest processing and availability of the new product. Standard shipping charges will apply to the new order.</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Damaged or Defective Items</h2>
            <div className="space-y-4 text-white/80">
              <p>If you receive a damaged or defective item, please contact our customer support at <a href="mailto:support@zorvh.com" className="text-treasure-gold hover:underline">support@zorvh.com</a> within 48 hours of delivery.</p>
              <p>Please include your order number and clear photos of the damaged item and its packaging in your email.</p>
              <p>We will arrange a free pickup for the damaged item and provide a replacement or full refund, based on product availability and your preference.</p>
            </div>
          </div>
        </div>

        <div className="mt-16 culture-card p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Return Shipping Address (for Self-Ship)</h2>
          <div className="space-y-2 text-white/80">
            <p>ZORVH Returns Department</p>
            <p>Plot No. 123, Industrial Area</p>
            <p>Phase 1, Electronic City</p>
            <p>Bengaluru, Karnataka 560100</p>
            <p>India</p>
          </div>
          <p className="mt-4 text-white/80">
            Please use a trackable shipping method for self-shipped returns. For eligible returns, we may offer free pickup, which will be communicated during the return initiation process. Returns sent without prior authorization may experience delays.
          </p>
        </div>
      </div>
    </div>
  );
}
