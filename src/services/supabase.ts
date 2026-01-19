import { createClient } from '@supabase/supabase-js';
import type { Entity, Session } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Media uploads will not work.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Upload file to Supabase Storage
export async function uploadFile(
  bucket: string,
  path: string,
  file: Blob
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Upload image
export async function uploadImage(
  sessionId: string,
  file: Blob
): Promise<string | null> {
  const timestamp = Date.now();
  const path = `${sessionId}/images/${timestamp}.webp`;
  return uploadFile('user-uploads', path, file);
}

// Upload voice recording
export async function uploadVoiceRecording(
  sessionId: string,
  file: Blob
): Promise<string | null> {
  const timestamp = Date.now();
  const path = `${sessionId}/${timestamp}.webm`;
  return uploadFile('voice-recordings', path, file);
}

// ============================================
// Entity & Session functions
// ============================================

// Get entity by slug
export async function getEntityBySlug(slug: string): Promise<Entity | null> {
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching entity:', error);
    return null;
  }

  return data as Entity;
}

// Create new session
export async function createSession(entityId: string): Promise<Session | null> {
  const threadId = `thread_${crypto.randomUUID()}`;

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      entity_id: entityId,
      thread_id: threadId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    return null;
  }

  return data as Session;
}

// Get existing session
export async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  // Update last_active_at
  await supabase
    .from('sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', sessionId);

  return data as Session;
}

// Delete session and all its data
export async function deleteSession(sessionId: string): Promise<boolean> {
  // 1. Delete n8n chat history (session_id format: {session_id}_{thread_id})
  const { error: chatError } = await supabase
    .from('n8n_chat_histories')
    .delete()
    .like('session_id', `${sessionId}_%`);

  if (chatError) {
    console.error('Error deleting chat history:', chatError);
    // Continue anyway - session deletion is more important
  }

  // 2. Delete session (cascades to messages table)
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error deleting session:', error);
    return false;
  }

  return true;
}

// Reset session (new thread_id, keep session)
export async function resetSession(sessionId: string): Promise<string | null> {
  const newThreadId = `thread_${crypto.randomUUID()}`;

  const { error } = await supabase
    .from('sessions')
    .update({
      thread_id: newThreadId,
      last_active_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error resetting session:', error);
    return null;
  }

  return newThreadId;
}
