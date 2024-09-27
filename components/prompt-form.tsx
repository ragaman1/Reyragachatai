'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { useActions, useUIState } from 'ai/rsc'
import { UserMessage } from './stocks/message'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button'
import { IconArrowElbow } from '@/components/ui/icons'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'

// Regular expression to detect RTL characters (like Farsi, Arabic, Hebrew, etc.)
const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/

export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const { formRef } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()

  // Track text direction (LTR or RTL)
  const [direction, setDirection] = React.useState<'ltr' | 'rtl'>('ltr')

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Detect if the input text contains RTL characters
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)

    // Check if the input contains RTL characters and update the direction
    if (rtlRegex.test(value)) {
      setDirection('rtl')
    } else {
      setDirection('ltr')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 600) {
      e.preventDefault()
      formRef.current?.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      )
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        e.preventDefault()

        const value = input.trim()
        setInput('')
        if (!value) return

        // Optimistically add user message UI
        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            display: <UserMessage>{value}</UserMessage>
          }
        ])

        // Submit and get response message
        const responseMessage = await submitUserMessage(value)
        setMessages(currentMessages => [...currentMessages, responseMessage])
      }}
      className="relative w-full mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6 
           max-w-2xl 
           md:max-w-3xl 
           lg:max-w-4xl 
           xl:max-w-5xl 
           2xl:max-w-6xl"
    >
      <div className="flex flex-col">
        {/* Textarea Container */}
        <div className="relative">
          <Textarea
            ref={inputRef}
            className={`w-full resize-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 pr-14 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm border border-gray-300 dark:border-gray-600 rounded-md ${
              direction === 'rtl' ? 'text-right' : 'text-left'
            }`}
            placeholder="message"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            minRows={1}
            maxRows={6}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            dir={direction} // Dynamically set text direction
          />

          {/* Send Icon Positioned at Bottom-Right */}
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className={`absolute bottom-2 right-2 flex items-center justify-center p-2 transition-all ${
              input.trim()
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
            } text-white focus:ring-2 focus:ring-blue-300 rounded-md`}
          >
            <IconArrowElbow />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </form>
  )
}
