/**
 * VeloHub V3 - Léxico para cores na nuvem de palavras (Sociais)
 * VERSION: v1.1.1 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Classificação por **léxico fixo** (PT), não por etiquetador morfológico — prioridade: negativo > positivo > verbo > outros.
 * Negativo inclui adjetivos, **substantivos e verbos de alerta** (fraude, jurídico, ameaça etc.).
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.1.1: Léxico negativo ampliado (fraude, mentira, golpe, processo, denúncia, advocacia, polícia, etc.)
 * - v1.1.0: Cores por categoria + léxico inicial de alerta
 *
 * “Outros” recebem cor estável por hash do termo (paleta diversa).
 */
import { normalizeTokenForMatch } from './wordCloudProcessor';

/** @param {string[]} arr */
const toNormSet = (arr) => new Set(arr.map((w) => normalizeTokenForMatch(w)));

/**
 * Termos com carga de avaliação **negativa** (adj. / adv. / juízos frequentes em redes)
 */
const NEGATIVE_RAW = [
  'pessimo', 'péssimo', 'horrivel', 'horrível', 'terrivel', 'terrível', 'ruim', 'pior', 'piorzinha', 'piorzinho',
  'absurdo', 'absurda', 'inaceitavel', 'inaceitável', 'lamentavel', 'lamentável', 'ridiculo', 'ridícula', 'ridicula',
  'vergonhoso', 'vergonhosa', 'decepcionante', 'frustrante', 'injusto', 'injusta', 'abusivo', 'abusiva', 'grosseiro',
  'grossa', 'incompetente', 'desrespeitoso', 'desrespeitosa', 'confuso', 'confusa', 'enganoso', 'enganosa', 'falho',
  'falha', 'quebrado', 'quebrada', 'travado', 'travada', 'instavel', 'instável', 'lento', 'lenta', 'demorado',
  'demorada', 'caro', 'cara', 'difícil', 'dificil', 'complicado', 'complicada', 'odioso', 'odiosa', 'nojento',
  'nojenta', 'pífio', 'pifio', 'medíocre', 'mediocre', 'pavoroso', 'pavorosa', 'bizarro', 'bizarra',
  'inseguro', 'insegura', 'ilegal', 'imoral', 'sacanagem', 'mentiroso', 'mentirosa', 'falso', 'falsa',
  // Fraude, engano e alerta forte (substantivos / verbos)
  'mentira', 'mentiras', 'mentir', 'mentiu', 'golpe', 'golpes', 'golpista', 'fraude', 'fraudes', 'fraudador',
  'fraudadores', 'fraudulenta', 'fraudulento', 'estelionato', 'estelionatario', 'estelionatário', 'picareta',
  'calote', 'caloteiro', 'caloteira', 'trambique', 'trambiqueiro', 'vigarice', 'vigario', 'vigarista',
  'armação', 'armacao', 'escroto', 'escrota', 'pilantra', 'pilantragem', 'safado', 'safada',
  'manipular', 'manipulacao', 'manipulação', 'manipulou', 'iludir', 'iludiu', 'ilusão', 'ilusao',
  'enganar', 'enganou', 'enganando', 'engano', 'enganado', 'enganada', 'enganaram', 'omitir', 'omitiu',
  'roubar', 'roubou', 'roubando', 'roubo', 'roubado', 'roubada', 'roubaram', 'nada',
  // Via jurídica / denúncia / processo (tom de alerta)
  'processo', 'processos', 'processar', 'processando', 'processado', 'processada', 'processual',
  'acao', 'ação', 'judicial', 'extrajudicial', 'peticao', 'petição', 'inicial', 'liminar', 'mandado',
  'audiencia', 'audiência', 'vara', 'tribunal', 'tribunais', 'juizado', 'juiz', 'juiza', 'juíza',
  'justica', 'justiça', 'criminal', 'civel', 'cível', 'penal', 'reu', 'réu', 'autor', 'autora',
  'denuncia', 'denúncia', 'denuncias', 'denunciar', 'denunciou', 'denunciando', 'denunciado', 'denunciada',
  'denunciante', 'reclamacao', 'reclamação', 'notificacao', 'notificação', 'notificar', 'notificou',
  'acionar', 'acionou', 'aciona', 'acionando', 'acionamento', 'acionado', 'acionada',
  'protestar', 'protesto', 'execucao', 'execução', 'penalidade',
  'advogado', 'advogada', 'advogados', 'advogadas', 'advocacia', 'escritorio', 'escritório', 'oab',
  'calunia', 'calúnia', 'caluniar', 'difamacao', 'difamação', 'difamar',
  'ameaca', 'ameaça', 'ameacar', 'ameaçar', 'ameacou', 'ameaçou', 'chantagem', 'extorsao', 'extorsão',
  'crime', 'crimes', 'criminoso', 'criminosa', 'abuso', 'abusos', 'abusivo', 'ilegalidade', 'ilicito',
  'ilícito', 'corrupcao', 'corrupção', 'propina', 'escandalo', 'escândalo', 'sequestro',
  'procon', 'bacen',
  'policia', 'polícia', 'delegacia', 'delegado', 'delegada', 'boletim', 'ocorrencia', 'ocorrência',
  'inquerito', 'inquérito', 'indiciamento', 'litigio', 'litígio', 'litigar', 'demanda', 'demandar',
  'coacao', 'coação', 'infração', 'infracao',
];
/**
 * Termos com carga **positiva**
 */
