'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Send, Trash2, Loader2, MessageSquare, X } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface SavedDoc {
  id: string
  prompt: string
  created_at: string
  metadata?: { filename?: string }
}

export default function PDFChatPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [documentText, setDocumentText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savedDocs, setSavedDocs] = useState<SavedDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const fetchSavedDocs = useCallback(async () => {
    setLoadingDocs(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .eq('tool', 'pdf-chat')
        .order('created_at', { ascending: false })
        .limit(20)
      setSavedDocs(data || [])
    } catch {
      // silent
    } finally {
      setLoadingDocs(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSavedDocs()
  }, [fetchSavedDocs])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const uint8 = new Uint8Array(arrayBuffer)
          // Basic text extraction: scan for readable ASCII text sequences
          let text = ''
          let seq = ''
          for (let i = 0; i < uint8.length; i++) {
            const byte = uint8[i]
            if (byte >= 32 && byte <= 126) {
              seq += String.fromCharCode(byte)
            } else {
              if (seq.length > 4) text += seq + ' '
              seq = ''
            }
          }
          if (seq.length > 4) text += seq
          // Clean up: collapse whitespace, filter junk
          const cleaned = text
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s.,!?;:'"()\-–—]/g, '')
            .trim()
            .slice(0, 50000)
          resolve(cleaned || 'Could not extract text from this PDF.')
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large (max 20MB)')
      return
    }

    setUploading(true)
    try {
      const text = await extractTextFromPDF(file)
      setUploadedFile(file)
      setDocumentText(text)
      setMessages([])
      toast.success(`${file.name} loaded successfully`)

      // Save to Supabase as a record
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('generations').insert({
          user_id: user.id,
          tool: 'pdf-chat',
          prompt: file.name,
          result: text.slice(0, 1000),
          metadata: { filename: file.name, size: file.size },
        })
        fetchSavedDocs()
      }
    } catch {
      toast.error('Failed to process PDF')
    } finally {
      setUploading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    if (!documentText) {
      toast.error('Please upload a PDF first')
      return
    }

    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/pdf-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg.content,
          documentText,
          messages: messages,
        }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || data.message || 'No response.' }])
    } catch {
      toast.error('Failed to get response')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setUploadedFile(null)
    setDocumentText('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <DashboardLayout>
      <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar — saved docs */}
        <aside className="w-64 flex-shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h1 className="text-base font-bold">AURA PDF Chat</h1>
            <p className="text-xs text-white/30 mt-1">Chat with any PDF</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3 px-1">Recent PDFs</p>
            {loadingDocs ? (
              <div className="flex justify-center py-6">
                <Loader2 size={16} className="text-white/30 animate-spin" />
              </div>
            ) : savedDocs.length === 0 ? (
              <p className="text-white/20 text-xs px-1 py-4 text-center">No PDFs yet</p>
            ) : (
              <div className="space-y-1">
                {savedDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-all group cursor-default"
                  >
                    <FileText size={12} className="text-white/30 flex-shrink-0" />
                    <span className="text-xs text-white/50 truncate flex-1">{doc.prompt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Upload bar */}
          <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 border-b border-white/[0.06]">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Processing...' : 'Upload PDF'}
            </button>

            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl text-sm"
              >
                <FileText size={13} className="text-white/40" />
                <span className="text-white/70 max-w-xs truncate">{uploadedFile.name}</span>
                <button onClick={clearChat} className="text-white/30 hover:text-white/70 ml-1 transition-colors">
                  <X size={13} />
                </button>
              </motion.div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <MessageSquare className="w-16 h-16 text-white/10 mb-4" />
                {uploadedFile ? (
                  <>
                    <p className="text-white/40 text-sm mb-2">PDF loaded: <span className="text-white/60">{uploadedFile.name}</span></p>
                    <p className="text-white/30 text-sm">Ask anything about the document</p>
                  </>
                ) : (
                  <>
                    <p className="text-white/40 text-sm mb-2">Upload a PDF to get started</p>
                    <p className="text-white/20 text-xs">Supports documents up to 20MB</p>
                  </>
                )}
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-white text-black rounded-br-md'
                        : 'glass text-white/80 rounded-bl-md'
                    }`}
                  >
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="glass rounded-2xl rounded-bl-md px-5 py-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.06]">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={uploadedFile ? 'Ask a question about the PDF...' : 'Upload a PDF first...'}
                disabled={!uploadedFile || loading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !uploadedFile || loading}
                className="px-4 py-3 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
