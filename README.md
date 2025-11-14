# Confident Trivia

A real-time multiplayer trivia game where players bet tokens (1-10) on their answers based on confidence.

## Features

- **Real-time multiplayer** - 2-6 players using simple 4-letter game codes
- **Confidence-based betting** - Strategic token management
- **AI-Generated Questions** - Fresh trivia content every game using Google Gemini or GPT-4o-mini
- **Mobile-friendly** - Optimized for phones and tablets
- **No database required** - In-memory sessions for quick games

## Quick Start

```bash
# Install dependencies
npm install

# Optional: Set up FREE AI questions (Google Gemini)
cp .env.example .env.local
# Get FREE key: https://aistudio.google.com/app/apikey
# Edit .env.local and add: GOOGLE_API_KEY=your-key-here

# Run dev server
npm run dev
```

Visit `http://localhost:3000` to play.

### AI Questions (Optional)

Get fresh, AI-generated questions every game for FREE using Google Gemini:

1. Get FREE API key: https://aistudio.google.com/app/apikey (no credit card needed)
2. Add to `.env.local`: `GOOGLE_API_KEY=your-key-here`
3. Restart dev server

Without an API key, uses built-in fallback questions.

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
