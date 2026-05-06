'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { RecordingInterface } from '@/components/RecordingInterface'

export default function TestRecordingPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [evaluationResult, setEvaluationResult] = useState<any>(null)

  // Log helper
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    console.log(logEntry)
    setDebugLog((prev) => [...prev, logEntry])
  }

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        addLog('❌ Not authenticated, redirecting to login...')
        setTimeout(() => router.push('/auth/login'), 1000)
        return
      }
      setSession(data.session)
      addLog(`✅ Authenticated as ${data.session.user.email}`)
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (blob: Blob, problemId: string) => {
    setIsSubmitting(true)
    setEvaluationResult(null)
    addLog(`🎙️ Recording blob size: ${(blob.size / 1024).toFixed(2)} KB`)
    addLog(`📝 Problem ID: ${problemId}`)
    addLog(`🚀 Submitting to /api/attempts...`)

    try {
      // Get fresh token
      const { data, error: tokenError } = await supabase.auth.getSession()
      if (tokenError || !data.session?.access_token) {
        throw new Error('Failed to get auth token')
      }

      const token = data.session.access_token
      addLog(`🔑 Got auth token (${token.substring(0, 20)}...)`)

      // Create FormData with audio blob
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('problemId', problemId)

      addLog('📤 Uploading audio (this may take a moment)...')

      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      addLog(`📬 Response status: ${response.status}`)

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}`)
      }

      addLog('✅ Request succeeded!')
      addLog(`📊 Attempt ID: ${responseData.attemptId}`)
      addLog(`🎯 Score: ${responseData.score}`)

      setEvaluationResult({
        attemptId: responseData.attemptId,
        score: responseData.score,
        status: responseData.status,
      })

      // Poll for full results (Gemini evaluation)
      addLog('⏳ Waiting for Gemini evaluation...')
      await pollForResults(responseData.attemptId, token)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      addLog(`❌ Error: ${errorMsg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const pollForResults = async (attemptId: string, token: string) => {
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max wait

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/attempts?id=${attemptId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error('Failed to fetch attempt')

        const attempt = await response.json()

        if (attempt.status === 'completed') {
          addLog('✨ Gemini evaluation received!')
          addLog(`📈 Score: ${attempt.score}/100`)
          addLog(`📝 Summary: ${attempt.feedback_summary}`)
          addLog(`💬 Detailed Feedback: ${attempt.feedback_detailed}`)

          if (attempt.areas_to_improve?.length > 0) {
            addLog(`🎯 Areas to Improve: ${attempt.areas_to_improve.join(', ')}`)
          }

          if (attempt.strengths?.length > 0) {
            addLog(`💪 Strengths: ${attempt.strengths.join(', ')}`)
          }

          setEvaluationResult(attempt)
          return
        }

        if (attempt.status === 'failed') {
          addLog(`❌ Evaluation failed: ${attempt.error_message}`)
          return
        }

        // Still processing
        addLog(`⏳ Still processing... (${attempts + 1}/${maxAttempts})`)
        attempts++
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        addLog(`❌ Poll error: ${errorMsg}`)
        return
      }
    }

    addLog('⚠️ Timeout waiting for results')
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow">
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🧪 Recording System Test
          </h1>
          <p className="text-gray-600">
            User: <span className="font-semibold">{session.user.email}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Test recording, playback, and Gemini evaluation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Recording Interface (Main) */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-lg p-8">
            <RecordingInterface
              problemId="test-gatekeeper"
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Debug Panel (Sidebar) */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-fit flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Debug Console</h2>

            {/* Results Preview */}
            {evaluationResult && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Evaluation Result</h3>
                <div className="space-y-1 text-sm text-green-800">
                  <p>
                    <span className="font-semibold">Score:</span>{' '}
                    {evaluationResult.score}/100
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{' '}
                    {evaluationResult.status}
                  </p>
                </div>
              </div>
            )}

            {/* Debug Log */}
            <div className="flex-1 flex flex-col">
              <div className="text-xs text-gray-500 mb-2 font-mono">Log</div>
              <div className="flex-1 bg-gray-900 text-green-400 font-mono text-xs p-3 rounded overflow-y-auto max-h-96 border border-gray-700">
                {debugLog.length === 0 ? (
                  <div className="text-gray-600">Waiting for events...</div>
                ) : (
                  debugLog.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap break-words">
                      {log}
                    </div>
                  ))
                )}
              </div>

              {/* Clear Button */}
              {debugLog.length > 0 && (
                <button
                  onClick={() => setDebugLog([])}
                  className="mt-2 text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
                >
                  Clear Log
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">📋 Test Instructions</h3>
          <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
            <li>Click <strong>Start Recording</strong> and speak for 30-60 seconds</li>
            <li>Click <strong>Stop</strong> when done</li>
            <li>Review the playback (use Play, Pause, Rewind controls)</li>
            <li>Click <strong>Submit for Evaluation</strong></li>
            <li>Watch the debug console for Gemini evaluation results</li>
            <li>The score and feedback will appear on the right panel</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
