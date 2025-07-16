// app/faq/page.tsx
'use client';

import React, { useState } from 'react';

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I place an order?",
      answer: "To place an order, simply browse our collections, select the items you love, add them to your cart, and proceed to checkout. You'll need to provide your shipping information and payment details to complete your purchase."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), UPI and Apple Pay. All payments are securely processed through our encrypted payment gateway."
    },
    {
      question: "How can I track my order?",
      answer: "Once your order ships, you'll receive a confirmation email with a tracking number. You can use this tracking number on our website or the carrier's website to monitor your package's journey."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 7-day return policy for unworn, unwashed items with original tags attached. Please visit our Returns & Exchanges page for detailed instructions on how to initiate a return."
    },
    {
      question: "Can I modify or cancel my order?",
      answer: "We process orders quickly to ensure fast delivery. If you need to modify or cancel your order, please contact us immediately at support@zorvh.com with your order number. We'll do our best to accommodate your request if your order hasn't shipped yet."
    },
    {
      question: "Do you offer gift wrapping?",
      answer: "Yes! During checkout, you'll see an option for gift wrapping. We offer beautiful, sustainable wrapping options perfect for special occasions."
    }
  ];

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-void-black text-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold text-treasure-gold mb-6">FREQUENTLY ASKED QUESTIONS</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Find answers to common questions about orders, shipping, returns, and more.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="culture-card overflow-hidden rounded-xl shadow-lg">
              <button
                className="w-full text-left p-6 flex justify-between items-center"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="text-lg md:text-xl font-bold text-white">{faq.question}</h3>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-treasure-gold transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div 
                className={`px-6 pb-6 transition-all duration-300 ease-in-out ${activeIndex === index ? 'block' : 'hidden'}`}
              >
                <p className="text-white/80">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="culture-card p-8 rounded-xl shadow-lg inline-block max-w-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
            <p className="text-white/80 mb-6">
              Our support team is ready to help with any additional questions you might have.
            </p>
            <a 
              href="/contact" 
              className="px-8 py-3 border-2 border-treasure-gold rounded-full font-bold text-lg text-treasure-gold hover:bg-treasure-gold/10 transition-colors inline-block"
            >
              CONTACT SUPPORT
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}