const POSITIVE_RAW = [
  'otimo', 'ótimo', 'otima', 'ótima', 'excelente', 'perfeito', 'perfeita', 'maravilhoso', 'maravilhosa',
  'fantastico', 'fantástico', 'fantastica', 'fantástica', 'espetacular', 'incrivel', 'incrível', 'eficiente',
  'rapido', 'rápido', 'rapida', 'rápida', 'agil', 'ágil', 'atencioso', 'atenciosa', 'cordial', 'educado', 'educada',
  'prestativo', 'prestativa', 'satisfatorio', 'satisfatório', 'satisfatoria', 'satisfatória', 'transparente', 'claro',
  'clara', 'facil', 'fácil', 'simples', 'intuitivo', 'intuitiva', 'confiavel', 'confiável', 'seguro', 'segura',
  'correto', 'correta', 'solucionado', 'solucionada', 'resolvido', 'resolvida', 'agradavel', 'agradável', 'excelência',
  'excelencia', 'nota10', 'notadez', 'show', 'parabens', 'parabéns', 'impecavel', 'impecável', 'recomendo', 'elogio',
  'elogios', 'satisfeito', 'satisfeita', 'feliz', 'contente', 'animado', 'animada',
];

/**
 * **Verbos / formas verbais** comuns em mensagens de atendimento (ações e processos)
 */
