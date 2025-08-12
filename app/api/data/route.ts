import { NextResponse } from 'next/server';
import { getVeloHubData } from '../../../lib/data';

export async function GET() {
  try {
    const data = await getVeloHubData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { 
        artigos: {},
        noticias: [],
        faq: [],
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}
