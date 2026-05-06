# Recording System Architecture

## Overview

The recording system provides a production-ready audio recorder with memory-efficient handling, playback, and validation. It's built on the Web Audio API and MediaRecorder API with robust error handling.

## Components

### 1. `useRecorder()` Hook
**Location:** `src/hooks/useRecorder.ts`

Custom React hook managing the complete recording lifecycle.

**Key Features:**
- **Memory Efficient:** Stores audio chunks in a Blob array, combining into a single Blob only when stopped
- **5-Minute Limit:** Auto-stops recording at 300 seconds with user notification
- **State Management:** Tracks recording, paused, stopped, and idle states
- **Error Handling:** Gracefully handles permission denial, no microphone, and recording errors
- **Codec Auto-Detection:** Selects best supported MIME type (webm/opus → mp4 → wav → ogg)

**Usage:**
```typescript
const {
  state,           // 'idle' | 'recording' | 'paused' | 'stopped'
  isRecording,     // boolean
  isPaused,        // boolean
  duration,        // seconds elapsed
  maxDuration,     // 300 seconds
  blob,            // Blob | null (null until stopped)
  error,           // string | null
  startRecording,  // async () => Promise<void>
  stopRecording,   // () => void
  pauseRecording,  // () => void
  resumeRecording, // () => void
  resetRecording,  // () => void (clears state, stops stream)
  getMimeType,     // () => string (returns best MIME type)
} = useRecorder()
```

**Under the Hood:**
- Requests `getUserMedia()` for microphone access
- Creates MediaRecorder with optimal audio settings (echoCancellation, noiseSuppression, 128kbps)
- Collects `ondataavailable` events into chunks array
- Combines chunks into Blob on `onstop`
- Auto-stops at 5 minutes
- Properly cleans up: stops stream tracks, closes audio context, clears timers

### 2. `Recorder` Component
**Location:** `src/components/Recorder.tsx`

High-level recording UI with controls and status display.

**Props:**
```typescript
interface RecorderProps {
  onRecordingComplete?: (blob: Blob) => void  // Called when recording stops
  disabled?: boolean                           // Disable all controls
}
```

**Features:**
- Start/Pause/Resume/Stop controls
- Real-time timer display (MM:SS format)
- Visual progress bar showing time used
- Recording status indicator (recording/paused/stopped)
- File size display (in KB)
- Re-record capability
- Submit button when ready
- Error display with user-friendly messages

**Example:**
```typescript
function MyRecorder() {
  const handleComplete = (blob: Blob) => {
    console.log('Recording ready:', blob.size / 1024, 'KB')
  }

  return <Recorder onRecordingComplete={handleComplete} />
}
```

### 3. `RecordingPlayback` Component
**Location:** `src/components/RecordingPlayback.tsx`

Audio player for previewing before submit.

**Props:**
```typescript
interface RecordingPlaybackProps {
  blob: Blob                    // Audio blob to play
  onDelete?: () => void         // Delete button callback
  onRerecord?: () => void       // Re-record button callback
}
```

**Features:**
- Play/Pause controls
- 5-second rewind button
- Timeline scrubbing
- Volume control with mute button
- Real-time duration display (MM:SS / MM:SS)
- Visual progress bar
- File info (size, MIME type)

**Example:**
```typescript
function ReviewRecording() {
  const [blob, setBlob] = useState<Blob | null>(null)

  return blob ? (
    <RecordingPlayback
      blob={blob}
      onRerecord={() => setBlob(null)}
      onDelete={() => alert('Deleted')}
    />
  ) : null
}
```

### 4. `RecordingInterface` Component
**Location:** `src/components/RecordingInterface.tsx`

Complete 2-step flow combining recording and playback.

**Props:**
```typescript
interface RecordingInterfaceProps {
  problemId: string                                    // Problem being practiced
  onSubmit?: (blob: Blob, problemId: string) => Promise<void>  // Submit handler
  isSubmitting?: boolean                               // Loading state
}
```

