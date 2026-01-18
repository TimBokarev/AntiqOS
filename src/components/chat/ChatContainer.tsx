import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '../../hooks/useChat';

interface ChatContainerProps {
  entitySlug: string;
  sessionId?: string;
}

export function ChatContainer({ entitySlug, sessionId }: ChatContainerProps) {
  const {
    entity,
    messages,
    isLoading,
    isSending,
    error,
    sendTextMessage,
    sendImageMessage,
    sendVoiceMessage,
    handleReset,
    handleWipe,
  } = useChat({ entitySlug, initialSessionId: sessionId });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (no entity found)
  if (!entity) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Character not found</h2>
            <p className="text-gray-500">
              {error || 'The character you are looking for does not exist.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ChatHeader
        entity={entity}
        onReset={handleReset}
        onWipe={handleWipe}
        isLoading={isSending}
      />

      <MessageList messages={messages} isSending={isSending} />

      <MessageInput
        onSendText={sendTextMessage}
        onSendImage={sendImageMessage}
        onSendVoice={sendVoiceMessage}
        disabled={isSending}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-20 left-4 right-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
