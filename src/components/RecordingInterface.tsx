'use client'

import { useState } from 'react'
import { Recorder } from './Recorder'
import { RecordingPlayback } from './RecordingPlayback'

interface RecordingInterfaceProps {
  problemId: string
  onSubmit?: (blob: Blob, problemId: string) => Promise<void>
  isSubmitting?: boolean
}

type Step = 'recording' | 'playback'

export function RecordingInterface({
  problemId,
  onSubmit,
  isSubmitting = false,
}: RecordingInterfaceProps) {
  const [step, setStep] = useState<Step>('recording')
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleRecordingComplete = (blob: Blob) => {
    setRecordingBlob(blob)
    setStep('playback')
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  const handleRerecord = () => {
    setRecordingBlob(null)
    setStep('recording')
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  const handlePlaybackSubmit = async () => {
    if (!recordingBlob || !onSubmit) return

    try {
      setSubmitError(null)
      await onSubmit(recordingBlob, problemId)
      setSubmitSuccess(true)
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to submit recording'
      setSubmitError(errorMsg)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
            step === 'recording'
              ? 'bg-blue-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          1
        </div>
        <div
          className={`flex-1 h-1 ${step === 'playback' ? 'bg-blue-600' : 'bg-gray-300'}`}
        />
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
            step === 'playback'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-600'
          }`}
        >
          2
        </div>
      </div>

      {/* Recording Step */}
      {step === 'recording' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Step 1: Record</h3>
          <Recorder onRecordingComplete={handleRecordingComplete} />
        </div>
      )}

      {/* Playback Step */}
      {step === 'playback' && recordingBlob && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Step 2: Review & Submit</h3>

          <RecordingPlayback
            blob={recordingBlob}
            onRerecord={handleRerecord}
          />

          {/* Submit Status */}
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{submitError}</p>
            </div>
          )}

          {submitSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-semibold">
                ✓ Recording submitted successfully! Your evaluation is being processed.
              </p>
            </div>
          )}

          {/* Submit Button */}
          {!submitSuccess && (
            <button
              onClick={handlePlaybackSubmit}
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Evaluation'}
            </button>
          )}

          {submitSuccess && (
            <button
              onClick={handleRerecord}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Record Another Response
            </button>
          )}
        </div>
      )}
    </div>
  )
}
