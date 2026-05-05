// Auth
export type LoginRequest = {
  provider: 'google' | 'github'
}

export type LogoutResponse = {
  ok: boolean
}

// Attempts
export type CreateAttemptRequest = {
  problemId: string
  audioUrl: string
}

export type CreateAttemptResponse = {
  attemptId: string
  status: string
}

export type GetAttemptResponse = {
  id: string
  status: 'processing' | 'completed' | 'failed'
  score?: number
  feedback_summary?: string
  transcription?: string
  error_message?: string
}

// Problems
export type GetProblemsResponse = {
  problems: Array<{
    id: string
    title: string
    context: string
    difficulty: string
    category: string
  }>
}

// Storage
export type SignedUrlResponse = {
  signedUrl: string
  path: string
}
