import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EntityInfo, Message, ContentType } from '../types';
import { sendMessage } from '../services/api';
import { useSession } from './useSession';
import {
  uploadImage,
  uploadVoiceRecording,
  getEntityBySlug,
  createSession,
  getSession,
  deleteSession,
  resetSession,
} from '../services/supabase';

interface UseChatOptions {
  entitySlug: string;
  initialSessionId?: string;
}

interface UseChatReturn {
  entity: EntityInfo | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sessionId: string | null;
  introUrl: string | null;
  sendTextMessage: (text: string) => Promise<void>;
  sendImageMessage: (file: Blob) => Promise<void>;
  sendVoiceMessage: (file: Blob) => Promise<void>;
  handleReset: () => Promise<void>;
  handleWipe: () => Promise<void>;
}

export function useChat({ entitySlug, initialSessionId }: UseChatOptions): UseChatReturn {
  const navigate = useNavigate();
  const { getStoredSession, saveSession, updateThreadId, clearSession } = useSession(entitySlug);

  const [entity, setEntity] = useState<EntityInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [introUrl, setIntroUrl] = useState<string | null>(null);
  const [welcomeText, setWelcomeText] = useState<string>('');
  const initCalled = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    // Prevent double init in React StrictMode
    if (initCalled.current) return;
    initCalled.current = true;

    async function init() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Load entity from Supabase
        const entityData = await getEntityBySlug(entitySlug);
        if (!entityData) {
          setError('Character not found');
          setIsLoading(false);
          return;
        }

        // Set entity info
        const entityInfo: EntityInfo = {
          name: entityData.name,
          subtitle: entityData.subtitle,
          avatar_url: entityData.avatar_url,
          intro_url: entityData.intro_url,
        };
        setEntity(entityInfo);
        setIntroUrl(entityData.intro_url || null);
        setWelcomeText(entityData.welcome_message);

        // 2. Check for existing session
        const stored = getStoredSession();
        const sessionIdToLoad = initialSessionId || stored?.session_id || null;

        let session;
        if (sessionIdToLoad) {
          // Try to load existing session
          session = await getSession(sessionIdToLoad);
        }

        // 3. Create new session if needed
        if (!session) {
          session = await createSession(entityData.id);
          if (!session) {
            setError('Failed to create session');
            setIsLoading(false);
            return;
          }
        }

        setSessionId(session.id);
        setThreadId(session.thread_id);

        // 4. Create welcome message locally
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}`,
          session_id: session.id,
          thread_id: session.thread_id,
          role: 'assistant',
          content_type: 'text',
          content: entityData.welcome_message,
          created_at: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);

        // 5. Save to localStorage
        saveSession(session.id, session.thread_id);

        // 6. Update URL if needed
        if (!initialSessionId || initialSessionId !== session.id) {
          navigate(`/${entitySlug}/${session.id}`, { replace: true });
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

      // Create user message locally (optimistic UI)
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        session_id: sessionId,
        thread_id: threadId,
        role: 'user',
        content_type: type,
        content,
        media_url: mediaUrl,
        created_at: new Date().toISOString(),
      };

      // Add user message immediately
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await sendMessage(entitySlug, sessionId, threadId, type, content, mediaUrl);

        // Create assistant message from response
        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          session_id: response.session_id,
          thread_id: response.thread_id,
          role: 'assistant',
          content_type: response.type,
          content: response.content,
          media_url: response.media_url,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (e) {
        console.error('Failed to send message:', e);
        setError('Failed to send message');
        // Remove optimistic user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
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
      const newThreadId = await resetSession(sessionId);

      if (newThreadId) {
        setThreadId(newThreadId);
        updateThreadId(newThreadId);

        // Create new welcome message
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}`,
          session_id: sessionId,
          thread_id: newThreadId,
          role: 'assistant',
          content_type: 'text',
          content: welcomeText,
          created_at: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      } else {
        setError('Failed to reset chat');
      }
    } catch (e) {
      console.error('Failed to reset chat:', e);
      setError('Failed to reset chat');
    } finally {
      setIsSending(false);
    }
  }, [sessionId, welcomeText, updateThreadId]);

  const handleWipe = useCallback(async () => {
    if (!sessionId) return;

    setIsSending(true);
    setError(null);

    try {
      const success = await deleteSession(sessionId);

      if (success) {
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
    introUrl,
    sendTextMessage,
    sendImageMessage,
    sendVoiceMessage,
    handleReset,
    handleWipe,
  };
}
