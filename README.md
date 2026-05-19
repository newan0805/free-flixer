This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Watch Together Realtime

The Watch Together room no longer depends on raw WebSockets. On Vercel, chat and playback sync now use stateless HTTP requests backed by a shared KV store:

- clients `POST` room actions such as join, chat messages, state changes, and sync-play events
- clients `GET` room updates on a short polling interval for near-realtime fanout
- Vercel KV or Upstash Redis stores room presence, the latest playback state, and recent events

This works on Vercel because the app no longer needs a long-lived server process to keep room state in memory.

### Required environment variables

Set one of these supported KV pairs in Vercel for production Watch Together rooms:

```bash
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

or

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Local development falls back to an in-memory store automatically, so `yarn dev` still works without KV.
