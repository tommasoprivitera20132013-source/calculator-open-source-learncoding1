'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Plus, Trash2, Flag, Calendar, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Task } from '@/types'

const columns: { id: Task['status']; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

const priorityColors = {
  low: 'text-[#666]',
  medium: 'text-yellow-500',
  high: 'text-red-500',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskColumn, setNewTaskColumn] = useState<Task['status'] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setTasks(data as Task[])
      setLoading(false)
    }
    load()
  }, [])

  const addTask = async (status: Task['status']) => {
    if (!newTaskTitle.trim() || !userId) return
    const supabase = createClient()
    const { data } = await supabase.from('tasks').insert({
      user_id: userId,
      title: newTaskTitle,
      status,
      priority: 'medium',
      labels: [],
    }).select().single()
    if (data) {
      setTasks(prev => [data as Task, ...prev])
      setNewTaskTitle('')
      setNewTaskColumn(null)
      toast.success('Task created')
    }
  }

  const moveTask = async (taskId: string, newStatus: Task['status']) => {
    const supabase = createClient()
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const deleteTask = async (taskId: string) => {
    const supabase = createClient()
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    toast.success('Task deleted')
  }

  const generateTasksFromAI = async () => {
    if (!aiPrompt.trim() || !userId) return
    setGenerating(true)
    try {
      const res = await fetch('/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a task list for this project: ${aiPrompt}. Return ONLY a JSON array of strings, each being a specific task. Example: ["Design wireframes", "Set up database"]. Return 8-12 tasks.`,
          mode: 'Code',
          tone: 'Professional',
          language: 'English',
        }),
      })
      const { result } = await res.json()
      const jsonMatch = result.match(/\[[\s\S]*?\]/)
      if (!jsonMatch) throw new Error('Invalid response')
      const taskTitles: string[] = JSON.parse(jsonMatch[0])

      const supabase = createClient()
      const newTasks = taskTitles.map(title => ({
        user_id: userId,
        title,
        status: 'todo' as const,
        priority: 'medium' as const,
        labels: [] as string[],
      }))

      const { data } = await supabase.from('tasks').insert(newTasks).select()
      if (data) {
        setTasks(prev => [...(data as Task[]), ...prev])
        toast.success(`${data.length} tasks generated!`)
        setAiPrompt('')
      }
    } catch {
      toast.error('Failed to generate tasks')
    }
    setGenerating(false)
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">AURA Tasks</h1>
          <p className="text-[#666] text-sm">Manage your projects with AI-powered task generation</p>
        </div>

        {/* AI Generator */}
        <div className="glass rounded-2xl p-4 mb-6 flex gap-3">
          <input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateTasksFromAI()}
            placeholder="Describe a project and AI will generate tasks..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#555] outline-none"
          />
          <button
            onClick={generateTasksFromAI}
            disabled={generating || !aiPrompt.trim()}
            className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/90 transition-all disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate
          </button>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id)
              return (
                <div key={col.id} className="glass rounded-2xl p-4 min-h-64">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold">{col.label}</h2>
                    <span className="text-xs text-[#666] bg-white/5 px-2 py-1 rounded-full">{colTasks.length}</span>
                  </div>

                  <AnimatePresence>
                    {colTasks.map(task => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/5 rounded-xl p-3 mb-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm flex-1 leading-tight">{task.title}</p>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#555] hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} />
                          <select
                            value={task.status}
                            onChange={e => moveTask(task.id, e.target.value as Task['status'])}
                            className="text-xs text-[#666] bg-transparent border-none outline-none cursor-pointer"
                          >
                            {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Add task */}
                  {newTaskColumn === col.id ? (
                    <div className="mt-2">
                      <input
                        autoFocus
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') addTask(col.id)
                          if (e.key === 'Escape') setNewTaskColumn(null)
                        }}
                        onBlur={() => { if (!newTaskTitle.trim()) setNewTaskColumn(null) }}
                        placeholder="Task title..."
                        className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-[#555] outline-none border border-white/10"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewTaskColumn(col.id)}
                      className="w-full mt-2 flex items-center gap-2 text-xs text-[#555] hover:text-white transition-colors py-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add task
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
