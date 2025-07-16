// app/privacy/page.tsx
'use client';

import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-void-black text-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold text-treasure-gold mb-6">PRIVACY POLICY</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Your privacy is paramount to us. This policy outlines how ZORVH collects, uses, and protects your personal information in accordance with Indian laws.
          </p>
        </div>

        <div className="space-y-12">
          {/* Introduction */}
          <div className="culture-card p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Introduction</h2>
            <div className="space-y-4 text-white/80">
              <p>This Privacy Policy describes how ZORVH ("we," "us," or "our") collects, uses, and discloses your personal information when you visit, use our services, or make a purchase from zorvh.com (the "Site") or otherwise communicate with us. We are committed to protecting your privacy and ensuring the security of your personal data in compliance with applicable Indian laws, including the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules) and other relevant regulations.</p>
              <p>By accessing or using our Site, you agree to the terms of this Privacy Policy. If you do not agree with our policies and practices, please do not use our Site.</p>
            </div>
          </div>

          {/* Information We Collect */}
          <div className="culture-card p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Information We Collect</h2>
            <div className="space-y-4 text-white/80">
              <p>We collect various types of information for different purposes to provide and improve our services to you.</p>
              <h3 className="text-xl font-bold text-white mt-6 mb-2">Personal Data:</h3>
              <p>While using our Site, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. This may include, but is not limited to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Name (First Name, Last Name)</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Billing and Shipping address</li>
                <li>Payment information (e.g., credit/debit card details, UPI IDs - processed securely by third-party payment gateways)</li>
                <li>Login credentials (username, password)</li>
              </ul>
              <h3 className="text-xl font-bold text-white mt-6 mb-2">Usage Data:</h3>
              <p>We may also collect information about how the Site is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g., IP address), browser type, browser version, the pages of our Site that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers, and other diagnostic data.</p>
              <h3 className="text-xl font-bold text-white mt-6 mb-2">Cookies and Tracking Data:</h3>
              <p>We use cookies and similar tracking technologies to track the activity on our Site and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div className="culture-card p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">How We Use Your Information</h2>
            <div className="space-y-4 text-white/80">
              <p>ZORVH uses the collected data for various purposes:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>To provide and maintain our Site and services</li>
                <li>To process your orders and manage your account</li>
                <li>To notify you about changes to our services</li>
                <li>To allow you to participate in interactive features of our Site when you choose to do so</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so that we can improve our Site and services</li>
                <li>To monitor the usage of our Site</li>
                <li>To detect, prevent, and address technical issues</li>
                <li>To send you marketing and promotional communications, if you have opted in</li>
                <li>To comply with legal obligations and resolve disputes</li>
              </ul>
            </div>
          </div>

          {/* Data Sharing & Disclosure */}
          <div className="culture-card p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Data Sharing & Disclosure</h2>
            <div className="space-y-4 text-white/80">
              <p>We may share your personal information with third parties only in the following circumstances:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Service Providers:</strong> We may employ third-party companies and individuals to facilitate our Site and services, provide the Site on our behalf, perform Site-related services, or assist us in analyzing how our Site is used (e.g., payment gateway providers, logistics partners, IT service providers). These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</li>
                <li><strong>Legal Requirements:</strong> We may disclose your Personal Data in the good faith belief that such action is necessary to:
                  <ul className="list-disc list-inside ml-8 space-y-1">
                    <li>Comply with a legal obligation (e.g., court order, government request)</li>
                    <li>Protect and defend the rights or property of ZORVH</li>
                    <li>Prevent or investigate possible wrongdoing in connection with the Site</li>
                    <li>Protect the personal safety of users of the Site or the public</li>
                    <li>Protect against legal liability</li>
                  </ul>
                </li>
                <li><strong>Business Transfers:</strong> If ZORVH is involved in a merger, acquisition, or asset sale, your Personal Data may be transferred. We will provide notice before your Personal Data is transferred and becomes subject to a different Privacy Policy.</li>
                <li><strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your explicit consent.</li>
              </ul>
            </div>
          </div>

          {/* Data Security */}
          <div className="culture-card p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Data Security</h2>
            <div className="space-y-4 text-white/80">
              <p>The security of your data is important to us. We implement reasonable security practices and procedures as mandated by the Information Technology Act, 2000, and the SPDI Rules, 2011. This includes physical, electronic, and procedural safeguards to protect your personal information from unauthorized access, use, alteration, and disclosure. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
            </div>
          </div>

          {/* Your Rights (Indian Context) */}
          <div className="culture-card p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Your Rights</h2>
            <div className="space-y-4 text-white/80">
              <p>In accordance with Indian laws, you have certain rights regarding your personal data:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Right to Access:</strong> You have the right to request access to the personal data we hold about you.</li>
                <li><strong>Right to Correction:</strong> You have the right to request that we correct any inaccurate or incomplete personal data.</li>
                <li><strong>Right to Withdraw Consent:</strong> You have the right to withdraw your consent at any time for the collection and processing of your sensitive personal data or information, provided such withdrawal does not affect the lawfulness of processing based on consent before its withdrawal.</li>
                <li><strong>Right to Grievance Redressal:</strong> You have the right to lodge a complaint with our Grievance Officer regarding any concerns about your data.</li>
              </ul>
              <p className="mt-4">To exercise any of these rights, please contact us using the details provided in the "Contact Us" section below.</p>
            </div>
          </div>

          {/* Changes to this Privacy Policy */}
          <div className="culture-card p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Changes to This Privacy Policy</h2>
            <div className="space-y-4 text-white/80">
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. We will let you know via email and/or a prominent notice on our Site prior to the change becoming effective and update the "effective date" at the top of this Privacy Policy.</p>
              <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
            </div>
          </div>

          {/* Contact Us */}
          <div className="culture-card p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Contact Us</h2>
            <div className="space-y-4 text-white/80">
              <p>If you have any questions about this Privacy Policy, our data practices, or wish to exercise your rights, please contact our Grievance Officer:</p>
              <p><strong>Email:</strong> <a href="mailto:myzorvh@gmail.com" className="text-treasure-gold hover:underline">myzorvh@gmail.com</a></p>
              <p><strong>Address:</strong><br />ZORVH <br />Old Goa, Kdamba Plateau<br />India, 560068</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
