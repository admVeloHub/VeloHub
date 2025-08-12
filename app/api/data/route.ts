import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getData } from "@/lib/data";

export async function GET() {
  try {
    const connection = await connectToDatabase();
    
    if (!connection) {
      return NextResponse.json({
        artigos: {},
        noticias: [],
        faq: [],
        message: "Banco de dados não configurado"
      });
    }

    const data = await getData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro no GET /api/data:", error);
    return NextResponse.json(
      { 
        artigos: {},
        noticias: [],
        faq: [],
        error: "Erro interno do servidor" 
      },
      { status: 500 }
    );
  }
}
