import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } =
    useVoiceRecorder();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch {
      alert('Microphone access is required for voice messages');
    }
  };

  const handleStopRecording = async () => {
    const blob = await stopRecording();
    if (blob) {
      onRecordingComplete(blob);
    }
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-red-50 rounded-full">
        {/* Recording indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-600">{formatTime(recordingTime)}</span>
        </div>

        {/* Cancel button */}
        <button
          onClick={cancelRecording}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          aria-label="Cancel recording"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Send button */}
        <button
          onClick={handleStopRecording}
          className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
          aria-label="Send voice message"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartRecording}
      disabled={disabled}
      className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Record voice message"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    </button>
  );
}