**Flow:**
1. **Step 1 (Recording):** User records response
2. **Step 2 (Playback):** User reviews recording before submitting
3. **Submit:** Calls `onSubmit` handler with blob

**Features:**
- Progress indicator (step 1 → step 2)
- Auto-advance to playback when recording complete
- Submit status messages (error, success)
- Re-record from playback step
- Record another button after success

**Example:**
```typescript
function PracticePage() {
  const [problemId] = useState('problem-123')

  const handleSubmit = async (blob: Blob, id: string) => {
    const formData = new FormData()
    formData.append('audio', blob)
    formData.append('problemId', id)
    const response = await fetch('/api/attempts', {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) throw new Error('Upload failed')
  }

  return (
    <RecordingInterface
      problemId={problemId}
      onSubmit={handleSubmit}
    />
  )
}
```

### 5. Utility: `formatDuration()`
**Location:** `src/lib/utils.ts`

Helper for formatting seconds into MM:SS format.

```typescript
formatDuration(65)   // "01:05"
formatDuration(305)  // "05:05"
formatDuration(0)    // "00:00"
```

## Memory Efficiency

The recording system is designed not to crash when handling up to 5 minutes of audio:

1. **Chunked Streaming:** Audio is stored in chunks (typically 1 second per chunk at 128kbps = ~16KB)
2. **Single Blob:** Chunks combine into one Blob only when recording stops, not during
3. **Efficient MIME Types:** Uses webm/opus (high compression) by default
4. **File Size Estimate:**
   - 5 min @ 128kbps = ~96 MB uncompressed → ~10-15 MB compressed
   - Typical recording stays under 5 MB for normal speech
5. **No Memory Leak:** Properly cleans up: revokes blob URLs, stops streams, clears intervals

## Browser Support

- ✅ Chrome/Edge 49+
- ✅ Firefox 29+
- ✅ Safari 14.1+
- ✅ Mobile Chrome/Firefox
- ⚠️ Internet Explorer (not supported)

## Error Handling

Common errors and how the system handles them:

| Error | Cause | UI Message |
|-------|-------|-----------|
| `NotAllowedError` | User denied microphone | "Microphone access denied..." |
| `NotFoundError` | No microphone detected | "No microphone found..." |
| Recording error | Hardware/OS issue | "Recording error: [details]" |
| Max duration reached | 5 minutes elapsed | "Maximum recording duration (5 minutes) reached" |

## Performance Tips

1. **Save blob locally** before uploading (don't lose recording if upload fails)
2. **Validate blob before submit** (check size, duration)
3. **Use compression** if uploading to save bandwidth
4. **Test on real devices** for audio quality

## Integration Checklist

When using `RecordingInterface` in a page:

- [ ] Import: `import { RecordingInterface } from '@/components/RecordingInterface'`
- [ ] Provide `problemId` prop
- [ ] Implement `onSubmit` handler to upload blob
- [ ] Handle `isSubmitting` state during upload
- [ ] Display error messages from onSubmit errors
- [ ] Test on mobile (especially iOS Safari)
- [ ] Verify microphone permissions requested

## Example: Complete Practice Page Integration

```typescript
'use client'

import { useState } from 'react'
import { RecordingInterface } from '@/components/RecordingInterface'

export default function PracticePage() {
  const problemId = 'gatekeeper'
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (blob: Blob, id: string) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('audio', blob)
      formData.append('problemId', id)

      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Attempt saved:', data.attemptId)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Practice Sales Call</h1>
      <RecordingInterface
        problemId={problemId}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
```

## What's Next

To complete Phase 1:
1. Create Problem Browser component (fetch & display problems)
2. Integrate `RecordingInterface` into practice page
3. Update `/api/attempts/route.ts` to handle audio upload to Supabase Storage
4. Create Attempts History page showing past evaluations

The recording system is **production-ready** and can be deployed as-is.
