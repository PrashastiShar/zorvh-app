// frontend/src/app/contact/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define the Toast component (copied from your main page.tsx)
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white ${bgColor} z-50 transition-transform duration-300 ease-out transform translate-y-0 opacity-100`}>
      {message}
    </div>
  );
};

export default function ContactPage() {
  const router = useRouter();

  // State for the contact form inputs
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // State for managing email sending process and feedback
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Handler for updating form input changes
  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  // Handler for submitting the contact form
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    setIsSendingEmail(true); // Set loading state to true

    try {
      // This URL must match your deployed Firebase Function URL
      const functionUrl = 'https://sendcontactemail-eljhfm2xgq-uc.a.run.app'; 

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm), // Send form data as JSON
      });

      if (response.ok) {
        // If the response is successful (status 200-299)
        setToastMessage('Your message has been sent successfully!');
        setToastType('success'); // Set toast type to success
        setContactForm({ name: '', email: '', subject: '', message: '' }); // Clear the form
      } else {
        // If the response indicates an error
        const errorText = await response.text(); // Get error message from response body
        setToastMessage(`Failed to send message: ${errorText || 'Unknown error'}`);
        setToastType('error'); // Set toast type to error
      }
      setShowToast(true); // Show the toast message
    } catch (error) {
      // Catch any network errors or uncaught exceptions
      console.error('Error submitting contact form:', error);
      setToastMessage('An unexpected error occurred. Please try again.');
      setToastType('error'); // Set toast type to error
      setShowToast(true); // Show the toast message
    } finally {
      setIsSendingEmail(false); // Reset loading state
      // Hide the toast after a delay
      setTimeout(() => setShowToast(false), 3000); 
    }
  };

  return (
    <div className="min-h-screen bg-void-black text-white pt-24 pb-16">
      {/* Toast notification component */}
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold text-treasure-gold mb-6">CONTACT US</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Have questions about your order, a product, or just want to say hello? Our team is ready to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form Section */}
          <div className="culture-card p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-treasure-gold mb-6">Send Us a Message</h3>
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={contactForm.name}
                  onChange={handleContactFormChange}
                  required
                  className="w-full px-5 py-3 bg-gray-800/70 border border-silver-light/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-treasure-gold transition-colors"
                  disabled={isSendingEmail}
                />
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  value={contactForm.email}
                  onChange={handleContactFormChange}
                  required
                  className="w-full px-5 py-3 bg-gray-800/70 border border-silver-light/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-treasure-gold transition-colors"
                  disabled={isSendingEmail}
                />
              </div>
              <div>
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  value={contactForm.subject}
                  onChange={handleContactFormChange}
                  required
                  className="w-full px-5 py-3 bg-gray-800/70 border border-silver-light/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-treasure-gold transition-colors"
                  disabled={isSendingEmail}
                />
              </div>
              <div>
                <textarea
                  name="message"
                  rows={5}
                  placeholder="Your Message"
                  value={contactForm.message}
                  onChange={handleContactFormChange}
                  required
                  className="w-full px-5 py-3 bg-gray-800/70 border border-silver-light/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-treasure-gold transition-colors resize-y"
                  disabled={isSendingEmail}
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-gradient-to-r from-treasure-gold to-amber-500 rounded-full font-bold text-black text-lg hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'SEND MESSAGE'
                )}
              </button>
            </form>
          </div>
          
          {/* Existing Contact Information and Business Hours Section */}
          <div>
            <div className="culture-card p-8 rounded-xl shadow-lg mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mt-1 mr-4 text-treasure-gold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Phone</h4>
                    <p className="text-white/80">+91 9148258860</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 mr-4 text-treasure-gold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Email</h4>
                    <p className="text-white/80">myzorvh@gmail.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 mr-4 text-treasure-gold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Headquarters</h4>
                    <p className="text-white/80">Old Goa</p>
                    <p className="text-white/80">Kdamba Plateau</p>
                    <p className="text-white/80">India, 560068</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="culture-card p-8 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">Business Hours</h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex justify-between">
                  <span>Online support available within 24 hours</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
