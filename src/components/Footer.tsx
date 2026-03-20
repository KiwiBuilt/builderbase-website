'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info with Logo */}
          <div>
            <Image
              src="/builderbase_logo.png"
              alt="BUILDER BASE"
              width={80}
              height={80}
              className="h-16 w-auto mb-4"
            />
            <p className="text-sm text-gray-400 mb-4">
              Construction management software built for New Zealand builders.
            </p>
            <div className="flex gap-4 text-sm">
              <a href="https://www.facebook.com/profile.php?id=61585309743900" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">
                Facebook
              </a>
              <a href="https://www.instagram.com/builderbasehq?igsh=eHpsejI1bmNvb3Qy" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">
                Instagram
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#features" className="hover:text-yellow-500 transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-yellow-500 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://app.kiwi-built.nz/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">Privacy Policy</a></li>
              <li><a href="https://app.kiwi-built.nz/terms" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors">Terms of Service</a></li>
              <li><a href="mailto:office@builderbase.co.nz" className="hover:text-yellow-500 transition-colors">Contact</a></li>
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
