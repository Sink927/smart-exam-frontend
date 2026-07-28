export interface QuestionOption {
  key: string
  content: string
}

export interface Question {
  id: string
  question_type: string
  stem: string
  latex_source: string | null

  options: QuestionOption[]
  standard_answer: Record<string, unknown>
  analysis: string | null

  difficulty: number | string | null
  cognitive_level: string | null
  source: string | null
  metadata: Record<string, unknown>

  version: number
  status: string
  created_at: string
  updated_at: string

  knowledge_point_ids: string[]
}

export interface QuestionPage {
  items: Question[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface QuestionForm {
  question_type: string
  stem: string
  latex_source: string
  options: QuestionOption[]
  answer: string
  analysis: string
  difficulty: number
  cognitive_level: string
  source: string
  knowledge_point_ids: string[]
}
export interface QuestionVersion {
  id: string
  question_id: string
  version: number
  change_type: string
  snapshot: Question
  created_at: string
}

export interface QuestionRestoreRequest {
  version: number
}