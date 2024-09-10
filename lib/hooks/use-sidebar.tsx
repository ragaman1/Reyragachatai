'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconPlus } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'

export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Handle submit logic
    }
  }

  return (
    <form className="w-full flex items-center px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-md rounded-lg">
      {/* New Chat Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-2"
            onClick={() => router.push('/new')}
          >
            <IconPlus className="w-6 h-6" />
            <span className="sr-only">New Chat</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>New Chat</TooltipContent>
      </Tooltip>

      {/* Message Input Area */}
      <div className="relative flex-grow mx-4">
        <Textarea
          ref={inputRef}
          placeholder="Type a message..."
          className="w-full resize-none bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full text-sm border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all focus:outline-none shadow-md"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          minRows={1}
          maxRows={4}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Send Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="submit"
            size="icon"
            disabled={input === ''}
            className={`ml-2 ${input !== '' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} text-white p-2 rounded-full transition-all focus:ring-2 focus:ring-blue-300`}
          >
            <IconArrowElbow className="w-5 h-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Send message</TooltipContent>
      </Tooltip>
    </form>
  )
}
