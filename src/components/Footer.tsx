'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">BUILDER BASE</h3>
            <p className="text-sm text-gray-400 mb-4">
              Construction management software built for New Zealand builders.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-builder-primary transition-colors">
                Facebook
              </a>
              <a href="#" className="hover:text-builder-primary transition-colors">
                LinkedIn
              </a>
              <a href="#" className="hover:text-builder-primary transition-colors">
                Twitter
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#features" className="hover:text-builder-primary transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-builder-primary transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-builder-primary transition-colors">Security</Link></li>
              <li><Link href="#" className="hover:text-builder-primary transition-colors">Integrations</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-builder-primary transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-builder-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-builder-primary transition-colors">API Docs</Link></li>
              <li><Link href="#" className="hover:text-builder-primary transition-colors">Status</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-builder-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-builder-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-builder-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} BUILDER BASE. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">
              Made for New Zealand builders
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
