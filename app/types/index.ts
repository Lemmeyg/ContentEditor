export interface ContentThread {
  id: string
  messages: Array<ThreadMessage>
  currentPhase: number
  approvedContent: string
}

export interface ThreadMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export interface ContentState {
  phase: number
  approvedContent: string
  userFeedback: string
}

export enum ContentPhase {
  GOALS = 1,
  NARRATIVE = 2,
  STRUCTURE = 3,
  CONTENT = 4,
  CONCLUSION = 5,
  REVIEW = 6,
} 