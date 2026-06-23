import { useEffect, useRef, useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

function App(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const customization: {
    user: {
      name: string;
      timezone: string;
    };
    assistant: {
      instructions: string;
    };
  } = {
    user: {
      name: "Tracey",
      timezone: "America/Los_Angeles",
    },
    assistant: {
      instructions: "Your name is Lux. You are a helpful assistant for an adult with ADHD. PERSONALITY: Polite, friendly, supportive, but also truthful. Word responses so they are easy to understand.",
    }
  }

  useEffect(() => {
    window.qvacAPI.loadModel().then(() => setLoading(false))

    window.qvacAPI.onCompletionStream((token) => {
      if (token === '') {
        setProcessing(false)
      } else {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1].content += token
          return updated
        })
      }
    })

    return () => { window.qvacAPI.unloadModel() }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (): void => {
    if (!input.trim() || processing || loading) return

    const nextHistory: Message[] = [
      ...messages,
      { role: 'user', content: input }
    ]
    setMessages([...nextHistory, { role: 'assistant', content: '' }])
    window.qvacAPI.infer([
      { role: 'system', content: customization.assistant.instructions },
      ...nextHistory
    ])
    setInput('')
    setProcessing(true)
  }

  const [isToggled, setIsToggled] = useState(false)

  const handleToggle = () => {
    setIsToggled(!isToggled)
  }

  return (
    <div id="container" className="flex items-center justify-between md:justify-center flex-col w-screen">
      <span className="ml-auto flex items-center gap-2 text-sm absolute top-0 right-4">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
          }`}
        />
        {loading ? 'Loading model…' : 'Ready'}
      </span>
      {/* Header */}
      <header className="flex items-center pt-2 gap-3 px-6">
        <div className="flex gap-8 items-center font-monospace">
          <h1 className="size-15 pt-15 overflow-hidden rounded-full">Lux</h1>
          <span>Hello {customization.user.name}!</span>
        </div>
        {/* Theme switcher */}
        <span className="flex gap-4 theme-switcher hidden">
          <button class="pt-6 size-6 overflow-hidden">Light Mode</button>
          <button class="pt-6 size-6 overflow-hidden">Dark Mode</button>
        </span>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="flex gap-1">
              <span className="block size-2 rounded-full bg-stone-700 dark:bg-zinc-600 animate-bounce [animation-delay:0ms]" />
              <span className="block size-2 rounded-full bg-stone-700 dark:bg-zinc-600 animate-bounce [animation-delay:150ms]" />
              <span className="block size-2 rounded-full bg-stone-700 dark:bg-zinc-600 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            let thinking_module = [
              `<div class="think-container border-1 border-stone-600 rounded-lg ">`,
                `<button class="p-4 border-inherit border-b-1" aria-expanded="${isToggled ? 'false' : 'true'}" onClick=${handleToggle()}>View Thinking</button>`,
                `<think class="p-4">$1</think>`,
              `</div>`,
            ]

            return (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-3xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-stone-300 dark:bg-zinc-800 text-stone-800 dark:text-zinc-100 rounded-bl-md'
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.content.replace(/<think>(.+)<\/think>/s,
                    `${thinking_module.join("")}</div>`
                  ) }}
                />
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <div className={loading ? `hidden ` : `block ` + "p-4 bg-zinc-100 dark:bg-zinc-800 rounded-3xl w-3/4"}>
        <div className="flex gap-3 w-full">
          <textarea
            className="px-4 py-3 text-sm outline-none placeholder:text-zinc-500 flex-1 resize-none"
            rows={1}
            placeholder="Type a message…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            onClick={handleSend}
            ariaLabel="Send"
            disabled={processing || loading}
            className="self-end sr-only lg:not-sr-only aspect-square block rounded-3xl bg-indigo-600 lg:px-4 lg:py-3 transition-padding-top hover:pt-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
