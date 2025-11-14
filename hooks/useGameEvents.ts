import { useEffect, useState, useCallback, useRef } from 'react';
import { GameSession } from '@/types/game';

interface UseGameEventsOptions {
  sessionId: string;
  playerId: string;
  onUpdate?: (session: GameSession) => void;
}

export function useGameEvents({ sessionId, playerId, onUpdate }: UseGameEventsOptions) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 10;
  const onUpdateRef = useRef(onUpdate);

  // Keep the ref updated without triggering reconnections
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const connect = useCallback(() => {
    // Don't connect if sessionId or playerId is missing
    if (!sessionId || !playerId) {
      console.log('[SSE Client] Skipping connection, missing sessionId or playerId');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log('[SSE Client] Connection already in progress, skipping');
      return;
    }

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    // Close existing connection (will reconnect with new parameters)
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    isConnectingRef.current = true;

    const url = `/api/game/events?sessionId=${sessionId}&playerId=${playerId}`;
    console.log('[SSE Client] Connecting...', { sessionId, playerId });
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[SSE Client] Connected successfully');
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0; // Reset on successful connection
      isConnectingRef.current = false;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE Client] Message received:', data.type, 'phase:', data.session?.currentPhase);
        if (data.session) {
          setSession(data.session);
          onUpdateRef.current?.(data.session);
        }
      } catch (err) {
        console.error('[SSE Client] Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = (e) => {
      console.log('[SSE Client] Error, readyState:', eventSource.readyState);
      isConnectingRef.current = false;
      
      // Only reconnect if the connection is actually closed
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('[SSE Client] Connection closed, will reconnect...');
        setIsConnected(false);
        eventSource.close();

        // Don't start a new reconnect if one is already pending
        if (reconnectTimeoutRef.current) {
          console.log('[SSE Client] Reconnect already pending');
          return;
        }

        // Exponential backoff for reconnection with minimum 1s delay
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.max(1000, Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 10000));
          console.log(`[SSE Client] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          setError(`Reconnecting (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = undefined;
            connect();
          }, delay);
        } else {
          setError('Connection failed. Please refresh the page.');
        }
      }
    };
  }, [sessionId, playerId]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { session, isConnected, error };
}
