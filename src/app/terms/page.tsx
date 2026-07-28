"use client";

import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";

export default function TermsOfServicePage() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-[#1a6b2f] transition-colors mb-6 block">← Back to store</Link>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: July 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-700">

          {/* Introduction */}
          <section>
            <p>
              Welcome to Thrift Collision. By accessing our website at thriftcollision.com (the &quot;Site&quot;) or making a purchase, you agree to be bound by these Terms of Service (&quot;Terms&quot;). Please read them carefully before using our Site or placing an order.
            </p>
            <p>
              These Terms constitute a legal agreement between you and Thrift Collision (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), a business operating from Abuja, Nigeria.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Eligibility</h2>
            <p>
              By using this Site, you confirm that you are at least 18 years of age or have the consent of a parent or guardian. You agree to provide accurate and complete information when creating an account or placing an order.
            </p>
          </section>

          {/* Products */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Products and Availability</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All items listed on Thrift Collision are <strong>thrifted, pre-owned, or vintage</strong> pieces. They are curated, cleaned, and inspected for quality before listing.</li>
              <li>Each item is <strong>one-of-one</strong> — once sold, it is no longer available. Identical items can be restocked, only out of sheer luck or coincidence.</li>
              <li>Product descriptions, images, and measurements are as accurate as possible. Minor variations may exist due to the nature of thrifted goods.</li>
              <li>We reserve the right to limit quantities, refuse orders, or cancel transactions at our discretion — including in cases of pricing errors or suspected fraud.</li>
              <li>Availability shown on the Site is updated in real-time but is not guaranteed until your order is confirmed.</li>
            </ul>
          </section>

          {/* Pricing and Payment */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Pricing and Payment</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All prices are listed in Nigerian Naira (₦) and are inclusive of applicable charges unless otherwise stated.</li>
              <li>Delivery fees are calculated at checkout based on your delivery location and are clearly shown before you confirm your order.</li>
              <li>Payment must be made in full before your order is processed. We accept bank transfers and card payments via our payment gateway.</li>
              <li>We do not store your card details. Payment processing is handled securely by our payment partner.</li>
              <li>Orders above ₦60,000 qualify for free delivery (excludes stockpiled orders).</li>
            </ul>
          </section>

          {/* Orders and Delivery */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Orders and Delivery</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Once an order is placed and payment is confirmed, we will process and dispatch your items within the stated timeframe for your location.</li>
              <li><strong>Abuja:</strong> Same day to 1 business day delivery.</li>
              <li><strong>Other states:</strong> 2–4 business days via our logistics partners.</li>
              <li>Delivery estimates are not guarantees. Delays may occur due to logistics, weather, or other factors outside our control.</li>
              <li>You are responsible for providing an accurate delivery address. We are not liable for items delivered to an incorrect address provided by you.</li>
            </ul>
          </section>

          {/* Stockpile Option */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Stockpile Option</h2>
            <p>
              Our stockpile feature allows you to purchase items and have us hold them for up to 30 days. When you&apos;re ready for delivery, contact us with your Order ID and we&apos;ll arrange shipping (delivery fee applies at that time).
            </p>
            <p>
              Stockpiled items that are not claimed within 30 days may be subject to a storage extension request or forfeiture at our discretion.
            </p>
          </section>

          {/* Returns */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Returns and Refunds</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Returns must be initiated as soon as possible after receiving your order — ideally same day for Abuja customers, or immediately upon receipt for other locations.</li>
              <li>Items must be in original condition: unworn, unwashed, and with tags attached where applicable.</li>
              <li>Return shipping costs are the responsibility of the buyer.</li>
              <li>Once we receive and inspect the returned item, we will issue a refund or store credit within 3–5 business days.</li>
              <li>Items marked &quot;Final Sale&quot;, socks, undergarments, and items that have been worn, washed, or altered are <strong>non-returnable</strong>.</li>
              <li>Exchanges depend on availability since each piece is unique. Where an exchange is not possible, store credit will be issued.</li>
            </ul>
          </section>

          {/* Account */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Your Account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to notify us immediately if you become aware of any unauthorised access to your account.</li>
              <li>We may suspend or terminate your account if we suspect fraudulent activity, abuse, or violation of these Terms.</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Intellectual Property</h2>
            <p>
              All content on this Site — including text, images, logos, product photographs, graphics, and design — is owned by Thrift Collision and protected under Nigerian copyright and intellectual property laws. You may not reproduce, distribute, modify, or use any content from this Site without our written permission.
            </p>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Prohibited Conduct</h2>
            <p>When using our Site, you agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the Site for any unlawful purpose or in violation of Nigerian law.</li>
              <li>Attempt to gain unauthorised access to our systems or other users&apos; accounts.</li>
              <li>Submit false information, including fake orders or fraudulent payment details.</li>
              <li>Interfere with the proper functioning of the Site (e.g. introducing malware, scraping content, or automated bot activity).</li>
              <li>Resell items purchased from Thrift Collision without our consent.</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by Nigerian law, Thrift Collision shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Site or purchase of our products.
            </p>
            <p>
              Our total liability for any claim arising from these Terms or your use of our services shall not exceed the amount you paid for the specific product or order in question.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Disclaimer</h2>
            <p>
              Our Site and products are provided on an &quot;as is&quot; and &quot;as available&quot; basis. While we make every effort to ensure accuracy in product descriptions and images, we do not warrant that the Site will be error-free, uninterrupted, or free from viruses.
            </p>

            <h3 className="text-sm font-bold text-[#1a1a1a] mt-4">Brand Affiliation</h3>
            <p>
              Thrift Collision is not affiliated with any of the designers, brands, or manufacturers whose products appear on our Site. All items sold — even those in new condition or with original tags — are considered pre-owned by their manufacturer and are not covered by any manufacturer warranty.
            </p>
            <p>
              We inspect all items thoroughly for quality and authenticity and would never knowingly list an item as genuine if we had any suspicion otherwise. Although rare, it is possible that something may slip through our inspection process. We are unable to provide the provenance of most items.
            </p>

            <h3 className="text-sm font-bold text-[#1a1a1a] mt-4">Condition of Used Items</h3>
            <p>
              We do our best to select the highest quality items and describe their condition as accurately as possible. However, when buying used items, please understand they may show minor signs of previous wear — including slight odours, loose threads, or missing buttons or clips.
            </p>
            <p>
              We photograph and describe each item&apos;s condition carefully, and items with notable flaws will always be disclosed in the listing. That said, all items are sold in their current condition and may rarely have minor issues that are not immediately visible.
            </p>
            <p>
              We do not cover cleaning costs or repairs. Please understand that thrifted items are pre-owned by nature — that&apos;s part of what makes them unique.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms or your use of the Site shall be resolved through the courts of competent jurisdiction in Abuja, Nigeria.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Changes to These Terms</h2>
            <p>
              We reserve the right to update or modify these Terms at any time. Changes will be posted on this page with an updated &quot;Last updated&quot; date. Continued use of the Site after changes are posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Contact Us</h2>
            <p>If you have questions about these Terms, reach out to us:</p>
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
