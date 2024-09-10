'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { useActions, useUIState } from 'ai/rsc'
import { UserMessage } from './stocks/message'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconPlus } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'

export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const router = useRouter()
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

        // Blur focus on mobile
        if (window.innerWidth < 600) {
          e.target['message']?.blur()
        }

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
    >
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
        <div className="flex items-end relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 bottom-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
                onClick={() => {
                  router.push('/new')
                }}
              >
                <IconPlus />
                <span className="sr-only">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>

          <div className="w-full pr-12">
            {' '}
            {/* Extra padding for fixed button */}
            <Textarea
              ref={inputRef}
              tabIndex={0}
              onFocus={handleFocus} // Detect keyboard open
              onBlur={handleBlur} // Detect keyboard close
              onKeyDown={handleKeyDown}
              placeholder="Send a message."
              className="max-h-[150px] w-full resize-none bg-transparent px-4 py-[1.3rem] pb-10 focus-within:outline-none sm:text-sm overflow-y-auto" // Auto resize and scrollable
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              name="message"
              minRows={1}
              maxRows={4} // Set max rows to limit the size of the textarea before scrolling
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {/* Send button */}
          <div className="absolute right-0 bottom-[13px] sm:right-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" size="icon" disabled={input === ''}>
                  <IconArrowElbow />
                  <span className="sr-only">Send message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </form>
  )
}
