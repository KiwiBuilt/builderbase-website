# BUILDER BASE Website

A professional, SEO-optimized marketing website for BUILDER BASE—construction management software for New Zealand builders.

## Overview

BUILDER BASE is an all-in-one construction management platform designed specifically for NZ builders. This website serves as the sales and trial signup platform for the application.

### Features

- **Landing Page**: Compelling hero section with clear value proposition
- **Features Showcase**: Detailed feature cards highlighting core capabilities
- **Pricing Plans**: Three-tier pricing with feature comparisons
- **For Builders Section**: Benefits tailored to construction professionals
- **For Clients Section**: Highlights client portal features
- **Integrations**: Display of third-party integrations (Xero, Stripe, etc.)
- **Trial Signup**: Call-to-action buttons for free trial signup
- **SEO Optimization**: Meta tags, structured data, and content for search engines

## Tech Stack

- **Framework**: Next.js 16+ with TypeScript
- **Styling**: Tailwind CSS
- **Components**: React with Client Components
- **Code Quality**: ESLint, TypeScript strict mode
- **Hosting**: Ready for Vercel or any Node.js host

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with meta tags
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── Footer.tsx          # Footer component
│   └── sections/
│       ├── Hero.tsx        # Hero section
│       ├── Features.tsx    # Features grid
│       ├── ForBuilders.tsx # Builder benefits
│       ├── ForClients.tsx  # Client benefits
│       ├── Pricing.tsx     # Pricing plans
│       ├── Integrations.tsx# Third-party integrations
│       └── CTA.tsx         # Call-to-action section
└── public/                 # Static assets
```

## Customization

### Colors

The BUILDER BASE brand colors are defined in `tailwind.config.ts`:
- Primary: `#EAB308` (Dark Yellow/Gold)
- Accent: `#FDD835` (Light Yellow)

Update these in the `colors.builder` object to change the color scheme throughout the site.

### Content

Edit content in individual component files:
- Homepage features: `src/components/sections/Features.tsx`
- Pricing: `src/components/sections/Pricing.tsx`
- Builder benefits: `src/components/sections/ForBuilders.tsx`

### SEO

Meta tags are configured in `src/app/layout.tsx`. Update:
- `og:url` - Your domain
- `og:image` - Open Graph image
- Analytics ID - Replace `G-XXXXXXXXXX` with your Google Analytics ID

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel
3. Deploy with one click

### Other Platforms

The site works with any Node.js 18+ host:
- AWS, Azure, DigitalOcean, Heroku, Netlify
- Docker-ready (use `npm run build && npm start`)

## Performance Optimizations

- Static page generation where possible
- Image optimization with Next.js Image component
- CSS purging with Tailwind
- Automatic code splitting

## SEO Features

- ✅ Semantic HTML structure
- ✅ Meta tags for preview and sharing
- ✅ Open Graph support
- ✅ Mobile responsive
- ✅ Fast Core Web Vitals
- ✅ Sitemap ready
- ✅ Schema markup ready

## License

MIT License

## Support

For issues or questions about the site, contact the BUILDER BASE team.
