export interface KnowledgePoint {
  id: string
  chapter_id: string
  name: string
  description: string | null
}

export interface KnowledgePointForm {
  chapter_id: string
  name: string
  description: string
}