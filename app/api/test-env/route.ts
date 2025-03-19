import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!process.env.OPENAI_API_KEY,
    hasAssistantId: !!process.env.OPENAI_ASSISTANT_ID,
  })
} 