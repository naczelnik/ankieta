import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Save, Eye, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Question {
  id: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox'
  title: string
  description?: string
  required: boolean
  options?: string[]
}

interface MailerLiteGroup {
  id: string
  name: string
  active_count: number
}

export function CreateSurveyPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [mailerLiteGroups, setMailerLiteGroups] = useState<MailerLiteGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mailerLiteConfigured, setMailerLiteConfigured] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    checkMailerLiteConfiguration()
  }, [])

  const checkMailerLiteConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('mailerlite_token')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data?.mailerlite_token) {
        setMailerLiteConfigured(true)
        await fetchMailerLiteGroups(data.mailerlite_token)
      }
    } catch (error: any) {
      console.error('Error checking MailerLite configuration:', error)
    }
  }

  const fetchMailerLiteGroups = async (token: string) => {
    setLoadingGroups(true)
    try {
      const response = await fetch('https://connect.mailerlite.com/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Błąd podczas pobierania grup MailerLite')
      }

      const data = await response.json()
      setMailerLiteGroups(data.data || [])
    } catch (error: any) {
      toast.error('Nie udało się pobrać grup MailerLite')
      console.error('Error fetching MailerLite groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: 'text',
      title: '',
      required: false
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const addOption = (questionId: string) => {
    updateQuestion(questionId, {
      options: [...(questions.find(q => q.id === questionId)?.options || []), '']
    })
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question?.options) {
      const newOptions = [...question.options]
      newOptions[optionIndex] = value
      updateQuestion(questionId, { options: newOptions })
    }
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId)
    if (question?.options) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex)
      updateQuestion(questionId, { options: newOptions })
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Tytuł ankiety jest wymagany')
      return
    }

    if (questions.length === 0) {
      toast.error('Dodaj co najmniej jedno pytanie')
      return
    }

    const invalidQuestions = questions.filter(q => !q.title.trim())
    if (invalidQuestions.length > 0) {
      toast.error('Wszystkie pytania muszą mieć tytuł')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('surveys')
        .insert({
          title: title.trim(),
          description: description.trim(),
          questions,
          mailerlite_group_id: selectedGroupId,
          user_id: user?.id
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Ankieta została utworzona!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error('Błąd podczas zapisywania ankiety')
      console.error('Error saving survey:', error)
    } finally {
      setLoading(false)
    }
  }

  const questionTypes = [
    { value: 'text', label: 'Tekst krótki' },
    { value: 'textarea', label: 'Tekst długi' },
    { value: 'email', label: 'Email' },
    { value: 'select', label: 'Lista rozwijana' },
    { value: 'radio', label: 'Wybór pojedynczy' },
    { value: 'checkbox', label: 'Wybór wielokrotny' }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utwórz nową ankietę</h1>
          <p className="text-gray-600">Zaprojektuj swoją ankietę krok po kroku</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Zapisywanie...' : 'Zapisz ankietę'}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Podstawowe informacje</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tytuł ankiety *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Wpisz tytuł swojej ankiety"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis ankiety
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Opisz cel swojej ankiety (opcjonalne)"
            />
          </div>
        </div>
      </div>

      {/* MailerLite Integration */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Integracja z MailerLite</h2>
        
        {!mailerLiteConfigured ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  MailerLite nie jest skonfigurowany
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Aby automatycznie dodawać kontakty do MailerLite, najpierw skonfiguruj integrację w zakładce Integracje.
                </p>
                <button
                  onClick={() => navigate('/integrations')}
                  className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
                >
                  Przejdź do konfiguracji
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupa MailerLite
              </label>
              {loadingGroups ? (
                <div className="flex items-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                  <span className="text-sm text-gray-500">Ładowanie grup...</span>
                </div>
              ) : (
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Wybierz grupę (opcjonalne)</option>
                  {mailerLiteGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.active_count} kontaktów)
                    </option>
                  ))}
                </select>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Kontakty z adresami email będą automatycznie dodawane do wybranej grupy
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Pytania</h2>
          <button
            onClick={addQuestion}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md flex items-center text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Dodaj pytanie
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Brak pytań. Kliknij "Dodaj pytanie" aby rozpocząć.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-500">
                    Pytanie {index + 1}
                  </span>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Typ pytania
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(question.id, { 
                          type: e.target.value as Question['type'],
                          options: ['select', 'radio', 'checkbox'].includes(e.target.value) ? [''] : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {questionTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`required-${question.id}`}
                        checked={question.required}
                        onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`required-${question.id}`} className="ml-2 text-sm text-gray-700">
                        Pytanie wymagane
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Treść pytania
                    </label>
                    <input
                      type="text"
                      value={question.title}
                      onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Wpisz treść pytania"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opis pytania (opcjonalny)
                    </label>
                    <input
                      type="text"
                      value={question.description || ''}
                      onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Dodatkowe informacje o pytaniu"
                    />
                  </div>

                  {/* Options for select, radio, checkbox */}
                  {['select', 'radio', 'checkbox'].includes(question.type) && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Opcje odpowiedzi
                        </label>
                        <button
                          onClick={() => addOption(question.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          + Dodaj opcję
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder={`Opcja ${optionIndex + 1}`}
                            />
                            <button
                              onClick={() => removeOption(question.id, optionIndex)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
