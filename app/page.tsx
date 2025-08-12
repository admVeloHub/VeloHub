'use client'

import { useEffect, useState } from 'react'

interface Article {
  title: string
  content: string
}

interface CategoryData {
  title: string
  articles: Article[]
}

interface ApiData {
  artigos: Record<string, CategoryData>
  noticias: any[]
  faq: any[]
}

export default function Home() {
  const [data, setData] = useState<ApiData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const apiData = await response.json()
        setData(apiData)
        setIsLoading(false)
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando VeloHub...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">VeloHub</h1>
          <p className="text-gray-600">Plataforma de Conhecimento</p>
        </header>

        <main>
          {data && data.artigos && Object.keys(data.artigos).length > 0 ? (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Artigos Disponíveis</h2>
              
              {Object.entries(data.artigos).map(([category, catData]) => (
                <section key={category} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                    {catData.title}
                  </h3>
                  
                  <div className="space-y-4">
                    {catData.articles.map((article, index) => (
                      <article key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="text-lg font-medium text-gray-800 mb-2">
                          {article.title}
                        </h4>
                        <div className="text-gray-600 leading-relaxed">
                          {article.content}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Nenhum Conteúdo Disponível</h2>
                <p className="text-gray-600 mb-4">
                  No momento não há artigos disponíveis. Tente novamente mais tarde.
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Recarregar
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
