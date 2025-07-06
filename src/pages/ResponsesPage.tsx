import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart3, Download, Calendar, Mail, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Response {
  id: string
  responses: Record<string, any>
  email: string
  created_at: string
}

interface Survey {
  id: string
  title: string
  questions: Array<{
    id: string
    title: string
    type: string
  }>
}

export function ResponsesPage() {
  const { id } = useParams<{ id: string }>()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (id) {
      fetchSurveyAndResponses(id)
    }
  }, [id])

  const fetchSurveyAndResponses = async (surveyId: string) => {
    try {
      // Fetch survey
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('id, title, questions')
        .eq('id', surveyId)
        .eq('user_id', user?.id)
        .single()

      if (surveyError) throw surveyError
      setSurvey(surveyData)

      // Fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId)
        .order('created_at', { ascending: false })

      if (responsesError) throw responsesError
      setResponses(responsesData || [])
    } catch (error: any) {
      toast.error('Błąd podczas ładowania danych')
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!survey || responses.length === 0) return

    const headers = ['Data wypełnienia', 'Email', ...survey.questions.map(q => q.title)]
    const rows = responses.map(response => [
      new Date(response.created_at).toLocaleString('pl-PL'),
      response.email || '',
      ...survey.questions.map(q => {
        const answer = response.responses[q.id]
        if (Array.isArray(answer)) {
          return answer.join(', ')
        }
        return answer || ''
      })
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${survey.title}_odpowiedzi.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ankieta nie została znaleziona</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Powrót do panelu
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center mb-2">
            <Link
              to="/dashboard"
              className="text-gray-400 hover:text-gray-600 mr-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Odpowiedzi na ankietę</h1>
          </div>
          <h2 className="text-lg text-gray-600">{survey.title}</h2>
        </div>
        
        {responses.length > 0 && (
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Eksportuj CSV
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łączne odpowiedzi</p>
              <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Z adresem email</p>
              <p className="text-2xl font-bold text-gray-900">
                {responses.filter(r => r.email).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ostatnia odpowiedź</p>
              <p className="text-sm font-bold text-gray-900">
                {responses.length > 0 
                  ? new Date(responses[0].created_at).toLocaleDateString('pl-PL')
                  : 'Brak'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Responses */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Wszystkie odpowiedzi</h3>
        </div>
        
        {responses.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Brak odpowiedzi</h3>
            <p className="mt-1 text-sm text-gray-500">
              Gdy ktoś wypełni ankietę, odpowiedzi pojawią się tutaj.
            </p>
            <div className="mt-6">
              <Link
                to={`/survey/${survey.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Zobacz ankietę
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  {survey.questions.map(question => (
                    <th key={question.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {question.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {responses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(response.created_at).toLocaleString('pl-PL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {response.email || '-'}
                    </td>
                    {survey.questions.map(question => (
                      <td key={question.id} className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {(() => {
                          const answer = response.responses[question.id]
                          if (Array.isArray(answer)) {
                            return answer.join(', ')
                          }
                          return answer || '-'
                        })()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
