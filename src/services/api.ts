import type {
  LoadRequest,
  LoadResponse,
  MessageRequest,
  MessageResponse,
  ResetRequest,
  ResetResponse,
  WipeRequest,
  WipeResponse,
  ContentType,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'https://n8n.bookvalia.com/webhook/AntiqOS';

async function request<T>(body: unknown): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  // n8n returns array of items, unwrap first element
  if (Array.isArray(data)) {
    return data[0] as T;
  }

  return data as T;
}

// Load/restore session
export async function loadSession(
  entitySlug: string,
  sessionId: string | null
): Promise<LoadResponse> {
  const payload: LoadRequest = {
    event: 'load',
    entity_slug: entitySlug,
    session_id: sessionId,
  };
  return request<LoadResponse>(payload);
}

// Send message
export async function sendMessage(
  entitySlug: string,
  sessionId: string,
  threadId: string,
  type: ContentType,
  content?: string,
  mediaUrl?: string
): Promise<MessageResponse> {
  const payload: MessageRequest = {
    event: 'message',
    entity_slug: entitySlug,
    session_id: sessionId,
    thread_id: threadId,
    payload: {
      type,
      content,
      media_url: mediaUrl,
    },
  };
  return request<MessageResponse>(payload);
}

// Reset chat (new thread)
export async function resetChat(
  entitySlug: string,
  sessionId: string
): Promise<ResetResponse> {
  const payload: ResetRequest = {
    event: 'reset',
    entity_slug: entitySlug,
    session_id: sessionId,
  };
  return request<ResetResponse>(payload);
}

// Wipe session (delete all history)
export async function wipeSession(
  entitySlug: string,
  sessionId: string
): Promise<WipeResponse> {
  const payload: WipeRequest = {
    event: 'wipe',
    entity_slug: entitySlug,
    session_id: sessionId,
  };
  return request<WipeResponse>(payload);
}
