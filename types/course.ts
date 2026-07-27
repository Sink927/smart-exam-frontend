export interface Course {
  id: string
  code: string
  name: string
  description: string | null
  created_at: string
}

export interface CourseForm {
  code: string
  name: string
  description: string
}