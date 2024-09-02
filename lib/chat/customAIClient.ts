// lib/customAIClient.ts

import { AIStream } from 'ai'

export async function customAIStream(prompt: string) {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Authorization', `Bearer ${process.env.CUSTOM_AI_API_KEY}`)

  const raw = JSON.stringify({
    model: 'gpt-4o-mini',
    provider: 'azure-ai',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.5,
    max_tokens: 1000,
    stream: true
  })

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw
  }

  const response = await fetch(
    'https://api.unify.ai/v0/chat/completions',
    requestOptions
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return AIStream(response)
}
