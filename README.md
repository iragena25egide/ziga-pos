# Nexus Sales POS Application

Nexus Sales is a modern Point of Sale (POS) application built with Next.js and Electron. It can run as a web application or as a standalone desktop application.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) & [Base UI](https://base-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Desktop Packaging**: [Electron](https://www.electronjs.org/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs)
- **State Management**: React Hooks & Context

## Getting Started (Web)

Run the development server for the web application:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Desktop App (Electron)

This app can be built and run as a desktop application using Electron.

To run in development mode (starts Next.js on port 3333 and opens Electron):
```bash
npm run desktop:dev
```

To build for production (creates a desktop installer):
```bash
npm run desktop:build
```

### Windows Build
To build specifically for Windows:
```bash
npm run desktop:build:win
```

## Deployment

The web version of this project is configured for deployment on Vercel and Netlify.
