# Question Distribution Analysis

This directory contains tools to test whether AI-generated questions have proper type distribution.

## The Problem

The game targets this question distribution:
- **40%** Multiple Choice
- **25%** True/False  
- **30%** More or Less
- **5%** Numerical

## Quick Start

### Run the Analysis

```bash
# Standard analysis (3 batches, summary only)
npm run analyze-questions

# Quick check (1 batch with all questions shown)
npm run analyze-questions -- --once

# Show all questions for 3 batches
npm run analyze-questions -- --show

# Custom number of batches
npm run analyze-questions -- --batches 5
```

**No setup needed!** The script automatically loads your API key from `.env.local` or `.env`.

### Example Output

```
┌─────────────────┬────────┬──────────┬──────────┬────────────┐
│ Question Type   │ Count  │ Actual % │ Target % │ Deviation  │
├─────────────────┼────────┼──────────┼──────────┼────────────┤
│ multiple-choice │     85 │   42.5% │     40% │     +2.5% │
│ true-false      │     48 │   24.0% │     25% │     -1.0% │
│ more-or-less    │     60 │   30.0% │     30% │     +0.0% │ ← Perfect!
│ numerical       │      7 │    3.5% │      5% │     -1.5% │
└─────────────────┴────────┴──────────┴──────────┴────────────┘
```

## Command Options

| Command | Description |
|---------|-------------|
| `npm run analyze-questions` | Run 3 batches, show summary only |
| `npm run analyze-questions -- --once` | Run 1 batch, show all questions |
| `npm run analyze-questions -- --show` | Run 3 batches, show all questions |
| `npm run analyze-questions -- --batches N` | Run N batches |

## Prerequisites

You need an API key in your `.env.local` or `.env` file:

```bash
# Option 1: Google Gemini (FREE - recommended)
GOOGLE_API_KEY=your_key_here

# Option 2: OpenAI (Paid but cheap)
OPENAI_API_KEY=your_key_here
```

Get a free Gemini key at: https://aistudio.google.com/app/apikey

## Interpreting Results

### ✅ Good Distribution
All types within ±10% of target is acceptable due to AI variability.

### ⚠️ Warning Signs
- More-or-less below 20% (target is 30%)
- Multiple-choice above 50% (target is 40%)
- Any type completely missing

### 🔧 If Issues Found

If more-or-less is consistently underrepresented:

1. **Check the AI prompt** - Ensure it clearly specifies the count for each type
2. **Increase the prompt emphasis** - Add stronger language about generating exact counts
3. **Post-process filtering** - Add code to verify distribution and regenerate if needed
4. **Manual balancing** - Mix AI questions with curated more-or-less questions

## How It Works

The script:
1. Calls the AI question generator multiple times
2. Counts how many questions of each type are generated
3. Calculates percentages and compares to targets
4. Identifies significant deviations (>10%)

The AI is **instructed** to generate questions in the target ratio, but it may not always comply perfectly due to:
- AI interpretation of the prompt
- Difficulty generating certain question types
- Randomness in AI responses

## Files

- `analyze-question-distribution.ts` - Analysis script
- `README.md` - This file
