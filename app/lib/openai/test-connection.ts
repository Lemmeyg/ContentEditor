import { openai } from './config'

export async function testOpenAIConnection() {
  try {
    // Test the connection by listing available models
    const models = await openai.models.list()
    console.log('✅ OpenAI Connection Successful')
    console.log('Available models:', models.data.map(model => model.id))
    return true
  } catch (error: any) {
    console.error('❌ OpenAI Connection Failed:', {
      message: error.message,
      status: error.status,
      type: error.type
    })
    return false
  }
}

export async function testAssistantAccess() {
  try {
    const assistantId = process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID
    if (!assistantId) {
      throw new Error('Assistant ID not configured in NEXT_PUBLIC_OPENAI_ASSISTANT_ID')
    }

    // First verify the API connection
    const connectionTest = await testOpenAIConnection()
    if (!connectionTest) {
      throw new Error('OpenAI API connection failed')
    }

    // Then try to retrieve the assistant
    const assistant = await openai.beta.assistants.retrieve(assistantId)
    console.log('✅ Assistant Access Successful')
    console.log('Assistant Details:', {
      id: assistant.id,
      name: assistant.name,
      model: assistant.model,
      instructions: assistant.instructions?.slice(0, 100) + '...'
    })
    return true
  } catch (error: any) {
    console.error('❌ Assistant Access Failed:', {
      message: error.message,
      status: error.status,
      type: error.type
    })
    return false
  }
} 