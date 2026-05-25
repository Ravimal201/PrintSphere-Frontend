import { Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t p-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/images/Logo.png" alt="NOWIX" className="w-28" />
          </div>
          <p className="text-gray-500">
            NOVIX is your ultimate platform to design, customize and order high-quality custom T-shirts.
          </p>

          <div className="flex items-center gap-3">
            <a href="#" aria-label="facebook" title="Facebook" className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.1c0-2.4 1.4-3.8 3.6-3.8 1 0 2 .1 2 .1v2.2h-1.1c-1.1 0-1.4.7-1.4 1.4v1.7H18l-.5 3h-2v7A10 10 0 0 0 22 12z"/></svg>
            </a>
            <a href="#" aria-label="instagram" title="Instagram" className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.5A4.5 4.5 0 1 0 16.5 13 4.5 4.5 0 0 0 12 8.5zm5.2-3.6a1.2 1.2 0 1 0 1.2 1.2 1.2 1.2 0 0 0-1.2-1.2z"/></svg>
            </a>
            <a href="#" aria-label="twitter" title="Twitter" className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M22 5.9c-.6.3-1.2.5-1.9.6a3.3 3.3 0 0 0-5.6 2.3c0 .3 0 .6.1.9A9.4 9.4 0 0 1 3 4.6a3.2 3.2 0 0 0-.4 1.7 3.3 3.3 0 0 0 1.5 2.7c-.5 0-1-.2-1.4-.4v.1a3.3 3.3 0 0 0 2.6 3.2c-.4.1-.8.2-1.2.2-.3 0-.6 0-.9-.1a3.3 3.3 0 0 0 3.1 2.3 6.7 6.7 0 0 1-4.1 1.4c-.3 0-.6 0-.9-.1A9.4 9.4 0 0 0 12 21c6.1 0 9.4-5 9.4-9.4v-.4c.6-.4 1.1-1 1.5-1.7-.6.3-1.2.5-1.9.6z"/></svg>
            </a>
            <a href="#" aria-label="youtube" title="YouTube" className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M23 7s-.2-1.7-.8-2.4c-.8-.9-1.7-.9-2.1-1C16.8 3 12 3 12 3s-4.8 0-7.9.6c-.4 0-1.3 0-2.1 1C1.2 5.3 1 7 1 7S1 8.7 1.1 10.4c.1 1.3.6 2.5 1.3 3.2.8.9 1.8.9 2.3 1 1.7.3 7.3.6 7.3.6s4.8 0 7.9-.6c.4 0 1.3 0 2.1-1 .6-.6.8-1.9.9-3.2C23 8.7 23 7 23 7zM10 15V9l5 3-5 3z"/></svg>
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">SHOP</h3>
          <ul className="space-y-2 text-gray-600">
            <li><a href="#">All Products</a></li>
            <li><a href="#">T-shirts</a></li>
            <li><a href="#">Hoodies</a></li>
            <li><a href="#">Accessories</a></li>
            <li><a href="#">Gift Cards</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">COMPANY</h3>
          <ul className="space-y-2 text-gray-600">
            <li><a href="#">About Us</a></li>
            <li><a href="#">How It Works</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">NEWSLETTER</h3>
          <p className="text-gray-500 text-sm mb-3">Subscribe to get updates and exclusive offers.</p>
          <form className="flex items-center gap-2">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-2 rounded-xl border border-gray-200" />
            <button type="submit" className="inline-flex items-center justify-center bg-indigo-600 text-white rounded-xl px-3 py-2 hover:bg-indigo-700">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

      <div className="mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-500">© 2026 NOVIX. All rights reserved.</div>

        <div className="flex items-center gap-3">
          <a href="#" target="_blank" rel="noopener noreferrer" className="block">
            <img src="/images/payments/visa.svg" alt="Visa" className="h-6 w-auto" />
          </a>

          <a href="#" target="_blank" rel="noopener noreferrer" className="block">
            <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-6 w-auto" />
          </a>

          <a href="#" target="_blank" rel="noopener noreferrer" className="block">
            <img src="/images/payments/paypal.svg" alt="PayPal" className="h-6 w-auto" />
          </a>

          <a href="#" target="_blank" rel="noopener noreferrer" className="block">
            <img src="/images/payments/applepay.svg" alt="Apple Pay" className="h-6 w-auto" />
          </a>
        </div>
      </div>
    </footer>
  );
}