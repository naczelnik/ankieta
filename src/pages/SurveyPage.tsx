import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Send, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PostSurveyForm } from '../components/PostSurveyForm'
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
  mailerlite_token?: string
  mailerlite_group_id?: string
  user_id: string
}

export function SurveyPage() {
  const { id } = useParams<{ id: string }>()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [responseId, setResponseId] = useState<string | null>(null)
  const [mailerLiteToken, setMailerLiteToken] = useState<string>('')
  const [contactFormTimer, setContactFormTimer] = useState<number | null>(null)

  useEffect(() => {
    if (id) {
      fetchSurvey(id)
    }
  }, [id])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (contactFormTimer) {
        clearTimeout(contactFormTimer)
      }
    }
  }, [contactFormTimer])

  const fetchSurvey = async (surveyId: string) => {
    try {
      console.log('Fetching survey:', surveyId)
      
      // Fetch survey
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .eq('is_active', true)
        .single()

      if (surveyError) {
        console.error('Survey fetch error:', surveyError)
        throw surveyError
      }

      console.log('Survey data:', surveyData)
      setSurvey(surveyData)

      // Fetch MailerLite token if survey has group configured
      if (surveyData.mailerlite_group_id) {
        console.log('Fetching MailerLite token for user:', surveyData.user_id)
        
        const { data: integrationData, error: integrationError } = await supabase
          .from('user_integrations')
          .select('mailerlite_token')
          .eq('user_id', surveyData.user_id)
          .single()

        if (!integrationError && integrationData?.mailerlite_token) {
          console.log('MailerLite token found')
          setMailerLiteToken(integrationData.mailerlite_token)
        } else {
          console.log('No MailerLite token found:', integrationError)
        }
      } else {
        console.log('No MailerLite group configured')
      }
    } catch (error: any) {
      console.error('Error fetching survey:', error)
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

  const validateCurrentQuestion = () => {
    if (!survey) return false

    const currentQuestion = survey.questions[currentQuestionIndex]
    const response = responses[currentQuestion.id]
    
    if (currentQuestion.required) {
      if (!response || 
          (typeof response === 'string' && !response.trim()) ||
          (Array.isArray(response) && response.length === 0)) {
        return false
      }
    }
    
    return true
  }

  const handleNext = () => {
    if (!validateCurrentQuestion()) {
      toast.error('To pytanie jest wymagane')
      return
    }

    if (currentQuestionIndex < survey!.questions.length - 1) {
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

    console.log('Starting survey submission...')
    console.log('Survey ID:', survey.id)
    console.log('Responses:', responses)

    // Validate all required questions
    const missingRequired = survey.questions.filter(q => {
      const response = responses[q.id]
      return q.required && (!response || 
        (typeof response === 'string' && !response.trim()) ||
        (Array.isArray(response) && response.length === 0))
    })

    if (missingRequired.length > 0) {
      console.log('Missing required questions:', missingRequired)
      toast.error('Proszę odpowiedzieć na wszystkie wymagane pytania')
      return
    }

    setSubmitting(true)
    try {
      // Get email from responses if exists
      const emailQuestion = survey.questions.find(q => q.type === 'email')
      const email = emailQuestion ? responses[emailQuestion.id] : ''

      console.log('Email found:', email)
      console.log('Saving survey response to database...')

      // Prepare the data for insertion
      const insertData = {
        survey_id: survey.id,
        responses: responses,
        email: email || null,
        mailerlite_synced: false
      }

      console.log('Insert data:', insertData)

      // Save response to database
      const { data, error } = await supabase
        .from('survey_responses')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Database error details:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        throw error
      }

      console.log('Survey response saved successfully:', data)
      setResponseId(data.id)
      setSubmitted(true)
      
      toast.success('Dziękujemy za wypełnienie ankiety!')

      // Check if we should show contact form
      console.log('Checking contact form conditions:')
      console.log('- MailerLite group ID:', survey.mailerlite_group_id)
      console.log('- MailerLite token:', mailerLiteToken ? 'Present' : 'Missing')
      
      if (survey.mailerlite_group_id && mailerLiteToken) {
        console.log('Setting up contact form timer...')
        const timerId = setTimeout(() => {
          console.log('Timer fired - showing contact form')
          setShowContactForm(true)
        }, 2000)
        setContactFormTimer(timerId)
      } else {
        console.log('Contact form will not be shown - missing configuration')
      }

    } catch (error: any) {
      console.error('Error submitting survey:', error)
      
      // More detailed error handling
      if (error.code === 'PGRST116') {
        toast.error('Błąd uprawnień. Sprawdź konfigurację bazy danych.')
      } else if (error.code === '23505') {
        toast.error('Odpowiedź już została zapisana.')
      } else if (error.message?.includes('permission denied')) {
        toast.error('Brak uprawnień do zapisania odpowiedzi.')
      } else {
        toast.error(`Błąd podczas zapisywania odpowiedzi: ${error.message || 'Nieznany błąd'}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleContactFormComplete = () => {
    console.log('Contact form completed')
    setShowContactForm(false)
    // Clear timer if still active
    if (contactFormTimer) {
      clearTimeout(contactFormTimer)
      setContactFormTimer(null)
    }
  }

  const handleContactFormSkip = () => {
    console.log('Contact form skipped')
    setShowContactForm(false)
    // Clear timer if still active
    if (contactFormTimer) {
      clearTimeout(contactFormTimer)
      setContactFormTimer(null)
    }
  }

  // Force show contact form for testing (remove in production)
  const handleForceShowContactForm = () => {
    if (responseId && survey?.mailerlite_group_id && mailerLiteToken) {
      console.log('Forcing contact form display')
      setShowContactForm(true)
    }
  }

  const renderQuestion = (question: Question) => {
    const value = responses[question.id]

    switch (question.type) {
      case 'text':
      case 'email':
        return (
          <div className="space-y-4">
            <input
              type={question.type}
              value={value || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              className="w-full px-0 py-4 text-xl border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:outline-none bg-transparent placeholder-gray-400"
              placeholder="Wpisz swoją odpowiedź..."
              autoFocus
            />
          </div>
        )

      case 'textarea':
        return (
          <div className="space-y-4">
            <textarea
              value={value || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              rows={4}
              className="w-full px-0 py-4 text-xl border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:outline-none bg-transparent placeholder-gray-400 resize-none"
              placeholder="Wpisz swoją odpowiedź..."
              autoFocus
            />
          </div>
        )

      case 'select':
        return (
          <div className="space-y-4">
            <select
              value={value || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              className="w-full px-4 py-4 text-xl border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white"
              autoFocus
            >
              <option value="">Wybierz opcję...</option>
              {question.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )

      case 'radio':
        return (
          <div className="space-y-4">
            {question.options?.map((option, index) => (
              <label 
                key={index} 
                className="flex items-center space-x-4 p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-all duration-200"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-lg text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-4">
            {question.options?.map((option, index) => (
              <label 
                key={index} 
                className="flex items-center space-x-4 p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-all duration-200"
              >
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
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-lg text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  // Debug logging for render
  console.log('Render state:', {
    submitted,
    showContactForm,
    responseId,
    mailerLiteToken: mailerLiteToken ? 'Present' : 'Missing',
    mailerLiteGroupId: survey?.mailerlite_group_id,
    contactFormTimer: contactFormTimer ? 'Active' : 'Inactive'
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie ankiety...</p>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ankieta nie została znaleziona</h1>
          <p className="text-gray-600">Sprawdź czy link jest poprawny lub czy ankieta jest aktywna.</p>
        </div>
      </div>
    )
  }

  if (submitted && !showContactForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dziękujemy!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Twoja odpowiedź została zapisana. Bardzo cenimy Twój czas i opinię.
          </p>
          
          {survey.mailerlite_group_id && mailerLiteToken && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-700 mb-2">
                Za chwilę pojawi się formularz kontaktowy...
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-xs text-blue-600">
                  {contactFormTimer ? 'Oczekiwanie...' : 'Przygotowywanie...'}
                </span>
              </div>
              
              {/* Test button - remove in production */}
              <button
                onClick={handleForceShowContactForm}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Pokaż formularz teraz (test)
              </button>
            </div>
          )}
          
          {/* Debug info */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left text-xs text-gray-600">
            <p><strong>Debug Info:</strong></p>
            <p>Response ID: {responseId}</p>
            <p>MailerLite Group: {survey.mailerlite_group_id || 'Not set'}</p>
            <p>MailerLite Token: {mailerLiteToken ? 'Present' : 'Missing'}</p>
            <p>Show Contact Form: {showContactForm ? 'Yes' : 'No'}</p>
            <p>Timer Active: {contactFormTimer ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = survey.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gray-100 z-50">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Survey Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-xl text-gray-600 leading-relaxed">
              {survey.description}
            </p>
          )}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {currentQuestionIndex + 1} z {survey.questions.length}
              </span>
              {currentQuestion.required && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Wymagane
                </span>
              )}
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {currentQuestion.title}
            </h2>
            
            {currentQuestion.description && (
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {currentQuestion.description}
              </p>
            )}
          </div>

          <div className="mb-12">
            {renderQuestion(currentQuestion)}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Poprzednie
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !validateCurrentQuestion()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    Wyślij odpowiedzi
                    <Send className="w-5 h-5 ml-3" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!validateCurrentQuestion()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Dalej
                <ChevronRight className="w-5 h-5 ml-3" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation Dots */}
        <div className="flex justify-center space-x-2">
          {survey.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentQuestionIndex
                  ? 'bg-indigo-600 scale-125'
                  : index < currentQuestionIndex
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Contact form overlay */}
      {showContactForm && responseId && (
        <PostSurveyForm
          surveyId={survey.id}
          responseId={responseId}
          mailerLiteToken={mailerLiteToken}
          mailerLiteGroupId={survey.mailerlite_group_id || ''}
          onComplete={handleContactFormComplete}
          onSkip={handleContactFormSkip}
        />
      )}
    </div>
  )
}
