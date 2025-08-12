import { NextResponse } from 'next/server'
import { VelotaxDB } from '@/lib/models'

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        artigos: {},
        velonews: [],
        chatbotFaq: []
      })
    }

    const { default: clientPromise } = await import('@/lib/mongodb')
    const client = await clientPromise
    const db = client.db("velohub")

    const [articles, velonews, chatbotFaq] = await Promise.all([
      db.collection("articles").find({}).toArray(),
      db.collection("velonews").find({}).sort({ createdAt: -1 }).toArray(),
      db.collection("chatbotFaq").find({}).toArray()
    ])

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
      velonews,
      chatbotFaq
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({
      artigos: {},
      velonews: [],
      chatbotFaq: []
    })
  }
}
