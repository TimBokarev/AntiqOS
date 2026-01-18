import { useState } from 'react';
import type { Entity } from '../../types';
import { Button, Modal } from '../ui';

interface ChatHeaderProps {
  entity: Entity;
  onReset: () => void;
  onWipe: () => void;
  isLoading: boolean;
}

export function ChatHeader({ entity, onReset, onWipe, isLoading }: ChatHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);

  const handleReset = () => {
    setIsResetModalOpen(false);
    setIsMenuOpen(false);
    onReset();
  };

  const handleWipe = () => {
    setIsWipeModalOpen(false);
    setIsMenuOpen(false);
    onWipe();
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Avatar */}
          <div className="relative">
            {entity.avatar_url ? (
              <img
                src={entity.avatar_url}
                alt={entity.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-100">
                <span className="text-white text-lg font-semibold">
                  {entity.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {entity.name}
            </h1>
            {entity.subtitle && (
              <p className="text-sm text-gray-500 truncate">{entity.subtitle}</p>
            )}
          </div>

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 w-48">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsResetModalOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Clear chat
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsWipeModalOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear all history
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Reset confirmation modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Clear chat?"
      >
        <p className="text-gray-600 mb-6">
          This will start a new conversation. Your previous messages will be saved.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => setIsResetModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleReset}
            isLoading={isLoading}
          >
            Clear chat
          </Button>
        </div>
      </Modal>

      {/* Wipe confirmation modal */}
      <Modal
        isOpen={isWipeModalOpen}
        onClose={() => setIsWipeModalOpen(false)}
        title="Clear all history?"
      >
        <p className="text-gray-600 mb-6">
          This will permanently delete all your messages and start completely fresh.
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => setIsWipeModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleWipe}
            isLoading={isLoading}
          >
            Delete everything
          </Button>
        </div>
      </Modal>
    </>
  );
}
