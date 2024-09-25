import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'

import { createOpenAI } from '@ai-sdk/openai' // Import createOpenAI

import { BotCard, BotMessage, SystemMessage } from '@/components/stocks'

import { z } from 'zod'
import { runAsyncFnWithoutBlocking, nanoid } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'

// First, let's assume you have two API keys stored in your environment variables
const API_KEY_1 = process.env.OPENAI_API_KEY
const API_KEY_2 = process.env.OPENAI_API_KEY_2

// Function to randomly select an API key
function getRandomAPIKey() {
  return Math.random() < 0.5 ? API_KEY_1 : API_KEY_2
}

// Retry logic function with timeout handling new branch
async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
  timeoutMs = 5000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Set up the timeout using AbortController
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)

      // Execute the function, passing in the AbortController signal
      const result = await fn()
      clearTimeout(timeout) // Clear the timeout if successful
      return result
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Attempt ${attempt} failed:`, error.message)
      } else {
        console.error('An unknown error occurred:', error)
      }

      if (attempt < retries) {
        console.log(`Retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs)) // Delay before retrying
      } else {
        throw new Error(`All ${retries} attempts failed.`)
      }
    }
  }

  throw new Error('Unable to complete the request.')
}

// Define the AIState type
export type AIState = {
  chatId: string
  messages: Message[] // Assuming Message is another type
}

// Define the UIState type
export type UIState = {
  id: string
  display: React.ReactNode
}[]

// Function to create an OpenAI instance with a random API key
function makeOpenAICall() {
  return createOpenAI({
    baseURL: process.env.BaseURL, // Replace with your proxy URL
    apiKey: getRandomAPIKey(), // Use the random API key selection function
    compatibility: 'strict' // Enable strict mode if needed
  })
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  try {
    // Retry logic with timeout handling
    const result = await retryWithTimeout(
      async () => {
        return streamUI({
          model: makeOpenAICall()('chatgpt-4o-latest'), // Use the custom OpenAI instance with random API key
          initial: <SystemMessage>Loading...</SystemMessage>,
          maxTokens: 4000,
          system: `You are a fun AI assistant in coding`,
          messages: [
            ...aiState.get().messages.map((message: any) => ({
              role: message.role,
              content: message.content,
              name: message.name
            }))
          ],
          text: ({ content, done, delta }) => {
            if (!textStream) {
              textStream = createStreamableValue('')
              textNode = <BotMessage content={textStream.value} />
            }

            if (done) {
              textStream.done()
              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  {
                    id: nanoid(),
                    role: 'assistant',
                    content
                  }
                ]
              })
            } else {
              textStream.update(delta)
            }

            return textNode
          },
          tools: {
            // You can add any custom tools here if needed
          }
        })
      },
      3, // Number of retries
      1000, // Delay between retries (1 second)
      5000 // Timeout for each request (5 seconds)
    )

    return {
      id: nanoid(),
      display: result.value
    }
  } catch (error) {
    // Type-safe error handling
    if (error instanceof Error) {
      console.error('Error occurred during message submission:', error.message)
    } else {
      console.error(
        'An unknown error occurred during message submission:',
        error
      )
    }

    // Optionally, update the AI state to reflect that an error occurred
    aiState.update({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content:
            'An error occurred while processing your request. Please try again.'
        }
      ]
    })

    // Return a fallback UI with an error message
    return {
      id: nanoid(),
      display: (
        <SystemMessage>
          Error: Unable to process your request. Please try again.
        </SystemMessage>
      )
    }
  }
}

// Define AI object or import it
export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'user' ? (
          <SystemMessage>{message.content as string}</SystemMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
