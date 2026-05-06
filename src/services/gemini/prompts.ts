export const SALES_EVALUATION_SYSTEM_PROMPT = `You are an expert sales coach evaluating sales interview responses.

Your job is to:
1. Score the response from 0-100
2. Provide constructive feedback
3. Identify strengths and areas to improve

Always respond with valid JSON (no markdown code blocks).`

export function buildEvaluationPrompt(
  transcription: string,
  scenarioContext: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): string {
  const difficultyGuidelines = {
    beginner: 'Basic conversation flow, handling objections calmly',
    intermediate: 'Discovery questions, value proposition clarity, handling multiple objections',
    advanced: 'Advanced objection handling, consultative approach, closing techniques',
  }

  return `
SCENARIO:
${scenarioContext}

DIFFICULTY LEVEL: ${difficulty}
Expected skills: ${difficultyGuidelines[difficulty]}

CANDIDATE RESPONSE:
"${transcription}"

Evaluate this response and return JSON with this exact structure:
{
  "score": <number 0-100>,
  "feedback_summary": "<1-2 sentence summary>",
  "feedback_detailed": "<detailed feedback paragraph>",
  "areas_to_improve": ["<issue 1>", "<issue 2>", "<issue 3>"],
  "strengths": ["<strength 1>", "<strength 2>"]
}

Scoring guidelines:
- 90-100: Excellent - Perfect objection handling, clear value prop, strong closing
- 70-89: Good - Solid approach, minor areas to improve
- 50-69: Fair - Basic response, several areas to develop
- Below 50: Needs work - Missing key sales fundamentals

Return ONLY the JSON, no other text.
`
}
