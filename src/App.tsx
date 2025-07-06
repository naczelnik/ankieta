import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { CreateSurveyPage } from './pages/CreateSurveyPage'
import { EditSurveyPage } from './pages/EditSurveyPage'
import { SurveyPage } from './pages/SurveyPage'
import { ResponsesPage } from './pages/ResponsesPage'
import { IntegrationsPage } from './pages/IntegrationsPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/survey/:id" element={<SurveyPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/create" element={
              <ProtectedRoute>
                <Layout>
                  <CreateSurveyPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/edit/:id" element={
              <ProtectedRoute>
                <Layout>
                  <EditSurveyPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/responses/:id" element={
              <ProtectedRoute>
                <Layout>
                  <ResponsesPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/integrations" element={
              <ProtectedRoute>
                <Layout>
                  <IntegrationsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
