// Entity (персонаж/объект) - полная версия для БД
export interface Entity {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  avatar_url?: string;
  intro_url?: string;
  welcome_message: string;
  system_prompt?: string;
  is_active: boolean;
  created_at: string;
}

// EntityInfo - упрощённая версия для клиента
export interface EntityInfo {
  name: string;
  subtitle?: string;
  avatar_url?: string;
  intro_url?: string;
}

// Session (сессия пользователя)
export interface Session {
  id: string;
  entity_id: string;
  thread_id: string;
  created_at: string;
  last_active_at: string;
}

// Message content types
export type ContentType = 'text' | 'image' | 'audio';
export type MessageRole = 'user' | 'assistant';

// Message (сообщение в чате)
export interface Message {
  id: string;
  session_id: string;
  thread_id: string;
  role: MessageRole;
  content_type: ContentType;
  content?: string;
  media_url?: string;
  created_at: string;
}

// API Request types
export interface LoadRequest {
  event: 'load';
  entity_slug: string;
  session_id: string | null;
}

export interface MessageRequest {
  event: 'message';
  entity_slug: string;
  session_id: string;
  thread_id: string;
  payload: {
    type: ContentType;
    content?: string;
    media_url?: string;
  };
}

export interface ResetRequest {
  event: 'reset';
  entity_slug: string;
  session_id: string;
}

export interface WipeRequest {
  event: 'wipe';
  entity_slug: string;
  session_id: string;
}

export type ApiRequest = LoadRequest | MessageRequest | ResetRequest | WipeRequest;

// API Response types
export interface LoadResponse {
  session_id: string;
  thread_id: string;
  entity: EntityInfo;
  welcome_message: string;
}

export interface MessageResponse {
  session_id: string;
  thread_id: string;
  type: ContentType;
  content?: string;
  media_url?: string;
}

export interface ResetResponse {
  success: boolean;
  thread_id: string;
  welcome_message: Message;
}

export interface WipeResponse {
  success: boolean;
}

// Chat state
export interface ChatState {
  entity: EntityInfo | null;
  session_id: string | null;
  thread_id: string | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  introUrl: string | null;
}

// Toast notification
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
