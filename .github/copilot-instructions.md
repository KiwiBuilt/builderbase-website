# BUILDER BASE Website - Development Guidelines

## Project Overview

This is a professional, SEO-optimized marketing website for BUILDER BASE—construction management software for New Zealand builders.

## Architecture

- **Framework**: Next.js 16+ with App Router
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **Components**: TypeScript React components
- **Build Tool**: Turbopack

## Key Technologies

- Next.js 16.2.0
- React 19
- TypeScript 5
- Tailwind CSS 4
- PostCSS & Autoprefixer

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout with SEO meta tags
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles with Tailwind & custom colors
├── components/
│   ├── Header.tsx        # Navigation header
│   ├── Footer.tsx        # Footer
│   └── sections/         # Page sections
└── public/               # Static assets
```

## Development Workflow

1. **Install dependencies**: `npm install`
2. **Start dev server**: `npm run dev`
3. **Build production**: `npm run build`
4. **Start production build**: `npm start`
5. **Lint code**: `npm run lint`

## Color System

The site uses custom CSS variables defined in `src/app/globals.css`:

- `--color-builder-primary`: #EAB308 (Dark Yellow/Gold)
- `--color-builder-accent`: #FDD835 (Light Yellow)
- `--color-builder-dark`: #1a1a1a
- `--color-builder-light`: #f5f5f5

Use `style={{ color: 'var(--color-builder-primary)' }}` for inline styles with these colors.

## Available Utility Classes

- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button
- `.btn-outline` - Outlined button
- `.section-title` - Large section heading
- `.section-subtitle` - Section subtitle
- `.container-custom` - Responsive container with max-width
- `.animate-slide-up` - Slide up animation
- `.animate-fade-in` - Fade in animation

## Important Notes

- Custom Tailwind color classes like `text-builder-primary` don't work due to Tailwind v4 changes
- Use inline `style` props with CSS variables instead: `style={{ color: 'var(--color-builder-primary)' }}`
- SEO meta tags are in `src/app/layout.tsx` - update for production domain
- Replace Google Analytics ID `G-XXXXXXXXXX` with actual tracking ID
- Update Open Graph image path from `/og-image.png` to actual image

## Component Guidelines

1. Use TypeScript for type safety
2. Keep components focused and single-responsibility
3. Use React hooks appropriately
4. Add 'use client' directive for interactive components
5. Include semantic HTML for accessibility

## Building & Deployment

- **Local Development**: `npm run dev` → http://localhost:3000
- **Production Build**: `npm run build && npm start`
- **Vercel Deployment**: Push to GitHub, connect to Vercel for auto-deployment
- **Other Hosts**: Requires Node.js 18+, can be Dockerized

## SEO Checklist

- ✅ Meta tags configured in layout.tsx
- ✅ Open Graph tags for social sharing
- ⚠️ Update domain from localhost in metadata
- ⚠️ Add Google Analytics tracking ID
- ⚠️ Create sitemap.xml
- ⚠️ Create robots.txt

## Common Tasks

### Adding a New Section

1. Create component in `src/components/sections/SectionName.tsx`
2. Import in `src/app/page.tsx`
3. Add to main export

### Updating Branding Colors

Edit CSS variables in `src/app/globals.css`:
```css
:root {
  --color-builder-primary: #new-color;
  --color-builder-accent: #new-color;
}
```

### Customizing Fonts

Font imports in `src/app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=...');
```

## Troubleshooting

### Build Errors with Custom Classes
- Use inline `style` with CSS variables instead of Tailwind classes
- Example: `style={{ backgroundColor: 'var(--color-builder-primary)' }}`

### TypeScript Errors
- Ensure types are properly imported
- Check `tsconfig.json` for path aliases
- Use `React.CSSProperties` type for style objects

## Production Checklist

- [ ] Update domain in metadata
- [ ] Set Google Analytics ID
- [ ] Replace placeholder images
- [ ] Update social links
- [ ] Configure error tracking
- [ ] Set up email functionality
- [ ] Test on multiple devices
- [ ] Run lighthouse audit

## Support & Maintenance

For issues or improvements:
1. Create detailed bug reports with reproduction steps
2. Document new components thoroughly
3. Keep dependencies updated quarterly
4. Monitor Lighthouse scores regularly
