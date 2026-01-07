/**
 * VeloHub V3 - Página de Termos de Uso e Responsabilidade
 * VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Página pública de Termos de Uso e Responsabilidade do VeloHub
 * Segue padrões visuais do LAYOUT_GUIDELINES.md
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

const TermosPage = () => {
  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#272A30] transition-colors duration-300">
      {/* Header simples */}
      <header className="bg-white dark:bg-[#323a42] border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-[#000058] dark:text-[#1694FF] hover:opacity-80 transition-opacity mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
          <h1 className="text-3xl font-bold text-[#000058] dark:text-[#F3F7FC] font-['Poppins',sans-serif]">
            Termos de Uso e Responsabilidade – VeloHub
          </h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-[#323a42] rounded-xl shadow-lg p-8 space-y-8">
          
          {/* Seção 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-[#000058] dark:text-[#F3F7FC] mb-4 font-['Poppins',sans-serif]">
              1. Definição e Objetivo
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif]">
              O VeloHub é a plataforma corporativa central do Velotax. Seu objetivo principal é garantir o acesso rápido e centralizado a ferramentas operacionais, informações estratégicas relevantes ao trabalho, canais de comunicação interna e facilidades para o dia a dia na empresa.
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-[#000058] dark:text-[#F3F7FC] mb-4 font-['Poppins',sans-serif]">
              2. Finalidade de Uso
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif]">
              A plataforma deve ser utilizada exclusivamente no ambiente de trabalho e com o único objetivo de facilitar e viabilizar as atividades profissionais do colaborador. É vedada a utilização do sistema para fins pessoais ou alheios aos interesses corporativos.
            </p>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-[#000058] dark:text-[#F3F7FC] mb-4 font-['Poppins',sans-serif]">
              3. Credenciais e Segurança
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif]">
              As credenciais de acesso (login e senha) são pessoais e intransferíveis. É expressamente proibido compartilhar as credenciais com qualquer outra pessoa, inclusive colegas de trabalho. É enfaticamente vedado o compartilhamento de acesso ou de informações da plataforma com terceiros externos à empresa. A violação desta diretriz compromete a segurança do Velotax e estará sujeita às medidas disciplinares e legais cabíveis.
            </p>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-[#000058] dark:text-[#F3F7FC] mb-4 font-['Poppins',sans-serif]">
              4. Compromisso do Usuário
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif]">
              Ao utilizar o VeloHub, o usuário declara estar ciente dos objetivos e aplicações da plataforma descritos nestes termos. O usuário compromete-se a realizar o uso responsável dos acessos fornecidos, preservando a confidencialidade das informações e seguindo as normas internas de segurança.
            </p>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-[#000058] dark:text-[#F3F7FC] mb-4 font-['Poppins',sans-serif]">
              5. Monitoramento
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif]">
              O Velotax reserva-se o direito de monitorar e auditar os acessos e atividades realizados na plataforma para garantir a segurança dos dados e o cumprimento destes termos.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 VeloHub. Todos os direitos reservados.</p>
        </div>
      </main>
    </div>
  );
};

export default TermosPage;

