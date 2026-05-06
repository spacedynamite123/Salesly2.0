'use client'

import { useRecorder } from '@/hooks/useRecorder'
import { formatDuration } from '@/lib/utils'
import { Mic, Square, Pause, Play } from 'lucide-react'

interface RecorderProps {
  onRecordingComplete?: (blob: Blob) => void
  disabled?: boolean
}

export function Recorder({ onRecordingComplete, disabled = false }: RecorderProps) {
  const {
    state,
    isRecording,
    isPaused,
    duration,
    maxDuration,
    blob,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useRecorder()

  const handleStartClick = () => {
    if (state === 'idle' || blob) {
      // Starting fresh
      startRecording()
    }
  }

  const handleStopClick = () => {
    stopRecording()
  }

  const handlePauseClick = () => {
    if (isRecording) {
      pauseRecording()
    } else if (isPaused) {
      resumeRecording()
    }
  }

  const handleReset = () => {
    resetRecording()
  }

  const handleSubmit = () => {
    if (blob) {
      onRecordingComplete?.(blob)
    }
  }

  const percentComplete = (duration / maxDuration) * 100

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Record Your Response</h2>
          <p className="text-gray-600 mt-1">
            Maximum 5 minutes • Click start to begin
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Recording Status & Timer */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-red-600">Recording</span>
                </div>
              )}
              {isPaused && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-sm font-semibold text-yellow-600">Paused</span>
                </div>
              )}
              {state === 'stopped' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm font-semibold text-green-600">Stopped</span>
                </div>
              )}
              {state === 'idle' && !blob && (
                <span className="text-sm text-gray-600">Ready to record</span>
              )}
            </div>

            {/* Duration Display */}
            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-gray-900">
                {formatDuration(duration)}
              </div>
              <div className="text-xs text-gray-500">
                / {formatDuration(maxDuration)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${Math.min(percentComplete, 100)}%` }}
            />
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex gap-3 justify-center">
          {!isRecording && !isPaused && state === 'idle' && (
            <button
              onClick={handleStartClick}
              disabled={disabled || blob !== null}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              <Mic size={20} />
              Start Recording
            </button>
          )}

          {(isRecording || isPaused) && (
            <>
              <button
                onClick={handlePauseClick}
                disabled={disabled}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {isRecording ? (
                  <>
                    <Pause size={20} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Resume
                  </>
                )}
              </button>

              <button
                onClick={handleStopClick}
                disabled={disabled}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                <Square size={20} />
                Stop
              </button>
            </>
          )}

          {state === 'stopped' && blob && (
            <>
              <button
                onClick={handleReset}
                disabled={disabled}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                Re-record
              </button>

              <button
                onClick={handleSubmit}
                disabled={disabled}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                <Play size={20} />
                Submit Recording
              </button>
            </>
          )}
        </div>

        {/* File Info */}
        {blob && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              📁 Recording size:{' '}
              <span className="font-semibold">
                {(blob.size / 1024).toFixed(2)} KB
              </span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Ready to submit: {blob.type || 'audio/webm'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
