'use client'

import { useState, useRef, useCallback } from 'react'

type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped'

export interface UseRecorderReturn {
  state: RecorderState
  isRecording: boolean
  isPaused: boolean
  duration: number
  maxDuration: number
  blob: Blob | null
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
  getMimeType: () => string
}

const MAX_DURATION_SECONDS = 300 // 5 minutes

export function useRecorder(): UseRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [duration, setDuration] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Get the best supported MIME type for audio
  const getMimeType = useCallback(() => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return '' // Will use browser default
  }, [])

  const resetRecording = useCallback(() => {
    // Clear timers
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    // Stop all tracks in stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {
        // Ignore errors on close
      })
      audioContextRef.current = null
    }

    // Clear state
    chunksRef.current = []
    setBlob(null)
    setDuration(0)
    setError(null)
    setState('idle')
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          bitrate: 128000, // 128 kbps for good quality at small file size
        },
      })

      streamRef.current = stream

      // Create MediaRecorder with best supported MIME type
      const mimeType = getMimeType()
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      // Handle stop
      mediaRecorder.onstop = () => {
        // Combine chunks into single blob
        const audioBlob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        })
        setBlob(audioBlob)
        setState('stopped')

        // Stop stream
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // Handle errors
      mediaRecorder.onerror = (event) => {
        const errorMsg = `Recording error: ${event.error}`
        console.error(errorMsg)
        setError(errorMsg)
        setState('idle')
      }

      // Start recording
      mediaRecorder.start()
      setState('recording')

      // Start duration timer
      let seconds = 0
      timerIntervalRef.current = setInterval(() => {
        seconds += 1
        setDuration(seconds)

        // Auto-stop at max duration
        if (seconds >= MAX_DURATION_SECONDS) {
          clearInterval(timerIntervalRef.current!)
          timerIntervalRef.current = null
          mediaRecorder.stop()
          setError('Maximum recording duration (5 minutes) reached')
        }
      }, 1000)
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start recording'

      if (errorMsg.includes('NotAllowedError')) {
        setError('Microphone access denied. Please enable microphone permissions.')
      } else if (errorMsg.includes('NotFoundError')) {
        setError('No microphone found. Please connect a microphone.')
      } else {
        setError(errorMsg)
      }

      setState('idle')
    }
  }, [getMimeType])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }

      mediaRecorderRef.current.stop()
    } else if (state === 'paused') {
      // If paused, actually stop
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [state])

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.pause()
      setState('paused')

      // Keep timer running so user sees total elapsed time
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'paused'
    ) {
      mediaRecorderRef.current.resume()
      setState('recording')
    }
  }, [])

  return {
    state,
    isRecording: state === 'recording',
    isPaused: state === 'paused',
    duration,
    maxDuration: MAX_DURATION_SECONDS,
    blob,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    getMimeType,
  }
}
