'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Network, Save, Sparkles, Trash2, ChevronRight, Map } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'

interface SavedMap {
  id: string
  title: string
  created_at: string
  content: { nodes: Node[]; edges: Edge[] }
}

const nodeStyle = {
  background: '#1a1a1a',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '12px',
  color: '#ffffff',
  padding: '10px 16px',
  fontSize: '13px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const edgeStyle = {
  stroke: 'rgba(255,255,255,0.25)',
  strokeWidth: 1.5,
}

export default function MindMapPage() {
  const [topic, setTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [hasMap, setHasMap] = useState(false)
  const [mapTitle, setMapTitle] = useState('')

  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([])
  const [loadingMaps, setLoadingMaps] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const fetchSavedMaps = useCallback(async () => {
    setLoadingMaps(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setSavedMaps(data || [])
    } catch {
      // silent
    } finally {
      setLoadingMaps(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSavedMaps()
  }, [fetchSavedMaps])

  const onConnect = useCallback(
    (connection: Connection) => setEdges(eds => addEdge(connection, eds)),
    [setEdges]
  )

  const generateMindMap = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic or description')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/mindmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()

      const styledNodes: Node[] = (data.nodes || []).map((n: Node) => ({
        ...n,
        style: nodeStyle,
      }))

      const styledEdges: Edge[] = (data.edges || []).map((e: Edge) => ({
        ...e,
        style: edgeStyle,
      }))

      setNodes(styledNodes)
      setEdges(styledEdges)
      setHasMap(true)
      setMapTitle(topic)
      toast.success('Mind map generated!')
    } catch {
      toast.error('Failed to generate mind map')
    } finally {
      setGenerating(false)
    }
  }

  const saveMap = async () => {
    if (!hasMap) {
      toast.error('Generate a mind map first')
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('mind_maps').insert({
        user_id: user.id,
        title: mapTitle || topic || 'Untitled Map',
        content: { nodes, edges },
      })
      if (error) throw error
      toast.success('Mind map saved!')
      fetchSavedMaps()
    } catch {
      toast.error('Failed to save mind map')
    } finally {
      setSaving(false)
    }
  }

  const loadMap = (map: SavedMap) => {
    const styledNodes = (map.content.nodes || []).map(n => ({ ...n, style: nodeStyle }))
    const styledEdges = (map.content.edges || []).map(e => ({ ...e, style: edgeStyle }))
    setNodes(styledNodes)
    setEdges(styledEdges)
    setHasMap(true)
    setMapTitle(map.title)
    setTopic(map.title)
    toast.success(`Loaded: ${map.title}`)
  }

  const deleteMap = async (id: string) => {
    try {
      await supabase.from('mind_maps').delete().eq('id', id)
      setSavedMaps(prev => prev.filter(m => m.id !== id))
      toast.success('Map deleted')
    } catch {
      toast.error('Failed to delete map')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
          {/* Input */}
          <div className="p-4 border-b border-white/[0.06]">
            <h1 className="text-lg font-bold mb-4">AURA Mind Map</h1>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Enter a topic or description to map..."
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={generateMindMap}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white text-black rounded-xl text-xs font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {generating ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                Generate
              </button>
              <button
                onClick={saveMap}
                disabled={saving || !hasMap}
                className="flex items-center gap-1.5 px-3 py-2 glass rounded-xl text-xs hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                Save
              </button>
            </div>
          </div>

          {/* Saved maps */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Saved Maps</p>
            {loadingMaps ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
              </div>
            ) : savedMaps.length === 0 ? (
              <div className="text-center py-8">
                <Map className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/30 text-xs">No saved maps</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {savedMaps.map(map => (
                  <div key={map.id} className="group flex items-center gap-2 p-2.5 rounded-xl hover:bg-white/5 transition-all">
                    <button
                      onClick={() => loadMap(map)}
                      className="flex-1 text-left flex items-center gap-2 min-w-0"
                    >
                      <Network size={13} className="text-white/40 flex-shrink-0" />
                      <span className="text-sm truncate text-white/70">{map.title}</span>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => loadMap(map)}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/40"
                      >
                        <ChevronRight size={12} />
                      </button>
                      <button
                        onClick={() => deleteMap(map.id)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative">
          {!hasMap ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Network className="w-16 h-16 text-white/10 mx-auto mb-4" />
                <p className="text-white/30 text-sm">Enter a topic and click Generate to create a mind map</p>
              </motion.div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              style={{ background: '#0a0a0a' }}
            >
              <Background color="rgba(255,255,255,0.05)" gap={24} />
              <Controls
                style={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
              />
              <MiniMap
                style={{
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
                nodeColor="#333"
              />
            </ReactFlow>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
