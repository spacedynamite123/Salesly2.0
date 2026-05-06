import { GeminiEvaluationResponse, GeminiRawResponse } from './types'
import {
  SALES_EVALUATION_SYSTEM_PROMPT,
  buildEvaluationPrompt,
} from './prompts'

export async function evaluateSalesResponse(
  transcription: string,
  scenarioContext: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<GeminiEvaluationResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`

  const prompt = buildEvaluationPrompt(transcription, scenarioContext, difficulty)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SALES_EVALUATION_SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          max_output_tokens: 500,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    const data: GeminiRawResponse = await response.json()

    // Extract text from response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!responseText) {
      throw new Error('No response from Gemini API')
    }

    // Parse JSON
    const parsed = parseGeminiResponse(responseText)
    return validateEvaluationResponse(parsed)
  } catch (error) {
    console.error('Gemini evaluation error:', error)
    throw error
  }
}

function parseGeminiResponse(text: string): unknown {
  // Remove markdown code blocks if present
  let cleanText = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  // Try to extract JSON if it's embedded in text
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleanText = jsonMatch[0]
  }

  try {
    return JSON.parse(cleanText)
  } catch (err) {
    throw new Error(`Failed to parse Gemini response: ${cleanText}`)
  }
}

function validateEvaluationResponse(data: unknown): GeminiEvaluationResponse {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Response is not an object')
  }

  const obj = data as Record<string, unknown>

  // Validate required fields
  const score = obj.score
  if (typeof score !== 'number' || score < 0 || score > 100) {
    throw new Error('Invalid score: must be 0-100')
  }

  const feedbackSummary = obj.feedback_summary
  if (typeof feedbackSummary !== 'string' || feedbackSummary.length === 0) {
    throw new Error('Invalid feedback_summary')
  }

  const feedbackDetailed = obj.feedback_detailed
  if (typeof feedbackDetailed !== 'string' || feedbackDetailed.length === 0) {
    throw new Error('Invalid feedback_detailed')
  }

  const areasToImprove = obj.areas_to_improve
  if (
    !Array.isArray(areasToImprove) ||
    !areasToImprove.every((item) => typeof item === 'string')
  ) {
    throw new Error('Invalid areas_to_improve')
  }

  const strengths = obj.strengths
  if (
    !Array.isArray(strengths) ||
    !strengths.every((item) => typeof item === 'string')
  ) {
    throw new Error('Invalid strengths')
  }

  return {
    score,
    feedback_summary: feedbackSummary,
    feedback_detailed: feedbackDetailed,
    areas_to_improve: areasToImprove,
    strengths: strengths,
  }
}
