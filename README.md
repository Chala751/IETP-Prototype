# IoT-Based Light Intensity Monitoring and Smart Control System

<p align="center">
  <img src="/public/logo.png" alt="IETP Logo" width="120" />
</p>

A web-based IoT dashboard for monitoring ambient light intensity, visualizing trends, and controlling thresholds in real time.

## Highlights

- Real-time light intensity monitoring with live status indicators
- Threshold control with instant backend updates
- Analytics dashboard with charts, trends, and history
- Light and dark theme support
- Mobile-friendly, responsive layout

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- MongoDB

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Project Structure

```
app/
  api/
    auth/
    light/
      history/
  components/
  light/
  layout.tsx
  page.tsx
lib/
  auth.ts
  mongodb.ts
public/
  logo.png
```

## Deployment

Live demo: https://ietp-prototype.vercel.app/

## License

MIT
