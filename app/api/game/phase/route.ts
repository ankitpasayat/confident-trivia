import { NextRequest, NextResponse } from 'next/server';
import { changePhase, processRoundResults, nextRound } from '@/lib/game-manager';
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
      log.error('[PHASE] Invalid JSON in request body');
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }
    const { sessionId, phase } = body;

    log.info('[PHASE] Phase change request:', { sessionId, phase });

    if (!sessionId || !phase) {
      log.error('[PHASE] Missing session ID or phase');
      return NextResponse.json(
        { success: false, error: 'Session ID and phase are required' },
        { status: 400 }
      );
    }

    let session;

    // Handle special phase transitions
    if (phase === 'voting') {
      log.info('[PHASE] Starting voting phase');
      session = changePhase(sessionId, 'voting');
    } else if (phase === 'reveal') {
      log.info('[PHASE] Processing round results');
      session = processRoundResults(sessionId);
    } else if (phase === 'question') {
      log.info('[PHASE] Moving to next round');
      session = nextRound(sessionId);
    } else {
      log.info(`[PHASE] Changing to phase: ${phase}`);
      session = changePhase(sessionId, phase);
    }

    if (!session) {
      log.error(`[PHASE] Failed to change phase to ${phase}`);
      return NextResponse.json(
        { success: false, error: 'Failed to change phase' },
        { status: 400 }
      );
    }

    log.info(`[PHASE] Phase changed successfully: ${session.currentPhase}, round: ${session.currentRound}/${session.totalRounds}`);

    // Broadcast phase change
    broadcastUpdate(session.id, session, `phase-${phase}`);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    log.error('[PHASE] Error changing phase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change phase' },
      { status: 500 }
    );
  }
}
