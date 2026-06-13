'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen, FileText, Plus, Trash2, Download, Sparkles,
  ChevronRight, ChevronDown, BookOpen, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase'

interface Folder {
  id: string
  name: string
  user_id?: string
}

interface Note {
  id: string
  title: string
  content: string
  folder_id: string | null
  user_id?: string
  updated_at?: string
}

type AICommand = 'Expand' | 'Summarize' | 'Fix grammar'

export default function NotebookPage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiMenu, setShowAiMenu] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: foldersData }, { data: notesData }] = await Promise.all([
        supabase.from('folders').select('*').eq('user_id', user.id).order('name'),
        supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      ])

      setFolders(foldersData || [])
      setNotes(notesData || [])
    } catch {
      toast.error('Failed to load notebook')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Sync selected note fields
  useEffect(() => {
    if (selectedNote) {
      setNoteContent(selectedNote.content || '')
      setNoteTitle(selectedNote.title || '')
    } else {
      setNoteContent('')
      setNoteTitle('')
    }
  }, [selectedNote?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveNote = useCallback(async (id: string, title: string, content: string) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('notes')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      setNotes(prev => prev.map(n => n.id === id ? { ...n, title, content } : n))
    } catch {
      toast.error('Auto-save failed')
    } finally {
      setSaving(false)
    }
  }, [supabase])

  const handleContentChange = (val: string) => {
    setNoteContent(val)
    if (!selectedNote) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveNote(selectedNote.id, noteTitle, val)
    }, 1000)
  }

  const handleTitleChange = (val: string) => {
    setNoteTitle(val)
    if (!selectedNote) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveNote(selectedNote.id, val, noteContent)
    }, 1000)
  }

  const createFolder = async () => {
    const name = prompt('Folder name:')
    if (!name?.trim()) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('folders')
        .insert({ name: name.trim(), user_id: user.id })
        .select()
        .single()
      if (error) throw error
      setFolders(prev => [...prev, data])
      toast.success('Folder created')
    } catch {
      toast.error('Failed to create folder')
    }
  }

  const createNote = async (folderId: string | null = selectedFolder) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('notes')
        .insert({ title: 'Untitled Note', content: '', folder_id: folderId, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      setNotes(prev => [data, ...prev])
      setSelectedNote(data)
      toast.success('Note created')
    } catch {
      toast.error('Failed to create note')
    }
  }

  const deleteNote = async (id: string) => {
    try {
      await supabase.from('notes').delete().eq('id', id)
      setNotes(prev => prev.filter(n => n.id !== id))
      if (selectedNote?.id === id) setSelectedNote(null)
      toast.success('Note deleted')
    } catch {
      toast.error('Failed to delete note')
    }
  }

  const deleteFolder = async (id: string) => {
    try {
      await supabase.from('folders').delete().eq('id', id)
      setFolders(prev => prev.filter(f => f.id !== id))
      setNotes(prev => prev.filter(n => n.folder_id !== id))
      if (selectedFolder === id) setSelectedFolder(null)
      toast.success('Folder deleted')
    } catch {
      toast.error('Failed to delete folder')
    }
  }

  const runAICommand = async (command: AICommand) => {
    if (!selectedNote) return
    const textarea = textareaRef.current
    const selectedText = textarea
      ? noteContent.substring(textarea.selectionStart, textarea.selectionEnd)
      : ''
    const textToProcess = selectedText || noteContent
    if (!textToProcess.trim()) {
      toast.error('Select text or add content first')
      return
    }

    setAiLoading(true)
    setShowAiMenu(false)
    try {
      const res = await fetch('/api/notebook/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToProcess, command }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const result = data.result || ''

      if (textarea && selectedText) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = noteContent.substring(0, start) + result + noteContent.substring(end)
        handleContentChange(newContent)
      } else {
        handleContentChange(result)
      }
      toast.success(`${command} applied!`)
    } catch {
      toast.error(`Failed to ${command.toLowerCase()}`)
    } finally {
      setAiLoading(false)
    }
  }

  const exportNote = () => {
    if (!selectedNote) return
    const blob = new Blob([`${noteTitle}\n\n${noteContent}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${noteTitle || 'note'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Note exported')
  }

  const filteredNotes = selectedFolder
    ? notes.filter(n => n.folder_id === selectedFolder)
    : notes

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSelectedFolder(prev => prev === id ? null : id)
  }

  return (
    <DashboardLayout>
      <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Left sidebar — Folders + Notes list */}
        <aside className="w-64 flex-shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
          {/* Folders */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-white/30 uppercase tracking-widest">Folders</span>
              <button onClick={createFolder} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <Plus size={13} />
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="text-white/30 animate-spin" />
              </div>
            ) : (
              <div className="space-y-0.5">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${!selectedFolder ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                >
                  <BookOpen size={12} className="flex-shrink-0" />
                  <span className="truncate">All Notes</span>
                </button>
                {folders.map(folder => (
                  <div key={folder.id} className="group">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${selectedFolder === folder.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                      >
                        {expandedFolders.has(folder.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <FolderOpen size={12} className="flex-shrink-0" />
                        <span className="truncate">{folder.name}</span>
                      </button>
                      <button
                        onClick={() => deleteFolder(folder.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/30 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-white/30 uppercase tracking-widest">
                Notes ({filteredNotes.length})
              </span>
              <button onClick={() => createNote()} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <Plus size={13} />
              </button>
            </div>
            <div className="space-y-0.5">
              {filteredNotes.map(note => (
                <div key={note.id} className="group flex items-center">
                  <button
                    onClick={() => setSelectedNote(note)}
                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all text-left min-w-0 ${selectedNote?.id === note.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                  >
                    <FileText size={12} className="flex-shrink-0" />
                    <span className="truncate">{note.title || 'Untitled'}</span>
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/30 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {filteredNotes.length === 0 && !loading && (
                <p className="text-white/20 text-xs px-2 py-4 text-center">No notes</p>
              )}
            </div>
          </div>
        </aside>

        {/* Editor area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedNote ? (
            <>
              {/* Toolbar */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  {saving && (
                    <span className="flex items-center gap-1.5 text-xs text-white/30">
                      <Loader2 size={11} className="animate-spin" /> Saving...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* AI button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAiMenu(m => !m)}
                      disabled={aiLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-lg text-xs hover:bg-white/10 transition-all"
                    >
                      {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      AI
                    </button>
                    <AnimatePresence>
                      {showAiMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1.5 glass rounded-xl overflow-hidden z-10 w-40 py-1"
                        >
                          {(['Expand', 'Summarize', 'Fix grammar'] as AICommand[]).map(cmd => (
                            <button
                              key={cmd}
                              onClick={() => runAICommand(cmd)}
                              className="w-full text-left px-4 py-2.5 text-xs hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            >
                              {cmd}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={exportNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-lg text-xs hover:bg-white/10 transition-all"
                  >
                    <Download size={12} /> Export
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="px-8 pt-6 pb-2">
                <input
                  value={noteTitle}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Note title..."
                  className="w-full text-2xl font-bold bg-transparent text-white placeholder-white/20 focus:outline-none border-none"
                />
              </div>

              {/* Content */}
              <div className="flex-1 px-8 pb-6 overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={noteContent}
                  onChange={e => handleContentChange(e.target.value)}
                  placeholder="Start writing... Select text and use AI to enhance it."
                  className="w-full h-full bg-transparent text-white/80 placeholder-white/20 text-sm leading-relaxed focus:outline-none resize-none"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <FileText className="w-16 h-16 text-white/10 mx-auto mb-4" />
                <p className="text-white/30 text-sm mb-4">Select a note or create a new one</p>
                <button
                  onClick={() => createNote()}
                  className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm hover:bg-white/10 transition-all mx-auto"
                >
                  <Plus size={14} /> New Note
                </button>
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  )
}
