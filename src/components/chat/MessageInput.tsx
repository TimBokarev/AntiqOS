import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendImage: (blob: Blob) => void;
  onSendVoice: (blob: Blob) => void;
  disabled?: boolean;
}

export function MessageInput({
  onSendText,
  onSendImage,
  onSendVoice,
  disabled,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;

    onSendText(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Image uploader */}
        <ImageUploader onImageSelected={onSendImage} disabled={disabled} />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-2.5 pr-12 text-[15px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:opacity-50"
          />
        </div>

        {/* Voice recorder or send button */}
        {text.trim() ? (
          <button
            type="submit"
            disabled={disabled}
            className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        ) : (
          <VoiceRecorder onRecordingComplete={onSendVoice} disabled={disabled} />
        )}
      </form>
    </div>
  );
}
