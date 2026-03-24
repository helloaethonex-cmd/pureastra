import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <>

      <section className="bg-[#FAF3E2] px-6 md:px-16 py-16 text-[#3B2F2F]">
        <h1 className="text-3xl md:text-4xl font-['Marko_One',serif] text-center mb-10 text-[#9E6E5B]">
          Privacy Policies
        </h1>

        <div className="max-w-4xl mx-auto space-y-6 text-sm leading-7">

          <div>
            <h2 className="font-semibold text-lg">1. Privacy Policy</h2>
            <p>
              We value your privacy. All personal information provided during order placement is securely stored and used only for order processing, communication, marketing (if opted-in), and service improvement. We do not share your information with unauthorized third parties.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-lg">2. Shipping Policy</h2>
            <p>Orders are processed within 1–2 business days after payment confirmation.
                Delivery usually takes 5–7 business days, depending on location and courier service.
                We collaborate with regional courier partners such as Blue Dart, Delhivery, and other reliable regional agencies.
                Tracking information will be provided once the order is dispatched.
                Customers are responsible for providing accurate delivery addresses. Any delays due to incorrect addresses are not our liability.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-lg">3. Cancellation Policy</h2>
            <p>Once an order is placed, cancellation is not allowed. Please review your order carefully before confirming.</p>
          </div>

          <div>
            <h2 className="font-semibold text-lg">4. Returns & Replacement Policy</h2>
            <p>Only damaged or defective products are eligible for replacement.
                Customers must provide proof of damage (video or photo) via WhatsApp within 48 hours of delivery.
                Verified damaged products will be replaced within 7–14 days.
                Replacements will match the original product specifications.
                No refunds or money returns are provided; replacements are the only solution for damaged items.
                Any damage caused by mishandling after delivery will not be eligible for replacement.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-lg">5. Payment Policy</h2>
            <p>Online Payments Only: All orders must be paid through our secure online payment system. We do not accept cash, cheque, or offline payments.
                Payment Methods: Credit/debit cards, UPI, net banking, or digital wallets available on the checkout page.
                Final Payment: Once payment is made, it is final. No cancellations or refunds are allowed, except for verified damaged products.
                Payment Confirmation: Customers will receive an instant confirmation after successful payment along with the order summary and invoice.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-lg">6. Product Quality</h2>
            <p>Our skincare products are manufactured to high-quality standards.
                Minor variations in color, texture, or packaging due to natural ingredients or production processes are normal and not considered defects.
                We are not liable for issues arising naturally from the products or from third-party websites.</p>
          </div>

          <div>
            <h2 className="font-semibold text-lg">7. Customer Responsibility</h2>
            <p>Please check your product carefully upon delivery.
                Report any damages immediately via WhatsApp or customer support. Delayed complaints or damages caused after use are not eligible for replacement.
                Ensure that you follow usage instructions provided with each product. Improper use may affect product performance and is not covered under replacement policy.
                </p>
          </div>

          <div>
            <h2 className="font-semibold text-lg">8. Limitations & Liability</h2>
            <p>We are not responsible for courier delays caused by weather, natural disasters, strikes, or other third-party issues.
                Our liability is limited to replacing damaged or defective products. We are not responsible for indirect losses or damages.
                Any product purchased for resale or commercial purposes is done at the customer’s responsibility.
                </p>
          </div>

          <div>
            <h2 className="font-semibold text-lg">9. Bulk Orders & Special Kits (Optional)</h2>
            <p>For bulk or combo orders, replacements and shipping policies apply to the entire order.
            Discounts or special offers on bulk purchases are subject to terms mentioned at the time of purchase.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-lg">10. Official Sales Channel</h2>
            <p>Our products are exclusively available on our official website. We do not sell through any marketplace, third-party manufacturer, or other websites. Any product purchased elsewhere is not authorized by us and may be counterfeit</p>
          </div>

        </div>
      </section>

    </>
  );
}