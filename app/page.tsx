'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [htmlContent, setHtmlContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Tentar carregar o HTML original
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
        // Fallback: criar uma página básica
        const fallbackHtml = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VeloHub - Plataforma de Conhecimento</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
              .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
              .loading { text-align: center; color: #666; }
              .error { color: #dc2626; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>VeloHub</h1>
              <div id="content">
                <div class="loading">Carregando conteúdo...</div>
              </div>
            </div>
            <script>
              // Carregar dados da API
              fetch('/api/data')
                .then(response => response.json())
                .then(data => {
                  const content = document.getElementById('content');
                  if (data.artigos && Object.keys(data.artigos).length > 0) {
                    let html = '<h2>Artigos Disponíveis:</h2>';
                    Object.entries(data.artigos).forEach(([category, catData]) => {
                      html += '<h3>' + catData.title + '</h3>';
                      catData.articles.forEach(article => {
                        html += '<div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">';
                        html += '<h4>' + article.title + '</h4>';
                        html += '<div>' + article.content + '</div>';
                        html += '</div>';
                      });
                    });
                    content.innerHTML = html;
                  } else {
                    content.innerHTML = '<div class="error">Nenhum conteúdo disponível no momento.</div>';
                  }
                })
                .catch(error => {
                  document.getElementById('content').innerHTML = '<div class="error">Erro ao carregar dados: ' + error.message + '</div>';
                });
            </script>
          </body>
          </html>
        `
        setHtmlContent(fallbackHtml)
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando VeloHub...</p>
        </div>
      </div>
    )
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  )
}
