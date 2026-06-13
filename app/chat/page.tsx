'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Plus, Send, Trash2, Edit2, Check, X, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase'
import type { Chat, Message } from '@/types'

// ─── Markdown renderer (basic regex) ──────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-white/5 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono whitespace-pre-wrap"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n/g, '<br />')
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <Brain size={14} className="text-white/70" />
      </div>
      <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white/50"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] bg-white text-black rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <Brain size={14} className="text-white/70" />
      </div>
      <div className="glass max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed">
        <div
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          className="prose-invert"
        />
      </div>
    </div>
  )
}

// ─── Chat sidebar item ────────────────────────────────────────────────────────

function ChatItem({
  chat,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  chat: Chat
  active: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(chat.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function handleSave() {
    const trimmed = title.trim()
    if (!trimmed) { setTitle(chat.title); setEditing(false); return }
    onRename(trimmed)
    setEditing(false)
  }

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
        active ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
      onClick={() => !editing && onSelect()}
    >
      <MessageSquare size={14} className="flex-shrink-0 text-white/40" />

      {editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setTitle(chat.title); setEditing(false) } }}
          className="flex-1 bg-transparent text-white text-xs outline-none min-w-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-xs text-white/70 truncate">{chat.title}</span>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {editing ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleSave() }}
              className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white"
            >
              <Check size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setTitle(chat.title); setEditing(false) }}
              className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true) }}
              className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const supabase = createClient()

  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [loadingChats, setLoadingChats] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Fetch user + chats
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) { toast.error('Failed to load chats'); return }
      setChats(data ?? [])
      setLoadingChats(false)
    }
    init()
  }, [supabase])

  // Load messages when chat changes
  useEffect(() => {
    if (!activeChatId) { setMessages([]); return }

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true })

      if (error) { toast.error('Failed to load messages'); return }
      setMessages(data ?? [])
    }
    fetchMessages()
  }, [activeChatId, supabase])

  async function createNewChat() {
    if (!userId) return
    const { data, error } = await supabase
      .from('chats')
      .insert({ user_id: userId, title: 'New Chat' })
      .select()
      .single()

    if (error) { toast.error('Failed to create chat'); return }
    setChats((prev) => [data, ...prev])
    setActiveChatId(data.id)
    setMessages([])
  }

  async function renameChat(chatId: string, title: string) {
    const { error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId)

    if (error) { toast.error('Failed to rename'); return }
    setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, title } : c))
  }

  async function deleteChat(chatId: string) {
    const { error } = await supabase.from('chats').delete().eq('id', chatId)
    if (error) { toast.error('Failed to delete chat'); return }
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (activeChatId === chatId) { setActiveChatId(null); setMessages([]) }
  }

  async function sendMessage() {
    const content = input.trim()
    if (!content || streaming) return

    // Create chat if none selected
    let chatId = activeChatId
    if (!chatId) {
      if (!userId) return
      const { data, error } = await supabase
        .from('chats')
        .insert({ user_id: userId, title: content.slice(0, 40) })
        .select()
        .single()

      if (error) { toast.error('Failed to create chat'); return }
      chatId = data.id
      setChats((prev) => [data, ...prev])
      setActiveChatId(chatId)
    }

    if (!chatId) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      chat_id: chatId,
      user_id: userId!,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setStreaming(true)

    // Resize textarea
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }

    const history = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, chatId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Request failed')
      }

      // Stream
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        chat_id: chatId as string,
        user_id: userId!,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setMessages((prev) => prev.map((m) =>
          m.id === assistantMessage.id ? { ...m, content: accumulated } : m
        ))
      }

      // Auto-rename chat if it's still "New Chat"
      const currentChat = chats.find((c) => c.id === chatId)
      if (currentChat?.title === 'New Chat') {
        renameChat(chatId as string, content.slice(0, 40))
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
      setMessages((prev) => prev.filter((m) => m.role !== 'assistant' || m.content !== ''))
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  return (
    <DashboardLayout className="!overflow-hidden !pb-0">
      <div className="flex h-full">

        {/* ── Chat list sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 flex-shrink-0 border-r border-white/[0.06] h-full">
          <div className="p-3 border-b border-white/[0.06]">
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 glass rounded-xl py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
            >
              <Plus size={15} />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loadingChats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 rounded-xl bg-white/[0.04] animate-pulse" />
              ))
            ) : chats.length === 0 ? (
              <p className="text-center text-white/30 text-xs py-8">No chats yet</p>
            ) : (
              chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  active={activeChatId === chat.id}
                  onSelect={() => setActiveChatId(chat.id)}
                  onRename={(title) => renameChat(chat.id, title)}
                  onDelete={() => deleteChat(chat.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Main chat area ── */}
        <div className="flex flex-col flex-1 min-w-0 h-full">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Brain size={28} className="text-white/60" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">AURA Brain</h2>
                  <p className="text-white/40 text-sm">How can I help you today?</p>
                </div>
              </motion.div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MessageBubble message={msg} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {streaming && messages[messages.length - 1]?.role === 'user' && (
                  <TypingIndicator />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-white/[0.06] p-4">
            <div className="max-w-3xl mx-auto">
              <div className="glass rounded-2xl flex items-end gap-3 px-4 py-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AURA Brain… (Enter to send, Shift+Enter for newline)"
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none resize-none min-h-[24px] max-h-[160px] leading-relaxed"
                  rows={1}
                  disabled={streaming}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="flex-shrink-0 w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-center text-white/20 text-xs mt-2">
                AURA Brain may produce inaccurate information
              </p>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
