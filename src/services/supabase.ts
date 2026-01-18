import { createClient } from '@supabase/supabase-js';

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
