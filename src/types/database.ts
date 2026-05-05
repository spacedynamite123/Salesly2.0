export type Problem = {
  id: string
  title: string
  context: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  created_at: string
  archived?: boolean
}

export type Attempt = {
  id: string
  user_id: string
  problem_id: string
  audio_url: string
  transcription: string | null
  score: number | null
  feedback_summary: string | null
  feedback_detailed: string | null
  areas_to_improve: string[] | null
  strengths: string[] | null
  status: 'processing' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  total_attempts: number
  average_score: number
  best_score: number | null
  current_streak: number
  created_at: string
  updated_at: string
}
