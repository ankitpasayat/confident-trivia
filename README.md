# Confident Trivia

A real-time multiplayer trivia game where players bet tokens (1-10) on their answers based on confidence.

## Features

- **Real-time multiplayer** - 2-6 players using simple 4-letter game codes
- **Confidence-based betting** - Strategic token management
- **Mobile-friendly** - Optimized for phones and tablets
- **No database required** - In-memory sessions for quick games

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to play.

## How to Play

1. **Host** creates a game and shares the 4-letter code
2. **Players** join using the code on their devices
3. **10 rounds** of trivia questions with multiple choice answers
4. Each round:
   - Answer the question (A/B/C/D)
   - Bet a token (1-10) based on your confidence
   - Correct answers keep your token points
   - Wrong answers lose the token
5. **Highest score** after 10 rounds wins

See [RULES.md](RULES.md) for complete game rules.

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- Server-Sent Events for real-time updates

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

Or push to GitHub and connect to Vercel for automatic deployments.

## Development

```bash
# Run dev server
npm run dev

# Run tests
npm test

# Run e2e tests
npm run test:e2e

# Build for production
npm run build
```

## License

MIT
