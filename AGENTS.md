# Earnest Ice Cream Flavor Explorer - AGENTS.md

A static website that visualizes Earnest Ice Cream's scoop shop flavors across their 4 Vancouver locations. This is a fan-made, unofficial website that helps customers discover which flavors are available at all stores (core flavors) and which are unique to specific locations.

---

## Project Overview

| Aspect | Details |
|--------|---------|
| **Purpose** | Visualize Earnest Ice Cream flavors across 4 Vancouver locations |
| **Type** | Single-page React application (SPA) |
| **Deployment** | Static site on GitHub Pages |
| **Data Source** | Scraped from earnesticecream.com (auto-updated daily) |

### Store Locations
1. **Fraser Street** - 3992 Fraser St, Vancouver (Original shop, since 2013)
2. **Quebec Street** - 1829 Quebec St, Vancouver (Olympic Village area)
3. **Frances Street** - 1485 Frances St, Vancouver (Production facility, take-away only)
4. **North Vancouver** - 127 W 1st St, North Vancouver (Lower Lonsdale)

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 + TypeScript 5.9 |
| **Build Tool** | Vite 7.2 |
| **Styling** | Tailwind CSS 3.4 |
| **UI Components** | shadcn/ui (40+ components) |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |
| **Web Scraping** | Playwright |

---

## Directory Structure

```
/Users/kavan/Workspace/llm-projects/ernest-filter/
├── AGENTS.md                    # This file
├── docs/
│   └── prd.md                   # Product Requirements Document
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS theme config
├── components.json              # shadcn/ui configuration
├── eslint.config.js             # ESLint configuration
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # App TypeScript config
├── tsconfig.node.json           # Node TypeScript config
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component
│   ├── index.css                # Global styles + CSS variables
│   ├── App.css                  # App-specific styles
│   ├── data/
│   │   ├── flavors.ts           # Flavor data with store availability
│   │   └── stores.ts            # Store information
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (40+)
│   │   └── custom/              # Custom components
│   │       ├── Navigation.tsx
│   │       ├── FlavorCard.tsx
│   │       ├── FlavorDetailPanel.tsx
│   │       ├── StoreDetailPanel.tsx
│   │       └── SearchFilterBar.tsx
│   ├── sections/
│   │   ├── CoreFlavors.tsx      # Main flavor grid section
│   │   └── Footer.tsx
│   ├── hooks/
│   │   ├── useTheme.ts          # Dark/light mode hook
│   │   └── use-mobile.ts        # Mobile detection hook
│   └── lib/
│       └── utils.ts             # cn() utility for Tailwind
├── scripts/
│   └── scrape-flavors.js        # Playwright scraper for flavor data
└── .github/workflows/
    └── update-flavors.yml       # Daily automation workflow
```

---

## Build and Development Commands

All commands run from the repository root:

```bash
# Install dependencies
npm install

# Start development server (Vite dev server)
npm run dev

# Build for production (includes type checking)
npm run build

# Preview production build locally
npm run preview

# Run linting
npm run lint

# Run tests (placeholder - currently just type checking)
npm run test
```

### Build Process
1. Runs `npm test` (TypeScript type checking)
2. Compiles TypeScript (`tsc -b`)
3. Bundles with Vite into `dist/` folder
4. Output is configured for static hosting with relative paths (`base: './'`)

---

## Data Architecture

### Flavor Data Structure
```typescript
interface Flavor {
  id: string;              // URL-friendly slug (e.g., "whiskey-hazelnut")
  name: string;            // Display name
  isVegan: boolean;        // Vegan indicator
  scoopStores: StoreId[];  // Stores with scoop availability
  pintStores: StoreId[];   // Stores with pint availability
  description: string;     // Flavor description
}
```

**Important:** Scoop and pint availability can differ! A flavor may be available as a scoop at one location but only as a pint at another.

### Store Data Structure
```typescript
interface Store {
  id: StoreId;           // 'fraser' | 'quebec' | 'frances' | 'northvan'
  name: string;          // Full display name
  shortName: string;     // Abbreviated name for badges
  address: string;
  phone: string;
  hours: string;
  description: string;
  color: string;         // Tailwind text color class
  bgColor: string;       // Tailwind bg color class
}
```

### Helper Functions (in `src/data/flavors.ts`)
- `isSandwich(flavor)` - Check if item is a pre-made sandwich
- `isScoopAtAllStores(flavor)` - Check if available as scoop everywhere
- `isPintAtAllStores(flavor)` - Check if available as pint everywhere
- `getIceCreamFlavors()` - Get only ice cream items
- `getSandwiches()` - Get only sandwich items
- `getScoopsByStore(storeId)` - Get scoops at specific store
- `getPintsByStore(storeId)` - Get pints at specific store
- `getVeganFlavors()` - Filter vegan options
- `searchFlavors(query)` - Search by name

