export interface Question {
  id: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'rating'
  title: string
  description?: string
  required: boolean
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
  }
}

export interface Survey {
  id: string
  title: string
  description: string
  questions: Question[]
  settings: {
    theme?: string
    showProgress?: boolean
    allowMultipleSubmissions?: boolean
    redirectUrl?: string
    thankYouMessage?: string
  }
  mailerlite_token: string
  mailerlite_group_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  user_id: string
}

export interface SurveyResponse {
  id: string
  survey_id: string
  responses: Record<string, any>
  email: string
  mailerlite_synced: boolean
  created_at: string
}

export interface CreateSurveyData {
  title: string
  description: string
  questions: Question[]
  settings: Survey['settings']
  mailerlite_token: string
  mailerlite_group_id: string
}
