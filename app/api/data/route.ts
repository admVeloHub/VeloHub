import { NextResponse } from 'next/server'
import { VelotaxDB, VeloNews, ChatbotFAQ } from '@/lib/models'

export async function GET() {
  try {
    // Para build estático, retornar dados vazios se não houver MONGODB_URI
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        artigos: {},
        velonews: [],
        chatbotFaq: []
      })
    }

    // Importar dinamicamente para evitar problemas no build
    const { default: clientPromise } = await import('@/lib/mongodb')
    
    const client = await clientPromise
    const db = client.db("velohub")

    // Buscar artigos
    const articlesCollection = db.collection("articles")
    const articles = await articlesCollection.find({}).toArray()

    // Buscar notícias
    const velonewsCollection = db.collection("velonews")
    const velonews = await velonewsCollection.find({}).sort({ createdAt: -1 }).toArray()

    // Buscar FAQs do chatbot
    const chatbotFaqCollection = db.collection("chatbotFaq")
    const chatbotFaq = await chatbotFaqCollection.find({}).toArray()

    // Organizar artigos por categoria
    const velotaxDB: VelotaxDB = {}
    
    articles.forEach(article => {
      if (!velotaxDB[article.category]) {
        velotaxDB[article.category] = {
          key: article.category,
          title: article.category.charAt(0).toUpperCase() + article.category.slice(1),
          articles: []
        }
      }
      velotaxDB[article.category].articles.push({
        title: article.title,
        content: article.content,
        category: article.category
      })
    })

    return NextResponse.json({
      artigos: velotaxDB,
      velonews: velonews,
      chatbotFaq: chatbotFaq
    })

  } catch (error) {
    console.error('Database error:', error)
    // Retornar dados vazios em caso de erro para não quebrar o build
    return NextResponse.json({
      artigos: {},
      velonews: [],
      chatbotFaq: []
    })
  }
}
