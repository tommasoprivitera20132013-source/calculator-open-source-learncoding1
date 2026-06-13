export type Plan = 'free' | 'pro' | 'ultra'

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface Chat {
  id: string
  user_id: string
  title: string
  created_at: string
}

export interface Message {
  id: string
  chat_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Generation {
  id: string
  user_id: string
  tool: string
  prompt: string
  result_url: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  content: string
  created_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface FlashcardDeck {
  id: string
  user_id: string
  title: string
  created_at: string
  flashcards?: Flashcard[]
}

export interface Flashcard {
  id: string
  deck_id: string
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  next_review: string | null
  created_at: string
}

export interface MindMap {
  id: string
  user_id: string
  title: string
  data: MindMapData
  created_at: string
}

export interface MindMapData {
  nodes: MindMapNode[]
  edges: MindMapEdge[]
}

export interface MindMapNode {
  id: string
  type?: string
  position: { x: number; y: number }
  data: { label: string }
}

export interface MindMapEdge {
  id: string
  source: string
  target: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  labels: string[]
  created_at: string
}

export interface Usage {
  id: string
  user_id: string
  tool: string
  date: string
  count: number
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
  type: 'multiple_choice' | 'open'
}

export interface QuizResult {
  score: number
  total: number
  answers: number[]
  timestamp: string
}

export type ImageStyle = 'Realistic' | 'Cinematic' | 'Anime' | 'Oil Painting' | 'Minimal' | 'Cyberpunk' | 'Watercolor'
export type ImageResolution = '512x512' | '1024x1024' | '1792x1024'
export type MusicDuration = 15 | 30 | 60
export type WriteMode = 'Lyrics/Rap' | 'Story' | 'Essay' | 'Email' | 'Code' | 'Social Caption' | 'Script' | 'Ad Copy'
export type WriteTone = 'Professional' | 'Casual' | 'Creative' | 'Aggressive' | 'Poetic'
export type WriteLanguage = 'Italian' | 'English' | 'Spanish' | 'French' | 'German'
export type CodeLanguage = 'JavaScript' | 'TypeScript' | 'Python' | 'Rust' | 'Go' | 'Swift' | 'PHP' | 'SQL'
export type CodeMode = 'Generate' | 'Explain' | 'Fix bugs' | 'Optimize' | 'Convert language'
export type ExplainLevel = 'Child' | 'Student' | 'Expert'
