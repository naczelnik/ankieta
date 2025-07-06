import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, BarChart3, Share2, Mail, Users, Zap, Shield } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">SurveyPro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Zaloguj się
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Rozpocznij za darmo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Twórz piękne ankiety
              <span className="text-indigo-600 block">jak profesjonalista</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Zbuduj angażujące ankiety w stylu Typeform, zbieraj odpowiedzi i automatycznie 
              synchronizuj kontakty z MailerLite. Wszystko w jednym miejscu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center justify-center transition-colors"
              >
                Rozpocznij za darmo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                Zobacz demo
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Wszystko czego potrzebujesz
              </h2>
              <p className="text-xl text-gray-600">
                Profesjonalne narzędzia do tworzenia i zarządzania ankietami
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Łatwe tworzenie
                </h3>
                <p className="text-gray-600">
                  Intuicyjny kreator ankiet pozwala na szybkie tworzenie 
                  profesjonalnych formularzy bez znajomości kodowania.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Integracja z MailerLite
                </h3>
                <p className="text-gray-600">
                  Automatycznie dodawaj kontakty do swoich list mailingowych 
                  w MailerLite po wypełnieniu ankiety.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Łatwe udostępnianie
                </h3>
                <p className="text-gray-600">
                  Udostępniaj ankiety przez link lub osadzaj je na swojej 
                  stronie internetowej za pomocą prostego kodu.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-indigo-600 mb-2">10,000+</div>
                <div className="text-gray-600">Utworzonych ankiet</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">50,000+</div>
                <div className="text-gray-600">Zebranych odpowiedzi</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">2,500+</div>
                <div className="text-gray-600">Zadowolonych użytkowników</div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Dlaczego wybierają nas?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Szybkie</h4>
                <p className="text-sm text-gray-600">Twórz ankiety w minuty, nie godziny</p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Przyjazne</h4>
                <p className="text-sm text-gray-600">Intuicyjny interfejs dla każdego</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Analityczne</h4>
                <p className="text-sm text-gray-600">Szczegółowe raporty i statystyki</p>
              </div>

              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Bezpieczne</h4>
                <p className="text-sm text-gray-600">Pełna ochrona danych użytkowników</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-600 py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Gotowy na rozpoczęcie?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Dołącz do tysięcy użytkowników, którzy już tworzą lepsze ankiety
            </p>
            <Link
              to="/register"
              className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center transition-colors"
            >
              Rozpocznij za darmo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-6 w-6 text-indigo-400" />
                <span className="ml-2 text-lg font-semibold">SurveyPro</span>
              </div>
              <p className="text-gray-400 mb-4">
                Profesjonalne narzędzie do tworzenia ankiet z integracją MailerLite.
                Zbieraj odpowiedzi i buduj listy mailingowe automatycznie.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Funkcje</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Cennik</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Integracje</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Wsparcie</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Pomoc</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontakt</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 SurveyPro. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
