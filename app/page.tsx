'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [htmlContent, setHtmlContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Carregar o HTML original e modificar a URL da API
    fetch('/VELOHUB 2.html')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.text()
      })
      .then(html => {
        // Substituir a URL da API do Google Apps Script pela nova API do Next.js
        const modifiedHtml = html.replace(
          'https://script.google.com/macros/s/AKfycbwuX73q38Ypdpigm0TG1AOMj5wNeDHjRi0PhZFI4F_SxA572btd8l2KVYUPEkQFpT9vyw/exec',
          '/api/data'
        )
        setHtmlContent(modifiedHtml)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Erro ao carregar o HTML:', error)
        setError('Erro ao carregar o conteúdo')
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  )
}
