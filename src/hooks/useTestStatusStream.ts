import { useCallback, useEffect, useRef } from 'react';

import type { TestUpdateEvent } from '@/lib/api/types';
import { useAuthStore } from '@/stores/authStore';

interface ParsedSSEEvent {
  type: string;
  data: unknown;
  id?: string;
}

interface UseTestStatusStreamOptions {
  onUpdate?: (update: TestUpdateEvent) => void;
  onConnect?: (clinicId: string) => void;
  onError?: (error: Error) => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

interface UseTestStatusStreamReturn {
  disconnect: () => void;
  reconnect: () => void;
  isConnected: boolean;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * Parse a single SSE event string into its components.
 * SSE format: event: <type>\ndata: <json>\nid: <id>\n\n
 */
function parseSSEEvent(eventStr: string): ParsedSSEEvent | null {
  const lines = eventStr.split('\n');
  let eventType = 'message';
  let data = '';
  let id: string | undefined;

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data += line.slice(5).trim();
    } else if (line.startsWith('id:')) {
      id = line.slice(3).trim();
    }
  }

  if (!data) return null;

  try {
    return { type: eventType, data: JSON.parse(data), id };
  } catch {
    return { type: eventType, data, id };
  }
}

/**
 * Low-level hook for SSE connection management.
 * Uses fetch API instead of EventSource to support JWT Bearer token authentication.
 */
export function useTestStatusStream(
  options: UseTestStatusStreamOptions = {}
): UseTestStatusStreamReturn {
  const { onUpdate, onConnect, onError, onDisconnect, enabled = true } = options;

  const token = useAuthStore(state => state.token);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);

  // Store callbacks in refs to avoid dependency changes triggering reconnection
  const onUpdateRef = useRef(onUpdate);
  const onConnectRef = useRef(onConnect);
  const onErrorRef = useRef(onError);
  const onDisconnectRef = useRef(onDisconnect);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onConnectRef.current = onConnect;
    onErrorRef.current = onError;
    onDisconnectRef.current = onDisconnect;
  }, [onUpdate, onConnect, onError, onDisconnect]);

  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    isConnectedRef.current = false;
    isConnectingRef.current = false;
    reconnectAttemptsRef.current = 0;
  }, []);

  const connect = useCallback(async () => {
    if (!token || !enabled || isConnectingRef.current) return;
    // Offline: don't burn reconnect attempts against a dead network — the
    // 'online' listener below re-establishes the stream when connectivity
    // returns.
    if (!navigator.onLine) return;

    // Cancel any existing connection
    disconnect();
    isConnectingRef.current = true;

    const baseUrl = import.meta.env.VITE_MDW_BACKEND || '';
    const url = `${baseUrl}/clinic/tests/stream`;

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 409) {
        // Duplicate connection - another tab might be connected
        console.warn('[SSE] Connection already exists for this clinic (409)');
        const error = new Error('Connection already exists for this clinic');
        onErrorRef.current?.(error);
        isConnectingRef.current = false;
        // Don't reconnect for 409 - it's intentional
        return;
      }

      if (response.status === 401) {
        console.warn('[SSE] Unauthorized (401) - token may be expired');
        const error = new Error('Unauthorized - please log in again');
        onErrorRef.current?.(error);
        isConnectingRef.current = false;
        // Auth will be handled by the auth store
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // Connection successful - reset reconnect attempts
      reconnectAttemptsRef.current = 0;
      isConnectedRef.current = true;
      isConnectingRef.current = false;

      // Read stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[SSE] Stream ended');
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events (separated by double newlines)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          const event = parseSSEEvent(eventStr);
          if (!event) continue;

          if (event.type === 'connected') {
            const data = event.data as { status: string; clinic_id: string };
            console.log('[SSE] Connected to stream for clinic:', data.clinic_id);
            onConnectRef.current?.(data.clinic_id);
          } else if (event.type === 'test_update') {
            const update = event.data as TestUpdateEvent;
            onUpdateRef.current?.(update);
          } else if (event.type === 'heartbeat') {
            // Heartbeat received - connection is alive
            // No action needed, just keeps connection active
          }
        }
      }

      // Stream ended normally
      isConnectedRef.current = false;
      onDisconnectRef.current?.();

      // Attempt reconnection if still enabled
      if (enabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current),
          MAX_RECONNECT_DELAY_MS
        );
        reconnectAttemptsRef.current++;
        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
        reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
      }
    } catch (error) {
      isConnectingRef.current = false;
      isConnectedRef.current = false;

      if ((error as Error).name === 'AbortError') {
        // Expected when disconnecting intentionally
        console.log('[SSE] Connection aborted');
        return;
      }

      console.error('[SSE] Connection error:', error);
      onErrorRef.current?.(error as Error);
      onDisconnectRef.current?.();

      // Reconnect with exponential backoff
      if (enabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current),
          MAX_RECONNECT_DELAY_MS
        );
        reconnectAttemptsRef.current++;
        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
        reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
      } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[SSE] Max reconnection attempts reached');
      }
    }
  }, [token, enabled, disconnect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, token, connect, disconnect]);

  // Reconnect (with a fresh attempt budget) whenever connectivity returns.
  useEffect(() => {
    if (!enabled) return;
    const handleOnline = () => {
      reconnectAttemptsRef.current = 0;
      void connect();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enabled, connect]);

  return {
    disconnect,
    reconnect: connect,
    isConnected: isConnectedRef.current,
  };
}
