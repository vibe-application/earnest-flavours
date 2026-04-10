# Earnest Flavors

An unofficial flavor explorer for Earnest Ice Cream scoop shops around Vancouver.

This little site shows which flavors are available as scoops, pints, and ice cream sandwiches across Fraser Street, Quebec Street, Frances Street, and North Vancouver. It is fan-made and not affiliated with Earnest Ice Cream.

## Why I Made This

I love ice cream, and I often want to see all the flavors available in the city without opening a separate page for every shop. Sometimes a favorite flavor is worth a longer trip, so I made this site to give fellow ice-cream lovers another way to decide where to go.

It is also my first vibe coding project. The scope felt just right: useful, small enough to understand end to end, and a good way to practice turning a simple everyday itch into a working app.

## Features

- Search flavors by name.
- Filter by serving type: scoop, pint, or sandwich.
- Filter by location.
- Toggle vegan-only flavors.
- Open flavor details with per-store availability.
- Light and dark mode.
- Daily scraper workflow for flavor data updates.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Framer Motion
- Playwright scraper

## Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run test
npm run build
npm run preview
node scripts/scrape-flavors.js
```

Generated flavor data lives in `src/data/flavors.json`. It is produced by `scripts/scrape-flavors.js`, so routine flavor updates should happen through the scraper instead of manual edits.

## Disclaimer

Flavor availability can change throughout the day. Please check with your local Earnest shop for the most current offerings.
