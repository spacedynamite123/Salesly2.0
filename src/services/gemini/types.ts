export type GeminiEvaluationRequest = {
  transcription: string
  scenarioContext: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export type GeminiEvaluationResponse = {
  score: number // 0-100
  feedback_summary: string // 1-2 lines
  feedback_detailed: string // Full feedback paragraph
  areas_to_improve: string[] // 3-5 bullet points
  strengths: string[] // 2-3 bullet points
}

export type GeminiRawResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}
