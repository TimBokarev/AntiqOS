import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Entity, Message, ContentType } from '../types';
import { loadSession, sendMessage, resetChat, wipeSession } from '../services/api';
import { useSession } from './useSession';
import { uploadImage, uploadVoiceRecording } from '../services/supabase';

interface UseChatOptions {
  entitySlug: string;
  initialSessionId?: string;
}

interface UseChatReturn {
  entity: Entity | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sessionId: string | null;
  sendTextMessage: (text: string) => Promise<void>;
  sendImageMessage: (file: Blob) => Promise<void>;
  sendVoiceMessage: (file: Blob) => Promise<void>;
  handleReset: () => Promise<void>;
  handleWipe: () => Promise<void>;
}

export function useChat({ entitySlug, initialSessionId }: UseChatOptions): UseChatReturn {
  const navigate = useNavigate();
  const { getStoredSession, saveSession, updateThreadId, clearSession } = useSession(entitySlug);

  const [entity, setEntity] = useState<Entity | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      setError(null);

      try {
        // Check localStorage for existing session
        const stored = getStoredSession();
        const sessionToLoad = initialSessionId || stored?.session_id || null;

        const response = await loadSession(entitySlug, sessionToLoad);

        if (response.success) {
          setEntity(response.entity);
          setMessages(response.messages);
          setSessionId(response.session_id);
          setThreadId(response.thread_id);

          // Save to localStorage
          saveSession(response.session_id, response.thread_id);

          // Update URL if session_id is different
          if (!initialSessionId || initialSessionId !== response.session_id) {
            navigate(`/${entitySlug}/${response.session_id}`, { replace: true });
          }
        } else {
          setError('Failed to load session');
        }
      } catch (e) {
        console.error('Failed to initialize chat:', e);
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [entitySlug, initialSessionId, getStoredSession, saveSession, navigate]);

  // Send a message of any type
  const sendMessageInternal = useCallback(
    async (type: ContentType, content?: string, mediaUrl?: string) => {
      if (!sessionId || !threadId || isSending) return;

      setIsSending(true);
      setError(null);

      try {
        const response = await sendMessage(entitySlug, sessionId, threadId, type, content, mediaUrl);

        if (response.success) {
          setMessages((prev) => [...prev, response.user_message, response.assistant_message]);
        } else {
          setError('Failed to send message');
        }
      } catch (e) {
        console.error('Failed to send message:', e);
        setError('Failed to send message');
      } finally {
        setIsSending(false);
      }
    },
    [entitySlug, sessionId, threadId, isSending]
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      await sendMessageInternal('text', text);
    },
    [sendMessageInternal]
  );

  const sendImageMessage = useCallback(
    async (file: Blob) => {
      if (!sessionId) return;

      setIsSending(true);
      setError(null);

      try {
        const url = await uploadImage(sessionId, file);
        if (url) {
          await sendMessageInternal('image', undefined, url);
        } else {
          setError('Failed to upload image');
          setIsSending(false);
        }
      } catch (e) {
        console.error('Failed to upload image:', e);
        setError('Failed to upload image');
        setIsSending(false);
      }
    },
    [sessionId, sendMessageInternal]
  );

  const sendVoiceMessage = useCallback(
    async (file: Blob) => {
      if (!sessionId) return;

      setIsSending(true);
      setError(null);

      try {
        const url = await uploadVoiceRecording(sessionId, file);
        if (url) {
          await sendMessageInternal('audio', undefined, url);
        } else {
          setError('Failed to upload voice message');
          setIsSending(false);
        }
      } catch (e) {
        console.error('Failed to upload voice message:', e);
        setError('Failed to upload voice message');
        setIsSending(false);
      }
    },
    [sessionId, sendMessageInternal]
  );

  const handleReset = useCallback(async () => {
    if (!sessionId) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await resetChat(entitySlug, sessionId);

      if (response.success) {
        setThreadId(response.thread_id);
        setMessages([response.welcome_message]);
        updateThreadId(response.thread_id);
      } else {
        setError('Failed to reset chat');
      }
    } catch (e) {
      console.error('Failed to reset chat:', e);
      setError('Failed to reset chat');
    } finally {
      setIsSending(false);
    }
  }, [entitySlug, sessionId, updateThreadId]);

  const handleWipe = useCallback(async () => {
    if (!sessionId) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await wipeSession(entitySlug, sessionId);

      if (response.success) {
        clearSession();
        // Reload the page to start fresh
        navigate(`/${entitySlug}`, { replace: true });
        window.location.reload();
      } else {
        setError('Failed to wipe session');
      }
    } catch (e) {
      console.error('Failed to wipe session:', e);
      setError('Failed to wipe session');
    } finally {
      setIsSending(false);
    }
  }, [entitySlug, sessionId, clearSession, navigate]);

  return {
    entity,
    messages,
    isLoading,
    isSending,
    error,
    sessionId,
    sendTextMessage,
    sendImageMessage,
    sendVoiceMessage,
    handleReset,
    handleWipe,
  };
}
