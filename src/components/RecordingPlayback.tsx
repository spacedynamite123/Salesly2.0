'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface RecordingPlaybackProps {
  blob: Blob
  onDelete?: () => void
  onRerecord?: () => void
}

export function RecordingPlayback({
  blob,
  onDelete,
  onRerecord,
}: RecordingPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Create URL from blob on mount
  useEffect(() => {
    const url = URL.createObjectURL(blob)
    if (audioRef.current) {
      audioRef.current.src = url
    }

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [blob])

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5)
    }
  }

  const percentComplete = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="w-full bg-gray-50 rounded-lg border border-gray-200 p-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Recording</h3>

      {/* Playback Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handlePlayPause}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <button
          onClick={handleRewind}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 transition-colors"
          title="Rewind 5 seconds"
        >
          <RotateCcw size={18} />
        </button>

        {/* Time Display */}
        <div className="text-sm font-mono text-gray-600 min-w-32">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span className="text-gray-400"> / </span>
          <span>{formatDuration(Math.ceil(duration))}</span>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2 ml-auto max-w-xs">
          <button
            onClick={handleMute}
            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            disabled={isMuted}
            className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
            title="Volume"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
          title="Seek"
        />

        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-100"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      {(onDelete || onRerecord) && (
        <div className="flex gap-3 mt-4">
          {onRerecord && (
            <button
              onClick={onRerecord}
              className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
            >
              Re-record
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
            >
              Delete Recording
            </button>
          )}
        </div>
      )}

      {/* File Info */}
      <div className="mt-4 p-3 bg-white border border-gray-200 rounded text-sm text-gray-600">
        <span>File size: </span>
        <span className="font-semibold">{(blob.size / 1024).toFixed(1)} KB</span>
        <span className="mx-2">•</span>
        <span>Type: {blob.type || 'audio/webm'}</span>
      </div>
    </div>
  )
}
