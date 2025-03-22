import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { openai } from '@/lib/openai/config'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    return NextResponse.json(response.choices[0].message)
  } catch (error) {
    console.error('Error in OpenAI route:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 