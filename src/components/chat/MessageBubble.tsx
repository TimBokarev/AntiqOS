import { useState } from 'react';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <>
      <div
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
        >
          {message.content_type === 'text' && (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {message.content_type === 'image' && message.media_url && (
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="block"
            >
              <img
                src={message.media_url}
                alt="Uploaded image"
                className="max-w-full rounded-lg max-h-64 object-cover"
              />
            </button>
          )}

          {message.content_type === 'audio' && message.media_url && (
            <div className="flex items-center gap-2">
              <audio
                src={message.media_url}
                controls
                className="max-w-full h-10"
              />
            </div>
          )}

          <div
            className={`text-[11px] mt-1 ${
              isUser ? 'text-indigo-200' : 'text-gray-400'
            }`}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>

      {/* Full-screen image modal */}
      {isImageModalOpen && message.media_url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setIsImageModalOpen(false)}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={message.media_url}
            alt="Uploaded image"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
