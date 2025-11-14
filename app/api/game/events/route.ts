import { NextRequest } from 'next/server';
import { getSession, updatePlayerConnection } from '@/lib/game-manager';
import { log } from '@/lib/logger';

// SSE connections storage
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');
  const playerId = searchParams.get('playerId');

  log.info('[SSE] New connection request:', { sessionId, playerId });

  if (!sessionId || !playerId) {
    log.error('[SSE] Missing parameters');
    return new Response('Missing sessionId or playerId', { status: 400 });
  }

  const encoder = new TextEncoder();

  // Create a new ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the set
      if (!connections.has(sessionId)) {
        connections.set(sessionId, new Set());
      }
      connections.get(sessionId)!.add(controller);
      log.info(`[SSE] Connection opened for player ${playerId}, total connections: ${connections.get(sessionId)!.size}`);

      // Update player connection status
      updatePlayerConnection(sessionId, playerId, true);

      // Send initial session state
      const session = getSession(sessionId);
      if (session) {
        log.info(`[SSE] Sending initial state to ${playerId}, phase: ${session.currentPhase}`);
        const data = JSON.stringify({ type: 'init', session, timestamp: Date.now() });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      } else {
        log.warn(`[SSE] No session found for ${sessionId}`);
      }

      // Send heartbeat every 15 seconds (keep connection alive)
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (error) {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        log.info(`[SSE] Connection closed for player ${playerId}`);
        clearInterval(heartbeatInterval);
        const sessionConnections = connections.get(sessionId);
        if (sessionConnections) {
          sessionConnections.delete(controller);
          log.info(`[SSE] Remaining connections: ${sessionConnections.size}`);
          if (sessionConnections.size === 0) {
            connections.delete(sessionId);
            log.info(`[SSE] No more connections for session ${sessionId}`);
          }
        }
        updatePlayerConnection(sessionId, playerId, false);
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Broadcast updates to all connected clients for a session
export function broadcastUpdate(sessionId: string, session: any, eventType: string) {
  const sessionConnections = connections.get(sessionId);
  if (!sessionConnections || sessionConnections.size === 0) {
    log.info(`[SSE] No connections to broadcast ${eventType} for session ${sessionId}`);
    return;
  }

  log.info(`[SSE] Broadcasting ${eventType} to ${sessionConnections.size} clients, phase: ${session.currentPhase}`);
  const encoder = new TextEncoder();
  const data = JSON.stringify({ type: eventType, session, timestamp: Date.now() });
  const message = encoder.encode(`data: ${data}\n\n`);

  // Send to all connected clients
  let successCount = 0;
  sessionConnections.forEach(controller => {
    try {
      controller.enqueue(message);
      successCount++;
    } catch (error) {
      log.error(`[SSE] Failed to send to client:`, error);
      // Client disconnected, remove from set
      sessionConnections.delete(controller);
    }
  });
  log.info(`[SSE] Broadcast complete: ${successCount}/${sessionConnections.size} clients`);
}
