import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BarChart3, Users, Eye, Edit, Trash2, ExternalLink } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface Survey {
  id: string
  title: string
  description: string
  is_active: boolean
  created_at: string
  _count?: {
    responses: number
  }
}

export function DashboardPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchSurveys()
  }, [])

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          id,
          title,
          description,
          is_active,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSurveys(data || [])
    } catch (error: any) {
      toast.error('Błąd podczas ładowania ankiet')
      console.error('Error fetching surveys:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSurveyStatus = async (surveyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ is_active: !currentStatus })
        .eq('id', surveyId)

      if (error) throw error

      setSurveys(surveys.map(survey => 
        survey.id === surveyId 
          ? { ...survey, is_active: !currentStatus }
          : survey
      ))

      toast.success(
        !currentStatus ? 'Ankieta została aktywowana' : 'Ankieta została dezaktywowana'
      )
    } catch (error: any) {
      toast.error('Błąd podczas zmiany statusu ankiety')
    }
  }

  const deleteSurvey = async (surveyId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę ankietę? Ta operacja jest nieodwracalna.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId)

      if (error) throw error

      setSurveys(surveys.filter(survey => survey.id !== surveyId))
      toast.success('Ankieta została usunięta')
    } catch (error: any) {
      toast.error('Błąd podczas usuwania ankiety')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel główny</h1>
          <p className="text-gray-600">Zarządzaj swoimi ankietami</p>
        </div>
        <Link
          to="/create"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nowa ankieta
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wszystkie ankiety</p>
              <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktywne ankiety</p>
              <p className="text-2xl font-bold text-gray-900">
                {surveys.filter(s => s.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łączne odpowiedzi</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Surveys List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Twoje ankiety</h2>
        </div>
        
        {surveys.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Brak ankiet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Rozpocznij od utworzenia swojej pierwszej ankiety.
            </p>
            <div className="mt-6">
              <Link
                to="/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nowa ankieta
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {surveys.map((survey) => (
              <div key={survey.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">
                        {survey.title}
                      </h3>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        survey.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {survey.is_active ? 'Aktywna' : 'Nieaktywna'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {survey.description || 'Brak opisu'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Utworzona: {new Date(survey.created_at).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/survey/${survey.id}`}
                      className="text-gray-400 hover:text-gray-600"
                      title="Zobacz ankietę"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    
                    <Link
                      to={`/responses/${survey.id}`}
                      className="text-gray-400 hover:text-gray-600"
                      title="Zobacz odpowiedzi"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                    
                    <Link
                      to={`/edit/${survey.id}`}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edytuj ankietę"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    
                    <button
                      onClick={() => toggleSurveyStatus(survey.id, survey.is_active)}
                      className={`text-sm px-2 py-1 rounded ${
                        survey.is_active
                          ? 'text-red-600 hover:text-red-800'
                          : 'text-green-600 hover:text-green-800'
                      }`}
                      title={survey.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteSurvey(survey.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Usuń ankietę"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
