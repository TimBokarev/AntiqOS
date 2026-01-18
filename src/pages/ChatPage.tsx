import { useParams } from 'react-router-dom';
import { ChatContainer } from '../components/chat';

export function ChatPage() {
  const { entitySlug, sessionId } = useParams<{
    entitySlug: string;
    sessionId?: string;
  }>();

  if (!entitySlug) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid link</h2>
            <p className="text-gray-500">
              Please scan the QR code to start a conversation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <ChatContainer entitySlug={entitySlug} sessionId={sessionId} />;
}
