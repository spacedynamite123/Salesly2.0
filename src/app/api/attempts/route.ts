import { supabaseAdmin } from '@/lib/supabase-admin'
import { evaluateSalesResponse } from '@/services/gemini'
import { NextRequest, NextResponse } from 'next/server'

type Attempt = {
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

async function createAttempt(data: {
  userId: string
  problemId: string
  audioUrl: string
}): Promise<Attempt> {
  const { data: attempt, error } = await supabaseAdmin
    .from('attempts')
    .insert({
      user_id: data.userId,
      problem_id: data.problemId,
      audio_url: data.audioUrl,
      status: 'processing',
    })
    .select()
    .single()

  if (error) throw error
  return attempt as Attempt
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split('Bearer ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle both JSON and FormData requests
    let problemId: string
    let audioBlob: Blob | null = null

    const contentType = req.headers.get('content-type')
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (audio upload)
      const formData = await req.formData()
      const audioFile = formData.get('audio')
      problemId = formData.get('problemId') as string

      if (!audioFile || typeof audioFile === 'string') {
        return NextResponse.json(
          { error: 'Missing audio file' },
          { status: 400 }
        )
      }

      audioBlob = audioFile as Blob
    } else {
      // Handle JSON (legacy)
      const { problemId: id, audioUrl } = await req.json()
      problemId = id
      if (!problemId || !audioUrl) {
        return NextResponse.json(
          { error: 'Missing problemId or audioUrl' },
          { status: 400 }
        )
      }
    }

    if (!problemId) {
      return NextResponse.json(
        { error: 'Missing problemId' },
        { status: 400 }
      )
    }

    // Create attempt record
    const finalAudioUrl = audioBlob 
      ? `blob:${Date.now()}`
      : `https://placeholder-${Date.now()}.audio`

    const attempt = await createAttempt({
      userId: user.id,
      problemId,
      audioUrl: finalAudioUrl,
    })

    // Get scenario to know context and difficulty
    const { data: scenario, error: scenarioError } = await supabaseAdmin
      .from('problems')
      .select('*')
      .eq('id', problemId)
      .single()

    if (scenarioError || !scenario) {
      throw new Error('Scenario not found')
    }

    // For MVP: Use mock transcription
    // TODO Phase 2: Integrate Google Speech-to-Text
    const mockTranscription = `Thank you for taking my call today. I know you're busy, so I'll be brief. 
      I'm calling because we work with companies like yours to help them [value prop]. 
      Is now a good time for a quick conversation?`

    try {
      // Evaluate with Gemini
      const evaluation = await evaluateSalesResponse(
        mockTranscription,
        scenario.context,
        scenario.difficulty
      )

      // Update attempt with results
      const { error: updateError } = await supabaseAdmin
        .from('attempts')
        .update({
          transcription: mockTranscription,
          score: evaluation.score,
          feedback_summary: evaluation.feedback_summary,
          feedback_detailed: evaluation.feedback_detailed,
          areas_to_improve: evaluation.areas_to_improve,
          strengths: evaluation.strengths,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', attempt.id)

      if (updateError) throw updateError

      return NextResponse.json({
        attemptId: attempt.id,
        status: 'completed',
        score: evaluation.score,
      })
    } catch (evaluationError) {
      // If evaluation fails, mark attempt as failed
      const errorMessage =
        evaluationError instanceof Error
          ? evaluationError.message
          : 'Unknown evaluation error'

      await supabaseAdmin
        .from('attempts')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', attempt.id)

      return NextResponse.json(
        { error: 'Evaluation failed', details: errorMessage },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split('Bearer ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const attemptId = searchParams.get('id')

    if (!attemptId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { data: attempt, error } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json(attempt)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attempt' },
      { status: 500 }
    )
  }
}
