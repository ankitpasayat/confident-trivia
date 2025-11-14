import { NextRequest, NextResponse } from 'next/server';
import { createGameSession } from '@/lib/game-manager';
import { broadcastUpdate } from '../events/route';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      log.error('[CREATE] Invalid JSON in request body');
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }
    const { hostName } = body;

    log.info('[CREATE] New game request:', { hostName });

    if (!hostName || hostName.trim().length === 0) {
      log.error('[CREATE] Missing host name');
      return NextResponse.json(
        { success: false, error: 'Host name is required' },
        { status: 400 }
      );
    }

    const { session, hostId, code } = createGameSession(hostName.trim());
    log.info(`[CREATE] Session created: ${session.id}, code: ${code}, host: ${hostId}`);

    // Broadcast initial session state
    broadcastUpdate(session.id, session, 'game-created');

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      code,
      hostId,
    });
  } catch (error) {
    log.error('[CREATE] Error creating game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create game' },
      { status: 500 }
    );
  }
}