---

## Automated Data Updates

The project includes an automated GitHub Actions workflow that scrapes flavor data daily:

### Workflow: `.github/workflows/update-flavors.yml`

**Trigger:**
- Scheduled: Daily at 6:00 AM UTC (10:00 PM PST)
- Manual: Can be triggered manually via workflow_dispatch

**Process:**
1. Checkout repository
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Install Playwright Chromium
5. Run scraper (`node scripts/scrape-flavors.js`)
6. Check if `src/data/flavors.ts` changed
7. If changed: commit, push, build, and deploy to GitHub Pages

### Scraper: `scripts/scrape-flavors.js`

Uses Playwright to scrape each store page:
- Visits all 4 store location pages
- Extracts flavors from "Scoops", "Pints", and "Sandwiches" tabs
- Builds unified flavor list with store availability
- Generates TypeScript file at `src/data/flavors.ts`

---

## UI/UX Conventions

### Color Scheme: "Marshmallow & Cereal"
- **Primary**: Soft pink (`#E8B4B8`) - marshmallow pink
- **Secondary**: Cream (`#F9E4B7`) - cereal/cream tones
- **Background**: Warm off-white
- **Dark mode**: Warm dark browns

### Store Colors
- Fraser St: Soft pink (`#FFB5BA`)
- Quebec St: Soft blue (`#B8D4E3`)
- Frances St: Warm beige (`#E8D5B7`)
- North Van: Soft green (`#C9E4CA`)

### Typography
- **Headings**: Quicksand (weights: 500, 600, 700)
- **Body**: Nunito (weights: 400, 500, 600, 700)

### Component Patterns
- Use `cn()` utility from `@/lib/utils` for conditional Tailwind classes
- Cards have `rounded-2xl` border radius
- Shadows use custom `shadow-soft` and `shadow-soft-lg`
- Animations via Framer Motion with `layout` prop for smooth reordering

---

## Code Style Guidelines

### TypeScript
- Strict mode enabled
- Use explicit return types for exported functions
- Prefer `type` over `interface` for simple type aliases
- Store IDs use union type: `'fraser' | 'quebec' | 'frances' | 'northvan'`

### React
- Functional components with hooks
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations (filtering, sorting)
- Theme state persisted in localStorage

### Tailwind
- Custom CSS variables defined in `index.css` for theming
- Custom animations in `tailwind.config.js`
- Responsive breakpoints: `sm:`, `lg:`, `xl:`
- Use `@apply` in CSS for reusable utilities

### File Organization
- Components: `src/components/ui/` (shadcn), `src/components/custom/` (app-specific)
- Sections: `src/sections/` (page-level sections)
- Data: `src/data/` (flavors, stores)
- Hooks: `src/hooks/` (reusable logic)
- Utils: `src/lib/` (helper functions)

---

## Testing Strategy

Currently minimal testing:
- Unit tests cover generated flavor data, visualization logic, and scraper parsing
- TypeScript type checking acts as build-time validation
- ESLint for code quality
- No E2E tests currently implemented

---

## Deployment

### GitHub Pages
- Built files output to `dist/` directory
- Deployed via `peaceiris/actions-gh-pages@v3`
- Requires `GITHUB_TOKEN` secret
- Site URL: (configured in GitHub repository settings)

### Manual Deployment
```bash
npm run build
# Deploy dist/ folder to static hosting
```

---

## Important Notes for AI Agents

1. **Data is auto-generated**: Do not manually edit `src/data/flavors.ts` - it will be overwritten by the scraper.

2. **Store availability varies**: A flavor can be available as scoop at some stores but pint-only at others. Always check both `scoopStores` and `pintStores` arrays.

3. **Sandwiches are separate**: Pre-made ice cream sandwiches have different availability than scoops/pints. They appear at the end of the flavor list.

4. **Theme handling**: The app supports light/dark mode. Use CSS variables (e.g., `bg-background`, `text-foreground`) for colors, not hardcoded values.

5. **Vegan indicator**: Look for `isVegan` boolean on flavor objects. Display with green leaf icon.

6. **Scraper descriptions**: Flavor descriptions are hardcoded in `scripts/scrape-flavors.js` since they're not available on the website being scraped.

7. **No backend**: This is a purely static site. All data is bundled at build time.

---

## External Dependencies

- **Data Source**: https://earnesticecream.com (scraped daily)
- **Fonts**: Google Fonts (Quicksand, Nunito)
- **Icons**: Lucide React

---

## License & Disclaimer

This is an **unofficial fan-made website** and is **not affiliated with Earnest Ice Cream**. Data is sourced from their public website for informational purposes.
