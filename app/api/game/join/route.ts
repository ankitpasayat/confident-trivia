import { NextRequest, NextResponse } from 'next/server';
import { joinGameSession } from '@/lib/game-manager';
import { broadcastUpdate } from '../events/route';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      log.error('[JOIN] Invalid JSON in request body');
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }
    const { code, playerName } = body;

    log.info('[JOIN] Join request:', { code, playerName });

    if (!code || !playerName || playerName.trim().length === 0) {
      log.error('[JOIN] Missing code or player name');
      return NextResponse.json(
        { success: false, error: 'Code and player name are required' },
        { status: 400 }
      );
    }

    const result = joinGameSession(code.trim().toUpperCase(), playerName.trim());

    if (!result) {
      log.error(`[JOIN] Failed to join - game not found or already started for code ${code}`);
      return NextResponse.json(
        { success: false, error: 'Game not found or already started' },
        { status: 404 }
      );
    }

    if (result.error) {
      log.error(`[JOIN] Failed to join - ${result.error}`);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    log.info(`[JOIN] Player joined: ${playerName} (${result.playerId}), session: ${result.session.id}, total players: ${result.session.players.length}`);

    // Broadcast player joined
    broadcastUpdate(result.session.id, result.session, 'player-joined');

    return NextResponse.json({
      success: true,
      sessionId: result.session.id,
      playerId: result.playerId,
    });
  } catch (error) {
    log.error('[JOIN] Error joining game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join game' },
      { status: 500 }
    );
  }
}
