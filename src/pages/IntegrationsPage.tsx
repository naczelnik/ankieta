import React, { useState, useEffect } from 'react'
import { Save, Check, AlertCircle, Mail, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface MailerLiteGroup {
  id: string
  name: string
  active_count: number
}

export function IntegrationsPage() {
  const [mailerLiteToken, setMailerLiteToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [groups, setGroups] = useState<MailerLiteGroup[]>([])
  const { user } = useAuth()

  useEffect(() => {
    loadIntegrationSettings()
  }, [])

  const loadIntegrationSettings = async () => {
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
        setMailerLiteToken(data.mailerlite_token)
        setConnectionStatus('success')
      }
    } catch (error: any) {
      console.error('Error loading integration settings:', error)
    }
  }

  const testMailerLiteConnection = async (token: string) => {
    try {
      const response = await fetch('https://connect.mailerlite.com/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Nieprawidłowy token lub błąd połączenia')
      }

      const data = await response.json()
      setGroups(data.data || [])
      return true
    } catch (error) {
      console.error('MailerLite connection test failed:', error)
      return false
    }
  }

  const handleTestConnection = async () => {
    if (!mailerLiteToken.trim()) {
      toast.error('Wprowadź token API MailerLite')
      return
    }

    setTestingConnection(true)
    setConnectionStatus('idle')

    try {
      const isValid = await testMailerLiteConnection(mailerLiteToken.trim())
      
      if (isValid) {
        setConnectionStatus('success')
        toast.success('Połączenie z MailerLite zostało nawiązane pomyślnie!')
      } else {
        setConnectionStatus('error')
        toast.error('Nie udało się połączyć z MailerLite. Sprawdź token.')
      }
    } catch (error) {
      setConnectionStatus('error')
      toast.error('Błąd podczas testowania połączenia')
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSave = async () => {
    if (!mailerLiteToken.trim()) {
      toast.error('Token API MailerLite jest wymagany')
      return
    }

    if (connectionStatus !== 'success') {
      toast.error('Najpierw przetestuj połączenie z MailerLite')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: user?.id,
          mailerlite_token: mailerLiteToken.trim(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Ustawienia integracji zostały zapisane!')
    } catch (error: any) {
      toast.error('Błąd podczas zapisywania ustawień')
      console.error('Error saving integration settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integracje</h1>
        <p className="text-gray-600">Skonfiguruj połączenia z zewnętrznymi usługami</p>
      </div>

      {/* MailerLite Integration */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Mail className="h-6 w-6 text-indigo-600 mr-3" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">MailerLite</h2>
              <p className="text-sm text-gray-500">
                Automatycznie dodawaj kontakty z ankiet do grup MailerLite
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Token Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token API MailerLite *
            </label>
            <div className="flex space-x-3">
              <input
                type="password"
                value={mailerLiteToken}
                onChange={(e) => {
                  setMailerLiteToken(e.target.value)
                  setConnectionStatus('idle')
                  setGroups([])
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Wklej swój token API z MailerLite"
              />
              <button
                onClick={handleTestConnection}
                disabled={testingConnection || !mailerLiteToken.trim()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 flex items-center"
              >
                {testingConnection ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Testuj połączenie
              </button>
            </div>
            
            {/* Connection Status */}
            {connectionStatus !== 'idle' && (
              <div className={`mt-2 flex items-center text-sm ${
                connectionStatus === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {connectionStatus === 'success' ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-1" />
                )}
                {connectionStatus === 'success' 
                  ? 'Połączenie nawiązane pomyślnie' 
                  : 'Błąd połączenia - sprawdź token'
                }
              </div>
            )}
          </div>

          {/* Groups Preview */}
          {groups.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dostępne grupy ({groups.length})
              </label>
              <div className="bg-gray-50 rounded-md p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div key={group.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">{group.name}</span>
                      <span className="text-gray-500">{group.active_count} kontaktów</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Jak uzyskać token API MailerLite:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Zaloguj się do swojego konta MailerLite</li>
              <li>Przejdź do Integrations → Developer API</li>
              <li>Wygeneruj nowy token API</li>
              <li>Skopiuj token i wklej go powyżej</li>
            </ol>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading || connectionStatus !== 'success'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Zapisywanie...' : 'Zapisz ustawienia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
