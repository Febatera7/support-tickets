import { useEffect, useRef } from "react";
import { useAuth } from "#src/context/AuthContext";

type SSEEventType =
  | "TICKET_PROCESSING_UPDATE"
  | "PRIORITY_CHANGED"
  | "TICKET_ASSIGNED"
  | "CONNECTED";

interface SSEEvent {
  type: SSEEventType;
  payload: Record<string, unknown>;
}

export function useSSE(onEvent: (event: SSEEvent) => void) {
  const { token } = useAuth();
  const esRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!token) return;

    const url = `${import.meta.env["VITE_API_URL"] as string}/api/events?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string) as SSEEvent;
        onEventRef.current(data);
      } catch {
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setTimeout(() => {
        if (token) {
          const newEs = new EventSource(url);
          esRef.current = newEs;
          newEs.onmessage = es.onmessage;
          newEs.onerror = es.onerror;
        }
      }, 5000);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [token]);
}