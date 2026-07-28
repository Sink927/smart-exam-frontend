export interface Chapter {
  id: string
  course_id: string
  name: string
  order_index: number
  description: string | null
}

export interface ChapterForm {
  course_id: string
  name: string
  order_index: number
  description: string
}