const VERB_RAW = [
  'pagar', 'pagou', 'paga', 'pagamos', 'pagando', 'pago', 'pagos', 'paguei',
  'receber', 'recebeu', 'recebe', 'recebendo', 'recebido', 'recebida', 'recebi',
  'funcionar', 'funciona', 'funcionou', 'funcionando', 'funcionava',
  'resolver', 'resolveu', 'resolve', 'resolvendo', 'resolvam',
  'atender', 'atendeu', 'atende', 'atendendo', 'atendi',
  'ajudar', 'ajudou', 'ajuda', 'ajudando', 'ajudem', 'ajudei',
  'devolver', 'devolveu', 'devolve', 'devolvendo', 'devolvido', 'devolvida',
  'cobrar', 'cobrou', 'cobra', 'cobrando', 'cobranca', 'cobrança',
  'transferir', 'transferiu', 'transfere', 'transferencia', 'transferência', 'transferindo',
  'bloquear', 'bloqueou', 'bloqueia', 'bloqueando', 'bloqueado', 'bloqueada',
  'cancelar', 'cancelou', 'cancela', 'cancelando', 'cancelado', 'cancelada',
  'negar', 'negou', 'nega', 'negando', 'negado', 'negada',
  'reclamar', 'reclamou', 'reclama', 'reclamando', 'reclamei',
  'pedir', 'pediu', 'pede', 'pedindo', 'pedi',
  'solicitar', 'solicitou', 'solicita', 'solicitando', 'solicitacao', 'solicitação',
  'esperar', 'esperou', 'espera', 'esperando',
  'demorar', 'demorou', 'demora', 'demorando',
  'atrasar', 'atrasou', 'atrasa', 'atrasando', 'atrasado', 'atrasada', 'atraso',
  'enviar', 'enviou', 'envia', 'enviando', 'enviado', 'enviada',
  'retornar', 'retornou', 'retorna', 'retornando',
  'contatar', 'contatou', 'contata', 'contatando',
  'ligar', 'ligou', 'liga', 'ligando',
  'responder', 'respondeu', 'responde', 'respondendo', 'respondido',
  'abrir', 'abriu', 'abre', 'abrindo',
  'fechar', 'fechou', 'fecha', 'fechando', 'fechado', 'fechada',
  'cadastrar', 'cadastrou', 'cadastra', 'cadastrando', 'cadastro',
  'confirmar', 'confirmou', 'confirma', 'confirmando', 'confirmado',
  'estornar', 'estornou', 'estorna', 'estorno',
  'reembolsar', 'reembolsou', 'reembolsa', 'reembolso',
  'acessar', 'acessou', 'acessa', 'acessando', 'acesso',
  'atualizar', 'atualizou', 'atualiza', 'atualizando', 'atualizado',
  'instalar', 'instalou', 'instala', 'instalando',
  'baixar', 'baixou', 'baixa', 'baixando',
  'chamar', 'chamou', 'chama', 'chamando',
  'avisar', 'avisou', 'avisa', 'avisando',
  'informar', 'informou', 'informa', 'informando',
  'anexar', 'anexou', 'anexa', 'anexando', 'anexo',
  'contestar', 'contestou', 'contesta',
  'procurar', 'procurou', 'procura', 'procurando',
  'comparecer', 'compareceu', 'comparece',
];

const LEX_NEGATIVE = toNormSet(NEGATIVE_RAW);
const LEX_POSITIVE = toNormSet(POSITIVE_RAW);
const LEX_VERB = toNormSet(VERB_RAW);

/** Cores alinhadas à marca / contraste em fundo claro */
export const WORDCLOUD_COLORS = {
  positive: '#15A237',
  negative: '#dc3545',
  verb: '#1634FF',
};

/** Paleta para termos que não bateram no léxico (espalhada por hash). */
const OTHER_PALETTE = ['#9333ea', '#0891b2', '#ca8a04', '#ea580c', '#0f766e', '#7c2d12'];

/**
 * @param {string} normalized
 * @returns {number}
 */
function hashPick(normalized) {
  let h = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    h = (h * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return h % OTHER_PALETTE.length;
}

/**
 * @param {string} token — texto do termo na nuvem (já sem acento na origem dos dados)
 * @returns {'negative' | 'positive' | 'verb' | 'other'}
 */
export function classifyWordCloudTerm(token) {
  const n = normalizeTokenForMatch(token);
  if (!n || n.length < 2) return 'other';
  if (LEX_NEGATIVE.has(n)) return 'negative';
  if (LEX_POSITIVE.has(n)) return 'positive';
  if (LEX_VERB.has(n)) return 'verb';
  return 'other';
}

/**
 * @param {string} token
 * @returns {string} cor CSS (hex)
 */
export function getWordCloudTermColor(token) {
  const cat = classifyWordCloudTerm(token);
  if (cat === 'negative') return WORDCLOUD_COLORS.negative;
  if (cat === 'positive') return WORDCLOUD_COLORS.positive;
  if (cat === 'verb') return WORDCLOUD_COLORS.verb;
  const n = normalizeTokenForMatch(token);
  return OTHER_PALETTE[hashPick(n || 'x')];
}
