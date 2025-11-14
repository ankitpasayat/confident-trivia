import { NextRequest, NextResponse } from 'next/server';
import { submitVote } from '@/lib/game-manager';
import { broadcastUpdate } from '../events/route';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      log.error('[VOTE] Invalid JSON in request body');
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }
    const { sessionId, playerId, answer, token } = body;

    log.info('[VOTE] Request:', { sessionId, playerId, answer, token });

    if (!sessionId || !playerId || answer === undefined || !token) {
      log.error('[VOTE] Missing fields:', { sessionId, playerId, answer, token });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = submitVote(sessionId, playerId, answer, token);

    if (!session) {
      log.error('[VOTE] Invalid vote or game state');
      return NextResponse.json(
        { success: false, error: 'Invalid vote or game state' },
        { status: 400 }
      );
    }

    log.info('[VOTE] Success, broadcasting update');
    // Broadcast vote submitted
    broadcastUpdate(session.id, session, 'vote-submitted');

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    log.error('[VOTE] Error submitting vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}
