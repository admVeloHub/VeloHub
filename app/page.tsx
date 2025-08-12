'use client'

import { useEffect, useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [htmlContent, setHtmlContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Carregar o HTML original e modificar a URL da API
    fetch('/VELOHUB 2.html')
      .then(response => response.text())
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

  return (
    <>
      <Head>
        <title>VeloHub (MK10.6.0)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </>
  )
}
