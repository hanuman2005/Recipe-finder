import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-primary-500 mb-4">
              🍽️ SPICE SCOOP
            </h3>
            <p className="text-neutral-400">
              Discover authentic recipes from every corner of India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <Link to="/" className="hover:text-primary-500">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-primary-500">
                  Search
                </Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-primary-500">
                  Upload
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-bold mb-4">About</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <a href="#" className="hover:text-primary-500">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-500">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-500">
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <div className="flex gap-4 text-neutral-400">
              <a href="#" className="hover:text-primary-500">
                Twitter
              </a>
              <a href="#" className="hover:text-primary-500">
                Instagram
              </a>
              <a href="#" className="hover:text-primary-500">
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-700 pt-8 text-center text-neutral-400">
          <p>&copy; 2026 Spice Scoop. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
