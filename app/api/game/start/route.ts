import { NextRequest, NextResponse } from 'next/server';
import { startGame } from '@/lib/game-manager';
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
      log.error('[START] Invalid JSON in request body');
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }
    const { sessionId } = body;

    log.info('[START] Start game request:', { sessionId });

    if (!sessionId) {
      log.error('[START] Missing session ID');
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await startGame(sessionId);

    if (!session) {
      log.error(`[START] Cannot start game ${sessionId} - need at least 2 players`);
      return NextResponse.json(
        { success: false, error: 'Cannot start game - need at least 2 players' },
        { status: 400 }
      );
    }

    log.info(`[START] Game started: ${session.id}, players: ${session.players.length}, phase: ${session.currentPhase}`);

    // Broadcast game started
    broadcastUpdate(session.id, session, 'game-started');

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    log.error('[START] Error starting game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start game' },
      { status: 500 }
    );
  }
}
