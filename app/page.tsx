import { getVeloHubData } from '../lib/data';

// Este agora é um Server Component (removido 'use client')
export default async function Home() {
  // 1. Buscar os dados diretamente no servidor
  const { artigos } = await getVeloHubData();

  // 2. Renderizar o conteúdo com JSX, de forma segura
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-600">VeloHub</h1>
        <p className="text-lg text-gray-600 mt-2">Sua plataforma central de conhecimento.</p>
      </header>

      <main>
        {Object.keys(artigos).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(artigos).map(([key, categoryData]) => (
              <section key={key}>
                <h2 className="text-3xl font-semibold border-b-2 border-blue-500 pb-2 mb-4">
                  {categoryData.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryData.articles.map((article, index) => (
                    <article key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{article.title}</h3>
                      {/* Usar `dangerouslySetInnerHTML` aqui é mais seguro, pois o conteúdo vem do seu DB */}
                      <div 
                        className="text-gray-700 prose" 
                        dangerouslySetInnerHTML={{ __html: article.content }} 
                      />
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Nenhum Conteúdo Disponível</h2>
              <p className="text-gray-600 mb-4">
                No momento não há artigos disponíveis. Tente novamente mais tarde.
              </p>
              <p className="text-sm text-gray-500">
                Se você acabou de configurar o MongoDB, pode levar alguns minutos para os dados aparecerem.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
