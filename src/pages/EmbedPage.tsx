import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface Question {
  id: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox'
  title: string
  description?: string
  required: boolean
  options?: string[]
}

interface Survey {
  id: string
  title: string
  description: string
  questions: Question[]
  mailerlite_token: string
  mailerlite_group_id: string
}

export function EmbedPage() {
  const { id } = useParams<{ id: string }>()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (id) {
      fetchSurvey(id)
    }
  }, [id])

  const fetchSurvey = async (surveyId: string) => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      setSurvey(data)
    } catch (error: any) {
      toast.error('Ankieta nie została znaleziona lub jest nieaktywna')
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleNext = () => {
    if (!survey) return

    const currentQuestion = survey.questions[currentQuestionIndex]
    
    // Validate required questions
    if (currentQuestion.required && !responses[currentQuestion.id]) {
      toast.error('To pytanie jest wymagane')
      return
    }

    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!survey) return

    // Validate all required questions
    const missingRequired = survey.questions.filter(q => 
      q.required && !responses[q.id]
    )

    if (missingRequired.length > 0) {
      toast.error('Proszę odpowiedzieć na wszystkie wymagane pytania')
      return
    }

    setSubmitting(true)
    try {
      // Get email from responses if exists
      const emailQuestion = survey.questions.find(q => q.type === 'email')
      const email = emailQuestion ? responses[emailQuestion.id] : ''

      // Save response to database
      const { error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: survey.id,
          responses,
          email
        })

      if (error) throw error

      setSubmitted(true)
      toast.success('Dziękujemy za wypełnienie ankiety!')
    } catch (error: any) {
      toast.error('Błąd podczas zapisywania odpowiedzi')
      console.error('Error submitting survey:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const value = responses[question.id]

    switch (question.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={question.type}
            value={value || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            className="w-full px-3 py-2 text-base border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none bg-transparent"
            placeholder="Wpisz swoją odpowiedź..."
          />
        )

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-base border-2 border-gray-300 rounded focus:border-indigo-500 focus:outline-none resize-none"
            placeholder="Wpisz swoją odpowiedź..."
          />
        )

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            className="w-full px-3 py-2 text-base border-2 border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Wybierz opcję...</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-base">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = value || []
                    if (e.target.checked) {
                      handleResponse(question.id, [...currentValues, option])
                    } else {
                      handleResponse(question.id, currentValues.filter((v: string) => v !== option))
                    }
                  }}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                />
                <span className="text-base">{option}</span>
              </label>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Ankieta nie została znaleziona</h1>
          <p className="text-gray-600 text-sm">Sprawdź czy link jest poprawny lub czy ankieta jest aktywna.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto p-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Dziękujemy!</h1>
          <p className="text-gray-600 text-sm">
            Twoja odpowiedź została zapisana.
          </p>
        </div>
      </div>
    )
  }

  const currentQuestion = survey.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-200">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Survey Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-gray-600 text-sm">
              {survey.description}
            </p>
          )}
        </div>

        {/* Question */}
        <div className="bg-white p-6 mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-indigo-600">
                {currentQuestionIndex + 1} / {survey.questions.length}
              </span>
              {currentQuestion.required && (
                <span className="text-xs text-red-500">* wymagane</span>
              )}
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {currentQuestion.title}
            </h2>
            
            {currentQuestion.description && (
              <p className="text-gray-600 text-sm mb-4">
                {currentQuestion.description}
              </p>
            )}
          </div>

          <div className="mb-6">
            {renderQuestion(currentQuestion)}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Poprzednie
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    Wyślij
                    <Send className="w-3 h-3 ml-2" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center"
              >
                Dalej
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
