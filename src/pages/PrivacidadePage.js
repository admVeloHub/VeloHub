/**
 * VeloHub V3 - Página de Política de Privacidade
 * VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Página pública de Política de Privacidade para Uso Interno do VeloHub
 * Segue padrões visuais do LAYOUT_GUIDELINES.md
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

const PrivacidadePage = () => {
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
            Política de Privacidade para Uso Interno do VeloHub (Velotax)
          </h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-[#323a42] rounded-xl shadow-lg p-8 space-y-8">
          
          {/* Seção 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-[#000058] dark:text-[#F3F7FC] mb-4 font-['Poppins',sans-serif]">
              1. Propósito e Aplicação
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif] mb-4">
              Esta Política estabelece as regras básicas de privacidade e tratamento de dados aplicáveis ao VeloHub, o sistema de uso exclusivo da Velotax para a gestão das atividades e rotinas de trabalho dos seus colaboradores.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif]">
              O VeloHub é uma plataforma interna e as informações contidas nele são consideradas propriedade da Velotax e são tratadas para fins estritamente corporativos.
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-[#000058] dark:text-[#F3F7FC] mb-4 font-['Poppins',sans-serif]">
              2. Dados Coletados e Utilizados
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif] mb-4">
              A Velotax, por meio do VeloHub, trata dados necessários para garantir a operação e a segurança do trabalho interno:
            </p>
            
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-[#000058] dark:text-[#F3F7FC]">
                      Categoria do Dado
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-[#000058] dark:text-[#F3F7FC]">
                      Exemplos (O que é coletado)
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-[#000058] dark:text-[#F3F7FC]">
                      Finalidade Principal (Por que é coletado)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                      Identificação Corporativa
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300">
                      Nome, E-mail Corporativo, Matrícula e Cargo
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300">
                      Gerenciar o acesso do colaborador ao sistema
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                      Atividade e Uso
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300">
                      Registros de login, ações realizadas, histórico de tarefas, logs de erros e documentos criados
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300">
                      Monitorar o desempenho da plataforma, garantir a segurança e auditar o cumprimento das funções laborais
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                      Conteúdo de Trabalho
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300">
                      Relatórios, projetos e documentos inseridos na plataforma
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300">
                      Viabilizar e armazenar o resultado das atividades profissionais do colaborador
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-[#000058] dark:text-[#F3F7FC] mb-4 font-['Poppins',sans-serif]">
              3. Compartilhamento e Acesso
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif] mb-4">
              O acesso aos dados do VeloHub é estritamente controlado e interno:
            </p>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif]">
                <strong className="text-[#000058] dark:text-[#1694FF]">Restrição:</strong> O acesso é limitado aos próprios colaboradores (em sua área de atuação) e às áreas de gestão, Segurança da Informação e TI da Velotax, com base na necessidade de conhecimento para a execução ou supervisão do trabalho.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif]">
                <strong className="text-[#000058] dark:text-[#1694FF]">Terceiros:</strong> As informações não são compartilhadas com terceiros externos, exceto sob rigorosa necessidade de manutenção da infraestrutura (provedores de serviço sob sigilo) ou em cumprimento de obrigações legais, regulatórias ou ordens judiciais.
              </p>
            </div>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-[#000058] dark:text-[#F3F7FC] mb-4 font-['Poppins',sans-serif]">
              4. Segurança e Deveres
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif] mb-2">
                  <strong className="text-[#000058] dark:text-[#1694FF]">Segurança:</strong> A Velotax adota medidas de segurança técnicas e organizacionais (como controle de acesso, criptografia e monitoramento) para proteger os dados contra vazamentos, acesso não autorizado ou manipulação.
                </p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-['Poppins',sans-serif] mb-2">
                  <strong className="text-[#000058] dark:text-[#1694FF]">Responsabilidade do Colaborador:</strong> Ao usar o VeloHub, o colaborador se compromete a:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 dark:text-gray-300">
                  <li>Utilizar o sistema somente para as suas responsabilidades profissionais</li>
                  <li>Manter a confidencialidade e segurança das suas credenciais</li>
                  <li>Não inserir dados pessoais desnecessários ou sensíveis de terceiros no sistema, a menos que seja estritamente exigido pela sua função e em conformidade com as políticas internas</li>
                </ul>
              </div>
            </div>
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

export default PrivacidadePage;

