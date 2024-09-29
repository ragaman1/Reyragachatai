'use client'

import { cn } from '@/lib/utils'
import { spinner } from './spinner'
import { CodeBlock } from '../ui/codeblock'
import { MemoizedReactMarkdown } from '../markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { StreamableValue } from 'ai/rsc'
import { useStreamableText } from '@/lib/hooks/use-streamable-text'

// Regular expression to detect RTL characters (like Farsi, Arabic, Hebrew, etc.)
const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/

// Function to detect direction based on content
function detectDirection(text: string) {
  return rtlRegex.test(text) ? 'rtl' : 'ltr'
}

// Responsive container for chat messages
export function ChatContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] mx-auto px-4">
      {children}
    </div>
  )
}

// Different types of message bubbles.
export function UserMessage({ children }: { children: React.ReactNode }) {
  const direction = detectDirection(children?.toString() || '')

  return (
    <div className="group relative flex flex-col items-start" dir={direction}>
      <div className="text-sm font-bold text-red-500 mb-1">User</div>
      <div className="flex-1 w-full overflow-hidden">
        <div className="bg-blue-500 text-white p-3 rounded-2xl">{children}</div>
      </div>
    </div>
  )
}
export function BotMessage({
  content,
  className
}: {
  content: string | StreamableValue<string>
  className?: string
}) {
  const text = useStreamableText(content)
  const direction = detectDirection(text)

  return (
    <div
      className={cn('group relative flex flex-col items-start', className)}
      dir={direction}
    >
      {/* Bot name */}
      <div className="text-sm font-bold text-red-500 mb-1">Answer</div>

      {/* Message bubble with consistent background */}
      <div className="flex-1 w-full overflow-hidden">
        <div className="overflow-x-auto bg-gray-700 text-white p-3 rounded-2xl">
          <MemoizedReactMarkdown
            className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              code({ node, inline, className, children, ...props }) {
                if (children.length) {
                  if (children[0] == '▍') {
                    return (
                      <span className="mt-1 animate-pulse cursor-default">
                        ▍
                      </span>
                    )
                  }
                  children[0] = (children[0] as string).replace('▍', '▍')
                }
                const match = /language-(\w+)/.exec(className || '')
                if (inline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
                return (
                  <div className="w-full overflow-auto">
                    <CodeBlock
                      key={Math.random()}
                      language={(match && match[1]) || ''}
                      value={String(children).replace(/\n$/, '')}
                      {...props}
                    />
                  </div>
                )
              }
              // You can customize other elements here if needed
            }}
          >
            {text}
          </MemoizedReactMarkdown>
        </div>
      </div>
    </div>
  )
}
