import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getOpenAIConfig } from '@/lib/openai/config'

const openai = new OpenAI({
  apiKey: getOpenAIConfig().apiKey,
  baseURL: 'https://api.openai.com/v1',
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Handle your OpenAI API calls here
    // Return response
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 