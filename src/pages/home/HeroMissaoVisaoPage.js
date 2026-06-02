/**
 * VeloHub V3 — Hero: Nossos Valores (Missão, Visão, Cofundadores)
 * VERSION: v1.5.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.5.0: Nossos Valores — conteúdo oficial (Código de Ética v2.1, propósito + valores)
 * - v1.4.0: Coluna esquerda — container único «Nossos Valores»
 * - v1.3.3: Label da aba no hero — «Nossos Valores»
 * - v1.3.1: Mensagem dos Cofundadores — texto oficial + assinaturas
 * - v1.3.0: Coluna esquerda (Missão + Visão) e coluna direita (Mensagem dos Cofundadores)
 * - v1.2.0: Grid 2×2 — Missão, Visão e duas Mensagens do fundador
 * - v1.1.1: Conteúdo placeholder — 5 linhas de lorem ipsum por seção
 * - v1.1.0: Sem título de página; títulos de seção ampliados com gradiente azul
 */

import React from 'react';
import HomeHeroPageShell from './HomeHeroPageShell';

const NOSSO_PROPOSITO =
  'Democratizar e simplificar o acesso a crédito e a serviços de tecnologia para que as pessoas tenham mais oportunidades de fazer o que realmente importa: viver.';

const VALORES_FUNDAMENTAIS = [
  {
    id: 'integridade',
    titulo: 'Integridade Inegociável',
    texto:
      'Agimos com honestidade, transparência e ética em todas as situações, mesmo quando ninguém está observando. Não ocultamos erros e os reportamos imediatamente.',
  },
  {
    id: 'compliance',
    titulo: 'Conformidade (Compliance)',
    texto:
      'Cumprimos rigorosamente todas as leis, regulamentações e normas aplicáveis, vendo isso como vantagem competitiva, não como obstáculo.',
  },
  {
    id: 'inovacao',
    titulo: 'Inovação Responsável',
    texto:
      'Buscamos constantemente formas melhores de fazer as coisas, mas sempre dentro dos limites da conformidade, segurança e ética.',
  },
  {
    id: 'respeito',
    titulo: 'Respeito e Empatia',
    texto:
      'Tratamos todos com consideração, empatia e deferência, independentemente de cargo, origem, gênero, raça ou qualquer outra característica.',
  },
  {
    id: 'equipe',
    titulo: 'Trabalho em Equipe',
    texto:
      'Quando diferentes indivíduos unem suas forças, habilidades e talentos para produzir algo singular, o resultado é único e o bem maior é mútuo.',
  },
  {
    id: 'cliente',
    titulo: 'Foco no Cliente',
    texto:
      'Desenvolvemos soluções financeiras e tecnológicas que geram valor real e justo. Protegemos dados e privacidade como prioridade máxima.',
  },
];

const COFUNDADORES_PARAGRAFOS = [
  'Prezados(as) colaboradores(as), parceiros(as) e clientes,',
  'Em nosso grupo empresarial, acreditamos que a tecnologia tem o poder de transformar vidas e democratizar o acesso a serviços financeiros. Como uma empresa fintech, temos a responsabilidade dupla de inovar com agilidade e, ao mesmo tempo, manter a solidez, a segurança e a integridade que o setor financeiro exige.',
  'Nosso compromisso com a ética, a integridade e a transparência não é apenas uma obrigação regulatória — é a base da confiança que nossos(as) colaboradores(as), clientes e parceiros(as) depositam em nós. Cada decisão que tomamos, cada linha de código que escrevemos e cada atendimento que concluímos deve refletir nossos valores fundamentais.',
  'Esta versão 2.0 do Código de Ética e Conduta foi aprofundada para incorporar temas essenciais como prevenção ao assédio, diversidade e inclusão, responsabilidade socioambiental e gestão ética de fornecedores. Ela reflete as melhores práticas globais e as exigências regulatórias aplicáveis ao nosso segmento.',
  'Lembrem-se: escolhemos o caminho certo, não o mais rápido.',
];

const COFUNDADORES_ASSINATURAS = [
  { nome: 'Eduardo Esmanhotto', cargo: 'Cofundador' },
  { nome: 'Victor Popoff Savioli', cargo: 'Cofundador' },
];

function HeroNossosValoresSection() {
  return (
    <section
      id="nossos-valores"
      className="home-hero-content__section home-hero-content__section--nossos-valores"
    >
      <h2 className="home-hero-content__section-title">Nossos Valores</h2>
      <div className="home-hero-content__block">
        <h3 className="home-hero-content__subsection-title">Nosso Propósito</h3>
        <p className="home-hero-content__text">{NOSSO_PROPOSITO}</p>

        <h3 className="home-hero-content__subsection-title home-hero-content__subsection-title--spaced">
          Valores Fundamentais
        </h3>
        <div className="home-hero-content__valores-list">
          {VALORES_FUNDAMENTAIS.map(({ id, titulo, texto }) => (
            <article key={id} className="home-hero-content__valor-item">
              <h4 className="home-hero-content__valor-nome">{titulo}</h4>
              <p className="home-hero-content__text">{texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroCofundadoresSection() {
  return (
    <section
      id="mensagem-cofundadores"
      className="home-hero-content__section home-hero-content__section--cofundadores"
    >
      <h2 className="home-hero-content__section-title">Mensagem dos Cofundadores</h2>
      <div className="home-hero-content__block">
        {COFUNDADORES_PARAGRAFOS.map((texto, index) => (
          <p key={`cofundadores-${index}`} className="home-hero-content__text">
            {texto}
          </p>
        ))}
      </div>
      <div className="home-hero-content__cofundadores-assinaturas">
        {COFUNDADORES_ASSINATURAS.map(({ nome, cargo }) => (
          <div key={nome} className="home-hero-content__cofundador">
            <span className="home-hero-content__cofundador-nome">{nome}</span>
            <span className="home-hero-content__cofundador-cargo">{cargo}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const HeroMissaoVisaoPage = ({ setActivePage }) => (
  <HomeHeroPageShell
    setActivePage={setActivePage}
    hidePageTitle
    className="home-hero-content--missao-visao"
  >
    <div className="home-hero-content__grid home-hero-content__grid--missao-visao">
      <HeroNossosValoresSection />
      <HeroCofundadoresSection />
    </div>
  </HomeHeroPageShell>
);

export default HeroMissaoVisaoPage;
