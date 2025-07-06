import React, { useState } from 'react'
import { Mail, User, Send, X, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface PostSurveyFormProps {
  surveyId: string
  responseId: string
  mailerLiteToken?: string
  mailerLiteGroupId?: string
  onComplete: () => void
  onSkip: () => void
}

export function PostSurveyForm({ 
  surveyId, 
  responseId, 
  mailerLiteToken, 
  mailerLiteGroupId, 
  onComplete, 
  onSkip 
}: PostSurveyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)

  console.log('PostSurveyForm rendered with:', {
    surveyId,
    responseId,
    mailerLiteToken: mailerLiteToken ? 'Present' : 'Missing',
    mailerLiteGroupId
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('PostSurveyForm submit started')
    console.log('Form data:', formData)
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Proszę wypełnić wszystkie pola')
      return
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      toast.error('Proszę podać prawidłowy adres email')
      return
    }

    setLoading(true)
    try {
      console.log('Updating survey response with contact info...')
      console.log('Response ID:', responseId)
      console.log('Update data:', {
        name: formData.name.trim(),
        email: formData.email.trim()
      })
      
      // First, let's check if the response exists
      const { data: existingResponse, error: fetchError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('id', responseId)
        .single()

      if (fetchError) {
        console.error('Error fetching existing response:', fetchError)
        throw new Error(`Nie można znaleźć odpowiedzi: ${fetchError.message}`)
      }

      console.log('Existing response found:', existingResponse)

      // Update survey response with contact info (removed manual updated_at since trigger handles it)
      const { data: updateData, error: updateError } = await supabase
        .from('survey_responses')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim()
        })
        .eq('id', responseId)
        .select()

      if (updateError) {
        console.error('Update error details:', updateError)
        console.error('Error code:', updateError.code)
        console.error('Error message:', updateError.message)
        console.error('Error details:', updateError.details)
        console.error('Error hint:', updateError.hint)
        
        // More specific error messages
        if (updateError.code === 'PGRST116') {
          throw new Error('Brak uprawnień do aktualizacji danych kontaktowych')
        } else if (updateError.code === '23505') {
          throw new Error('Ten adres email jest już używany')
        } else if (updateError.message?.includes('permission denied')) {
          throw new Error('Brak uprawnień do aktualizacji')
        } else {
          throw new Error(`Błąd aktualizacji: ${updateError.message}`)
        }
      }

      console.log('Survey response updated successfully:', updateData)

      // Sync with MailerLite if configured
      if (mailerLiteToken && mailerLiteGroupId) {
        console.log('Syncing with MailerLite...')
        try {
          await syncWithMailerLite(formData.name.trim(), formData.email.trim())
          
          // Mark as synced
          const { error: syncError } = await supabase
            .from('survey_responses')
            .update({ mailerlite_synced: true })
            .eq('id', responseId)
            
          if (syncError) {
            console.error('Error marking as synced:', syncError)
          } else {
            console.log('MailerLite sync successful and marked in database')
          }
          
          toast.success('Dziękujemy! Zostałeś dodany do naszej listy mailingowej.')
        } catch (mailerLiteError) {
          console.error('MailerLite sync error:', mailerLiteError)
          toast.success('Dziękujemy za podanie danych kontaktowych!')
        }
      } else {
        console.log('No MailerLite sync - missing token or group ID')
        toast.success('Dziękujemy za podanie danych kontaktowych!')
      }

      onComplete()
    } catch (error: any) {
      console.error('Error in handleSubmit:', error)
      toast.error(error.message || 'Błąd podczas zapisywania danych. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  const syncWithMailerLite = async (name: string, email: string) => {
    if (!mailerLiteToken || !mailerLiteGroupId) {
      console.log('Missing MailerLite credentials')
      return
    }

    console.log('Making MailerLite API call...')
    console.log('Token:', mailerLiteToken.substring(0, 10) + '...')
    console.log('Group ID:', mailerLiteGroupId)

    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailerLiteToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        fields: {
          name
        },
        groups: [mailerLiteGroupId]
      })
    })

    const responseText = await response.text()
    console.log('MailerLite response status:', response.status)
    console.log('MailerLite response:', responseText)

    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText }
      }
      console.error('MailerLite API error:', errorData)
      throw new Error(`MailerLite API error: ${errorData.message || 'Unknown error'}`)
    }

    console.log('MailerLite API call successful')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative transform transition-all animate-in fade-in duration-300">
        <button
          onClick={onSkip}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Zostań w kontakcie!
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Podaj swoje dane, aby otrzymywać aktualizacje i informacje o nowych ankietach.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imię i nazwisko
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Jan Kowalski"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adres email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="jan@example.com"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-6 py-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
            >
              Pomiń
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Wyślij
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
          Twoje dane będą używane wyłącznie do kontaktu w sprawie ankiet. 
          Nie będziemy spamować! 🚫📧
        </p>
      </div>
    </div>
  )
}
