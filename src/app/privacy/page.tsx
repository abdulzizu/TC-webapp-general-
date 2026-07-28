"use client";

import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";

export default function PrivacyPolicyPage() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors mb-6 block">← Back to store</Link>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: July 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-700">

          {/* Introduction */}
          <section>
            <p>
              Thrift Collision (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting the privacy of everyone who uses our website at thriftcollision.com (the &quot;Site&quot;) and our services. This Privacy Policy explains what personal information we collect, why we collect it, how we use it, and your rights regarding that information.
            </p>
            <p>
              We operate in compliance with the Nigeria Data Protection Act 2023 (NDPA) and are committed to processing your data lawfully, fairly, and transparently.
            </p>
          </section>

          {/* What We Collect */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Information We Collect</h2>
            <p>We collect the following types of personal information when you interact with our Site:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Information:</strong> Your email address when you create an account or sign in.</li>
              <li><strong>Order Information:</strong> Your name, phone number, delivery address, and payment details when you place an order.</li>
              <li><strong>Notification Preferences:</strong> Your email address when you sign up for drop notifications.</li>
              <li><strong>Wishlist Data:</strong> Keywords you save for items you&apos;re interested in.</li>
              <li><strong>Browsing Information:</strong> Pages visited, products viewed, and interactions with our Site collected automatically via cookies and similar technologies.</li>
              <li><strong>Device Information:</strong> Your browser type, operating system, IP address, and general location (city/state level) for analytics purposes.</li>
            </ul>
          </section>

          {/* How We Use It */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">How We Use Your Information</h2>
            <p>We use your personal information for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To process and fulfil your orders, including delivery and customer support.</li>
              <li>To communicate with you about your orders, deliveries, and account.</li>
              <li>To send you drop notifications and promotional emails you opted into.</li>
              <li>To improve our Site, products, and services based on usage patterns.</li>
              <li>To prevent fraud and maintain the security of our platform.</li>
              <li>To comply with legal obligations under Nigerian law.</li>
            </ul>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Legal Basis for Processing</h2>
            <p>Under the NDPA, we process your personal data based on:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Consent:</strong> When you sign up for notifications or create an account.</li>
              <li><strong>Contractual necessity:</strong> When we process orders and deliver products you purchased.</li>
              <li><strong>Legitimate interest:</strong> When we analyse Site usage to improve our service, provided this does not override your rights.</li>
              <li><strong>Legal obligation:</strong> When required to comply with Nigerian law or respond to lawful requests.</li>
            </ul>
          </section>

          {/* Sharing */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Who We Share Your Data With</h2>
            <p>We do not sell your personal information to third parties. We may share your data with:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Delivery partners:</strong> Your name, phone number, and address are shared with logistics providers (e.g. GUO Transport) to fulfil deliveries.</li>
              <li><strong>Payment processors:</strong> Payment information is handled by our payment gateway (e.g. Paystack) — we do not store your card details.</li>
              <li><strong>Service providers:</strong> We use third-party tools for email delivery (Resend), hosting (Vercel), and database services (Supabase). These providers process data on our behalf under strict data protection agreements.</li>
              <li><strong>Legal authorities:</strong> If required by Nigerian law, court order, or to protect our legal rights.</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Data Security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. This includes encrypted connections (HTTPS), secure database access controls, and hashed passwords.
            </p>
            <p>
              However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Data Retention</h2>
            <p>We retain your personal information for as long as necessary to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Maintain your account and provide our services.</li>
              <li>Fulfil legal, accounting, or reporting requirements.</li>
              <li>Resolve disputes and enforce our agreements.</li>
            </ul>
            <p>
              If you delete your account or request deletion of your data, we will remove your personal information within 30 days, except where retention is required by law.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Your Rights</h2>
            <p>Under the Nigeria Data Protection Act, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data where there is no compelling reason for continued processing.</li>
              <li><strong>Restrict processing:</strong> Request that we limit how we use your data in certain circumstances.</li>
              <li><strong>Withdraw consent:</strong> Unsubscribe from marketing communications at any time.</li>
              <li><strong>Data portability:</strong> Request your data in a structured, commonly used format.</li>
              <li><strong>Object:</strong> Object to processing based on legitimate interest.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:help@thriftcollision.com" className="text-[#1a6b2f] font-semibold hover:underline">help@thriftcollision.com</a>.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Cookies</h2>
            <p>
              Our Site uses cookies and similar technologies to improve your browsing experience, remember your preferences, and understand how you interact with our content. These include:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Essential cookies:</strong> Required for the Site to function (authentication, cart).</li>
              <li><strong>Analytics cookies:</strong> Help us understand Site usage and improve our services.</li>
            </ul>
            <p>You can manage cookie preferences through your browser settings.</p>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Children&apos;s Privacy</h2>
            <p>
              Our Site is not directed at individuals under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child without parental consent, we will take steps to delete that information.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes by posting the updated policy on our Site with a revised &quot;Last updated&quot; date.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or how we handle your data, contact us:</p>
            <ul className="list-none space-y-1">
              <li><strong>Email:</strong> <a href="mailto:help@thriftcollision.com" className="text-[#1a6b2f] hover:underline">help@thriftcollision.com</a></li>
              <li><strong>Instagram:</strong> <a href="https://www.instagram.com/thriftcollision/" target="_blank" rel="noopener noreferrer" className="text-[#1a6b2f] hover:underline">@thriftcollision</a></li>
              <li><strong>Location:</strong> Abuja, Nigeria</li>
            </ul>
          </section>

        </div>
      </main>
    </>
  );
}
