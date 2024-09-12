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

  // Track whether the keyboard is open
  const [keyboardOpen, setKeyboardOpen] = React.useState(false)

  // Prevent body scroll when the keyboard is open
  const preventBodyScroll = () => {
    document.body.style.overflow = 'hidden'
  }

  // Restore body scroll when keyboard is closed
  const restoreBodyScroll = () => {
    document.body.style.overflow = 'auto'
  }

  // Handle focus (keyboard opens)
  const handleFocus = () => {
    setKeyboardOpen(true)
    preventBodyScroll()
  }

  // Handle blur (keyboard closes)
  const handleBlur = () => {
    setKeyboardOpen(false)
    restoreBodyScroll()
  }

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

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
      className="relative w-full max-w-xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
    >
      <div className="flex items-end justify-between space-x-4">
        {/* Removed the IconPlus button */}

        {/* Textarea for Message Input */}
        <div className="relative flex-grow">
          <Textarea
            ref={inputRef}
            className="w-full resize-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm rounded-none"
            placeholder="Type your message..."
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            minRows={1}
            maxRows={4}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          size="icon"
          disabled={!input}
          className={`ml-2 p-2 transition-all ${
            input
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-300 dark:bg-gray-600'
          } text-white focus:ring-2 focus:ring-blue-300`}
        >
          <IconArrowElbow />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </form>
  )
}
