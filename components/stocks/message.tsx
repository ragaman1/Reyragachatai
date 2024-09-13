'use client'

import { cn } from '@/lib/utils'
import { spinner } from './spinner'
import { CodeBlock } from '../ui/codeblock'
import { MemoizedReactMarkdown } from '../markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { StreamableValue } from 'ai/rsc'
import { useStreamableText } from '@/lib/hooks/use-streamable-text'

// Different types of message bubbles.

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative flex flex-col items-start">
      <div className="text-sm font-bold text-red-500 mb-1">User</div>
      <div className="flex-1 space-y-1 overflow-hidden">{children}</div>
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

  return (
    <div className={cn('group relative flex flex-col items-start', className)}>
      <div className="text-sm font-bold text-gray-500 mb-1">Answer</div>
      <div className="flex-1 w-full overflow-hidden">
        <div className="overflow-x-auto">
          <MemoizedReactMarkdown
            className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              p({ children }) {
                return (
                  <p className="mb-1 last:mb-0 whitespace-normal">{children}</p>
                )
              },
              code({ node, inline, className, children, ...props }) {
                if (children.length) {
                  if (children[0] == '▍') {
                    return (
                      <span className="mt-1 animate-pulse cursor-default">
                        ▍
                      </span>
                    )
                  }

                  children[0] = (children[0] as string).replace('`▍`', '▍')
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
            }}
          >
            {text}
          </MemoizedReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export function BotCard({
  children,
  showAvatar = true
}: {
  children: React.ReactNode
  showAvatar?: boolean
}) {
  return (
    <div className="group relative flex flex-col items-start">
      <div className="text-sm font-bold text-gray-500 mb-1">AI</div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        'mt-1 flex items-center justify-center gap-1 text-xs text-gray-500'
      }
    >
      <div className={'max-w-[600px] flex-initial p-1'}>{children}</div>
    </div>
  )
}

export function SpinnerMessage() {
  return (
    <div className="group relative flex flex-col items-start">
      <div className="text-sm font-bold text-gray-500 mb-1">AI</div>
      <div className="h-[24px] flex flex-row items-center flex-1 overflow-hidden">
        {spinner}
      </div>
    </div>
  )
}
