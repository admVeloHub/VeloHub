/**
 * VeloHub V3 — Formulário Chargeback (Ouvidoria / Reclamações)
 * VERSION: v1.3.2 | DATE: 2026-05-12 | AUTHOR: VeloHub Development Team
 *
 * v1.3.2: Anexos — criação: só × para remover pendente; edição/modal «Continuar»: só ⋮ («Excluir anexo»), sem × duplicado.
 * v1.3.1: Anexos — integração submit: fila local + `processarUploadPendentes`; seção JSX com slots/viewer; `data-chargeback-anexo-root` no slot.
 * v1.3.0: Anexos — fila local com object URL + miniaturas; remoção (ícone e menu «Excluir anexo»); upload assíncrono após salvar; viewer com setas (teclado) para imagens/PDF link.
 * v1.2.3: Mostrador «Protocolo» no mesmo padrão visual de FormReclamacao / FormReclamacaoEdit (faixa rounded-vh-card, tipografia velohub-title azul).
 * v1.2.2: Modo criação — prévia do protocolo via GET `/chargeback/proximo-protocolo-sugerido`; rótulo único «Protocolo» (sem texto explicativo).
 * v1.2.1: Faixa «Protocolo Chargeback» visível no form (edição sempre; criação após salvar + aviso antes do 1º save).
 * v1.2.0: Anexos — grade de miniaturas (imagens) e tarjas PDF/DOC; link em toda a miniatura.
 * v1.1.0: Modo `edit` (`recordId` + GET/PUT chargeback); prefixo de ids `cbk-edit` no edit (evita duplicar DOM com formulário de criação); bloco opcional protocolo.
 * v1.0.14: Removido texto auxiliar sob «Anexos» (tipos de arquivo e pasta no bucket).
 * v1.0.13: Protocolos Central — inputs com largura proporcional ao texto (`size`), sem ocupar linha inteira.
 * v1.0.12: E-mail e primeiro Telefone na mesma linha (md+); «+» ao lado; telefones extras abaixo.
 * v1.0.11: Coluna «Retorno da busca» com metade da largura relativa em relação ao Nome (1fr : 3fr).
 * v1.0.10: CPF, Consultar, Retorno da busca e Nome do Cliente na mesma linha (md+).
 * v1.0.9: Layout dos dados do cliente alinhado ao FormReclamacao (CPF|Consultar|Retorno em 1fr; Nome|telefones; E-mail|botão +).
 * v1.0.8: Removidos título e cabeçalho decorativo acima do formulário.
 * v1.0.7: Anexos — botão «Escolher arquivos» no padrão VeloHub (#006AB9); input file oculto.
 * v1.0.6: Rótulo do campo valor sem «(opcional)».
 * v1.0.5: Campo Produto como `<select>` com `OUVIDORIA_PRODUTO_OPCOES` (mesmo conjunto Dashboard/Lista).
 * v1.0.4: E-mail e telefone (primeiro) na mesma linha em telas médias+.
 * v1.0.3: «Nome do Cliente» na primeira linha após «Retorno da busca» (linha dedicada).
 * v1.0.2: Campo «Retorno da busca» com largura proporcional ao texto (sem ocupar `1fr` inteiro).
 * v1.0.1: Removido wrapper `velohub-card` ao redor do formulário (layout alinhado ao restante da aba).
 * Persistência `hub_ouvidoria.reclamacoes_chargeback`; protocolo gerado na API (CBKAAAA/XXX).
 * Consulta por CPF via mesma API das reclamações; sem fusão.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { reclamacoesAPI, anexosAPI, chargebackAPI } from '../../services/ouvidoriaApi';
import { mensagemRetornoBuscaLocalizar } from '../../utils/ouvidoriaLocalizarRetornoMsg';
import { FloatingLabelField } from '../shared/FloatingLabelField';
import { OUVIDORIA_PRODUTO_OPCOES } from '../../utils/ouvidoriaProdutoOpcoes';

const formatCPF = (value) => {
  const cleaned = String(value || '').replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return String(value || '');
};

const formatarEmail = (valor) =>
  String(valor || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '');

const validarCPF = (cpf) => {
  const cleaned = String(cpf || '').replace(/\D/g, '');
  return cleaned.length === 11;
};

function parseValorInput(str) {
  if (str == null || String(str).trim() === '') return undefined;
  const s = String(str).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

const initialForm = () => ({
  nome: '',
  cpf: '',
  telefones: { lista: [''] },
  email: '',
  localizarAtendimentos: '',
  produto: '',
  dataEntrada: new Date().toISOString().split('T')[0],
  valorStr: '',
  descricao: '',
  protocolosCentral: [''],
  revertido: false,
  anexos: [],
});

function isoDateFromDoc(val) {
  if (val == null || val === '') return '';
  try {
    const d = val instanceof Date ? val : new Date(val);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function valorDocToValorStr(val) {
  if (val == null || val === '') return '';
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** @param {Record<string, unknown>} doc */
function docChargebackToFormState(doc) {
  const base = initialForm();
  if (!doc || typeof doc !== 'object') return base;
  const cpfDigits = String(doc.cpf || '').replace(/\D/g, '');
  const protos = Array.isArray(doc.protocolosCentral)
    ? doc.protocolosCentral.map((p) => String(p || '').trim()).filter(Boolean)
    : [];
  const tlista =
    doc.telefones?.lista && Array.isArray(doc.telefones.lista) && doc.telefones.lista.length > 0
      ? doc.telefones.lista.map((t) => String(t || '').trim()).filter(Boolean)
      : [];
  const anexos = Array.isArray(doc.anexos) ? doc.anexos : [];
  const anexosNorm = anexos.map((x) =>
    typeof x === 'string' && x.trim() ? { url: x.trim() } : x && typeof x === 'object' && x.url ? x : null,
  ).filter(Boolean);

  const dataIso = isoDateFromDoc(doc.dataEntrada);

  return {
    ...base,
    nome: doc.nome != null ? String(doc.nome) : '',
    cpf: cpfDigits ? formatCPF(cpfDigits) : '',
    telefones: { lista: tlista.length > 0 ? tlista : [''] },
    email: doc.email != null ? formatarEmail(String(doc.email)) : '',
    localizarAtendimentos: doc.localizarAtendimentos != null ? String(doc.localizarAtendimentos) : '',
    produto: doc.produto != null ? String(doc.produto).trim() : '',
    dataEntrada: dataIso || base.dataEntrada,
    valorStr: valorDocToValorStr(doc.valor),
    descricao: doc.descricao != null ? String(doc.descricao) : '',
    protocolosCentral: protos.length > 0 ? protos : [''],
    revertido: doc.revertido === true || doc.revertido === 'true',
    anexos: anexosNorm,
  };
}

function normalizeAnexosList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => {
      if (typeof x === 'string' && x.trim()) return { url: x.trim() };
      if (x && typeof x === 'object' && typeof x.url === 'string' && x.url.trim()) {
        return { url: String(x.url).trim() };
      }
      return null;
    })
    .filter(Boolean);
}

function newPendingId() {
  try {
    if (globalThis.crypto?.randomUUID) return `pend-${globalThis.crypto.randomUUID()}`;
  } catch {
    /* ignore */
  }
  return `pend-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** @param {string} name */
function kindFromFileName(name) {
  const n = String(name || '').toLowerCase();
  if (/\.(jpe?g|png|gif|webp)$/i.test(n)) return 'image';
  if (/\.pdf$/i.test(n)) return 'pdf';
  if (/\.docx?$/i.test(n)) return 'doc';
  return 'other';
}

function extensaoAnexoUrl(url) {
  try {
    const path = String(url || '').split('?')[0].split('#')[0];
    const m = path.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : '';
  } catch {
    return '';
  }
}

function kindFromUrl(u) {
  const e = extensaoAnexoUrl(u);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(e)) return 'image';
  if (e === 'pdf') return 'pdf';
  if (e === 'doc' || e === 'docx') return 'doc';
  return 'other';
}

/**
 * Miniatura com remoção condicional ao contexto.
 * @param {object} p
 * @param {'create'|'edit'} [p.anexoUxContext='edit'] — create: só ×; edit (modal/tratamento): só ⋮ «Excluir anexo».
 * @param {string} p.kind
 * @param {string} p.url
 * @param {number} p.index
 * @param {() => void} [p.onOpen]
 * @param {() => void} p.onRemove
 * @param {boolean} p.menuOpen
 * @param {() => void} p.onMenuToggle
 * @param {boolean} [p.disableOpen]
 */
function ChargebackAnexoSlot({
  kind,
  url,
  index,
  anexoUxContext = 'edit',
  onOpen,
  onRemove,
  menuOpen,
  onMenuToggle,
  disableOpen,
}) {
  const showQuickRemove = anexoUxContext === 'create';
  const showOptionsMenu = anexoUxContext === 'edit';
  const [imgErr, setImgErr] = useState(false);
  const isImage = kind === 'image';
  const usarImagem = isImage && !imgErr;

  let rotuloTarja = 'Arquivo';
  if (!usarImagem) {
    if (isImage && imgErr) rotuloTarja = 'IMG';
    else if (kind === 'pdf') rotuloTarja = 'PDF';
    else if (kind === 'doc') rotuloTarja = 'DOC';
    else if (kind === 'other' && extensaoAnexoUrl(url)) rotuloTarja = String(extensaoAnexoUrl(url)).toUpperCase().slice(0, 4);
  }

  return (
    <div className="relative h-[4.5rem] w-[4.5rem] shrink-0" data-chargeback-anexo-root>
      {showQuickRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute left-0.5 top-0.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white transition hover:bg-black/80"
          title="Remover da lista"
          aria-label="Remover anexo da lista"
        >
          ×
        </button>
      ) : null}
      {showOptionsMenu ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          className="absolute right-0.5 top-0.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white transition hover:bg-black/80"
          title="Opções"
          aria-label="Opções do anexo"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          ⋮
        </button>
      ) : null}
      <div
        role={disableOpen ? undefined : 'button'}
        tabIndex={disableOpen ? undefined : 0}
        className={`relative flex h-full w-full overflow-hidden rounded-lg border border-gray-300 bg-gray-100 shadow-sm outline-none transition dark:border-gray-600 dark:bg-gray-800 ${
          disableOpen ? '' : 'cursor-pointer hover:border-[#006AB9] hover:ring-1 hover:ring-[#006AB9]'
        }`}
        onClick={() => {
          if (!disableOpen && onOpen) onOpen();
        }}
        onKeyDown={(e) => {
          if (disableOpen || !onOpen) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        {usarImagem ? (
          <img
            src={url}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] font-semibold leading-tight tracking-tight text-gray-600 dark:text-gray-300">
            {rotuloTarja}
          </span>
        )}
        <span className="pointer-events-none absolute bottom-0 left-0 right-0 truncate bg-black/55 px-0.5 text-center text-[9px] font-medium tabular-nums text-white">
          {index + 1}
        </span>
      </div>
      {showOptionsMenu && menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-8 z-30 min-w-[10rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
            onClick={() => {
              onMenuToggle();
              onRemove();
            }}
          >
            Excluir anexo
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * @param {{ open: boolean, onClose: () => void, items: { url: string, isImage: boolean }[], index: number, onIndexChange: (i: number) => void }} p
 */
function ChargebackAnexoViewerModal({ open, onClose, items, index, onIndexChange }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
      if (e.key === 'ArrowRight' && index < items.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, items.length, onClose, onIndexChange]);

  if (!open || items.length === 0) return null;
  const cur = items[index];
  if (!cur) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[95vh] max-w-[95vw] flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-1 -top-10 z-10 rounded p-1 text-3xl leading-none text-white hover:text-gray-200"
          aria-label="Fechar"
        >
          ×
        </button>
        {items.length > 1 && index > 0 ? (
          <button
            type="button"
            onClick={() => onIndexChange(index - 1)}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 text-2xl font-bold text-[#006AB9] shadow-md hover:bg-white md:-translate-x-4 dark:bg-gray-800 dark:text-[#93c5fd]"
            aria-label="Anexo anterior"
          >
            ‹
          </button>
        ) : null}
        {items.length > 1 && index < items.length - 1 ? (
          <button
            type="button"
            onClick={() => onIndexChange(index + 1)}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 text-2xl font-bold text-[#006AB9] shadow-md hover:bg-white md:translate-x-4 dark:bg-gray-800 dark:text-[#93c5fd]"
            aria-label="Próximo anexo"
          >
            ›
          </button>
        ) : null}
        {cur.isImage ? (
          <img
            src={cur.url}
            alt=""
            className="max-h-[88vh] max-w-full rounded object-contain shadow-xl"
          />
        ) : (
          <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-xl dark:bg-gray-800">
            <p className="mb-4 text-gray-700 dark:text-gray-200">
              Pré-visualização indisponível neste painel para este arquivo.
            </p>
            <a
              href={cur.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#006AB9] underline dark:text-[#93c5fd]"
            >
              Abrir em nova aba
            </a>
          </div>
        )}
        {items.length > 1 ? (
          <div className="mt-4 text-center text-sm text-white">
            {index + 1} / {items.length}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * @param {object} p
 * @param {string} [p.responsavel]
 * @param {() => void} [p.onSaved]
 * @param {'create'|'edit'} [p.mode]
 * @param {string|null} [p.recordId]
 * @param {boolean} [p.embedded] — sem `mb-8` no form (ex.: modal)
 */
export default function FormChargebackOuvidoria({
  responsavel = '',
  onSaved,
  mode = 'create',
  recordId = null,
  embedded = false,
}) {
  const fid = mode === 'edit' ? 'cbk-edit' : 'cbk';
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const dropdownRef = useRef(null);
  const anexoInputRef = useRef(null);
  const [editProtocolo, setEditProtocolo] = useState('');
  /** Próximo CBK previsto pela API (modo criação); atualizado após cada save bem-sucedido. */
  const [protocoloPrevisao, setProtocoloPrevisao] = useState('');
  const [protocoloPrevisaoCarregando, setProtocoloPrevisaoCarregando] = useState(false);
  const [protocoloPrevisaoTick, setProtocoloPrevisaoTick] = useState(0);
  const [hydratingEdit, setHydratingEdit] = useState(mode === 'edit' && Boolean(recordId));
  const [editLoadError, setEditLoadError] = useState(null);
  /** @type {[{ id: string, file: File, previewUrl: string }]} */
  const [anexosPendentes, setAnexosPendentes] = useState([]);
  const pendentesRef = useRef(anexosPendentes);
  const [anexoMenuId, setAnexoMenuId] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    pendentesRef.current = anexosPendentes;
  }, [anexosPendentes]);

  useEffect(
    () => () => {
      pendentesRef.current.forEach((p) => {
        try {
          URL.revokeObjectURL(p.previewUrl);
        } catch {
          /* ignore */
        }
      });
    },
    [],
  );

  useEffect(() => {
    if (anexoMenuId == null) return undefined;
    const onDown = (e) => {
      if (!e.target.closest?.('[data-chargeback-anexo-root]')) setAnexoMenuId(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [anexoMenuId]);

  useEffect(() => {
    const close = (event) => {
      if (showSaveOptions && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSaveOptions(false);
      }
    };
    if (showSaveOptions) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showSaveOptions]);

  useEffect(() => {
    if (mode !== 'edit' || !recordId) {
      setHydratingEdit(false);
      setEditLoadError(null);
      setEditProtocolo('');
      return undefined;
    }
    let cancelled = false;
    setHydratingEdit(true);
    setEditLoadError(null);
    (async () => {
      try {
        const res = await chargebackAPI.getById(recordId);
        const doc = res?.data;
        if (cancelled) return;
        if (!doc) throw new Error('Registro não encontrado');
        setFormData(docChargebackToFormState(doc));
        const np =
          doc.numeroProtocolo != null
            ? String(doc.numeroProtocolo).trim()
            : doc.protocolo != null
              ? String(doc.protocolo).trim()
              : '';
        setEditProtocolo(np);
      } catch (e) {
        if (!cancelled) setEditLoadError(e?.message || 'Erro ao carregar');
      } finally {
        if (!cancelled) setHydratingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, recordId]);

  useEffect(() => {
    if (mode !== 'create') return undefined;
    let cancelled = false;
    setProtocoloPrevisaoCarregando(true);
    setProtocoloPrevisao('');
    (async () => {
      try {
        const res = await chargebackAPI.getProximoProtocoloSugerido();
        const raw = res?.data?.numeroProtocolo;
        const np = raw != null ? String(raw).trim() : '';
        if (!cancelled) setProtocoloPrevisao(np);
      } catch {
        if (!cancelled) setProtocoloPrevisao('');
      } finally {
        if (!cancelled) setProtocoloPrevisaoCarregando(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, protocoloPrevisaoTick]);

  const atualizarTelefone = (index, value) => {
    setFormData((prev) => {
      const lista = [...prev.telefones.lista];
      lista[index] = value;
      return { ...prev, telefones: { lista } };
    });
  };

  const adicionarTelefone = () => {
    setFormData((prev) => ({
      ...prev,
      telefones: { lista: [...prev.telefones.lista, ''] },
    }));
  };

  const removerTelefone = (index) => {
    setFormData((prev) => ({
      ...prev,
      telefones: {
        lista: prev.telefones.lista.filter((_, i) => i !== index).length
          ? prev.telefones.lista.filter((_, i) => i !== index)
          : [''],
      },
    }));
  };

  const atualizarProtocoloCentral = (index, value) => {
    setFormData((prev) => {
      const arr = [...prev.protocolosCentral];
      arr[index] = value;
      return { ...prev, protocolosCentral: arr };
    });
  };

  const adicionarProtocoloCentral = () => {
    setFormData((prev) => ({
      ...prev,
      protocolosCentral: [...prev.protocolosCentral, ''],
    }));
  };

  const removerProtocoloCentral = (index) => {
    setFormData((prev) => ({
      ...prev,
      protocolosCentral:
        prev.protocolosCentral.filter((_, i) => i !== index).length > 0
          ? prev.protocolosCentral.filter((_, i) => i !== index)
          : [''],
    }));
  };

  const consultarPorCpf = async () => {
    if (!validarCPF(formData.cpf)) {
      toast.error('CPF inválido. Preencha os 11 dígitos.');
      return;
    }
    setBuscando(true);
    try {
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      const resultado = await reclamacoesAPI.getByCpf(cpfLimpo);
      const todasReclamacoes = Array.isArray(resultado) ? resultado : resultado?.data || [];

      const textoRetornoBusca = mensagemRetornoBuscaLocalizar({
        todasReclamacoes,
        outrosRegistros: todasReclamacoes,
        tipoFormulario: 'CHARGEBACK',
      });

      const sortedPorData = [...todasReclamacoes].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
      const nomeMerge = sortedPorData.map((x) => String(x.nome || '').trim()).find(Boolean);
      const emailMerge = sortedPorData.map((x) => String(x.email || '').trim()).find(Boolean);
      const telKeys = new Set();
      const telLista = [];
      for (const r of todasReclamacoes) {
        const lista = r.telefones?.lista;
        if (!Array.isArray(lista)) continue;
        for (const tel of lista) {
          const k = String(tel || '').replace(/\D/g, '');
          if (k.length >= 8 && !telKeys.has(k)) {
            telKeys.add(k);
            telLista.push(String(tel).trim());
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        localizarAtendimentos: textoRetornoBusca,
        ...(nomeMerge ? { nome: nomeMerge } : {}),
        ...(emailMerge ? { email: formatarEmail(emailMerge) } : {}),
        ...(telLista.length > 0 ? { telefones: { lista: telLista } } : {}),
      }));
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Erro ao consultar reclamações por CPF');
    } finally {
      setBuscando(false);
    }
  };

  /**
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const onAnexosSelecionados = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const novos = files.map((file) => ({
      id: newPendingId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setAnexosPendentes((prev) => [...prev, ...novos]);
  };

  const removerAnexoPendente = useCallback((id) => {
    setAnexosPendentes((prev) => {
      const cur = prev.find((p) => p.id === id);
      if (cur) {
        try {
          URL.revokeObjectURL(cur.previewUrl);
        } catch {
          /* ignore */
        }
      }
      return prev.filter((p) => p.id !== id);
    });
    setAnexoMenuId((mid) => (mid === `p-${id}` ? null : mid));
  }, []);

  const removerAnexoSalvo = useCallback((indexNoArraySalvo) => {
    setFormData((prev) => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== indexNoArraySalvo),
    }));
  }, []);

  const montarPayload = (modo) => {
    const valorNum = parseValorInput(formData.valorStr);
    return {
      nome: formData.nome.trim(),
      cpf: formData.cpf.replace(/\D/g, ''),
      telefones: {
        lista: formData.telefones.lista.map((t) => String(t || '').trim()).filter(Boolean),
      },
      email: formatarEmail(formData.email),
      localizarAtendimentos: formData.localizarAtendimentos,
      produto: formData.produto.trim(),
      dataEntrada: formData.dataEntrada ? new Date(formData.dataEntrada).toISOString() : undefined,
      ...(valorNum !== undefined ? { valor: valorNum } : {}),
      descricao: formData.descricao,
      protocolosCentral: formData.protocolosCentral.map((p) => String(p || '').trim()).filter(Boolean),
      revertido: formData.revertido === true,
      anexos: normalizeAnexosList(formData.anexos),
      responsavel: String(responsavel || '').trim(),
      _saveMode: modo === 'resolvido' ? 'resolvido' : 'em-andamento',
    };
  };

  const processarUploadPendentes = useCallback(
    async (targetId, snapshot, baseAnexos) => {
      if (!snapshot.length) return normalizeAnexosList(baseAnexos);
      const novos = [];
      for (const p of snapshot) {
        try {
          const resultado = await anexosAPI.upload(p.file, 'CHARGEBACK');
          if (resultado?.url) novos.push({ url: resultado.url });
        } catch (error) {
          console.error(error);
          toast.error(`${p.file.name}: ${error?.message || 'Erro no upload'}`);
        } finally {
          try {
            URL.revokeObjectURL(p.previewUrl);
          } catch {
            /* ignore */
          }
        }
      }
      let merged = normalizeAnexosList(baseAnexos);
      if (novos.length > 0) {
        merged = [...merged, ...novos];
        await chargebackAPI.update(targetId, {
          anexos: merged,
          responsavel: String(responsavel || '').trim(),
        });
        toast.success(`${novos.length} anexo(s) enviado(s)`);
      }
      return merged;
    },
    [responsavel],
  );

  const viewerStrip = useMemo(() => {
    const out = [];
    anexosPendentes.forEach((p) => {
      out.push({
        url: p.previewUrl,
        isImage: kindFromFileName(p.file.name) === 'image',
      });
    });
    (formData.anexos || []).forEach((item) => {
      const url = typeof item === 'string' ? item : item?.url;
      if (url) {
        out.push({
          url: String(url),
          isImage: kindFromUrl(String(url)) === 'image',
        });
      }
    });
    return out;
  }, [anexosPendentes, formData.anexos]);

  const openViewerAt = useCallback(
    (globalIndex) => {
      if (globalIndex >= 0 && globalIndex < viewerStrip.length) {
        setViewerIndex(globalIndex);
        setViewerOpen(true);
      }
    },
    [viewerStrip],
  );

  useEffect(() => {
    if (!viewerOpen || viewerStrip.length === 0) return;
    if (viewerIndex >= viewerStrip.length) {
      setViewerIndex(Math.max(0, viewerStrip.length - 1));
    }
  }, [viewerOpen, viewerIndex, viewerStrip.length]);

  const validar = () => {
    if (!validarCPF(formData.cpf)) {
      toast.error('CPF inválido');
      return false;
    }
    if (!String(formData.nome || '').trim()) {
      toast.error('Informe o nome do cliente');
      return false;
    }
    if (!String(formData.produto || '').trim()) {
      toast.error('Informe o produto');
      return false;
    }
    if (!String(formData.dataEntrada || '').trim()) {
      toast.error('Informe a data do chargeback');
      return false;
    }
    if (!String(formData.descricao || '').trim()) {
      toast.error('Informe a descrição');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e, modo = null) => {
    e.preventDefault();
    if (!modo) {
      setShowSaveOptions(true);
      return;
    }
    if (!validar()) {
      setShowSaveOptions(false);
      return;
    }
    setLoading(true);
    setShowSaveOptions(false);
    const pendingSnapshot = [...anexosPendentes];
    const baseAnexosPersistidos = normalizeAnexosList(formData.anexos);
    try {
      const payload = montarPayload(modo);
      if (mode === 'edit' && recordId) {
        await chargebackAPI.update(recordId, payload);
        const proto = editProtocolo ? String(editProtocolo) : '';
        toast.success(proto ? `Registro atualizado (${proto})` : 'Registro atualizado');
        setAnexosPendentes([]);
        void processarUploadPendentes(recordId, pendingSnapshot, baseAnexosPersistidos);
        onSaved?.();
        return;
      }
      const res = await chargebackAPI.create(payload);
      const doc = res?.data;
      const newId =
        doc && doc._id != null
          ? String(doc._id)
          : doc && doc.id != null
            ? String(doc.id)
            : null;
      const proto =
        doc?.numeroProtocolo != null
          ? String(doc.numeroProtocolo).trim()
          : doc?.protocolo != null
            ? String(doc.protocolo).trim()
            : '';
      toast.success(proto ? `Registro salvo (${proto})` : 'Registro salvo');
      setFormData(initialForm());
      setProtocoloPrevisaoTick((t) => t + 1);
      setAnexosPendentes([]);
      if (newId && pendingSnapshot.length > 0) {
        void processarUploadPendentes(newId, pendingSnapshot, baseAnexosPersistidos);
      } else {
        pendingSnapshot.forEach((p) => {
          try {
            URL.revokeObjectURL(p.previewUrl);
          } catch {
            /* ignore */
          }
        });
      }
      onSaved?.();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Erro ao salvar chargeback');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'edit' && hydratingEdit) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-600 dark:text-gray-400">
        Carregando…
      </div>
    );
  }

  if (mode === 'edit' && editLoadError) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        role="alert"
      >
        {editLoadError}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${embedded ? 'mb-0' : 'mb-8'}`}>
        {/* Protocolo — mesmo padrão de FormReclamacao / FormReclamacaoEdit */}
        <div className="mb-4 grid w-full grid-cols-1 gap-2 px-[3px] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-x-3">
          <div className="flex h-12 min-h-12 w-fit max-w-full shrink-0 flex-nowrap items-center gap-2 justify-self-start rounded-vh-card border border-gray-300/80 bg-[#E8EEF5]/90 px-3 dark:border-gray-600 dark:bg-[#323a42]">
            <span className="whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-300">
              Protocolo
            </span>
            <span
              className="velohub-title min-w-0 whitespace-nowrap text-sm font-semibold tabular-nums text-[#006AB9] dark:text-[#93c5fd]"
              title={
                mode === 'create' ? 'Prévia; o número definitivo é atribuído ao gravar' : undefined
              }
              aria-live={mode === 'create' ? 'polite' : undefined}
            >
              {mode === 'edit'
                ? String(editProtocolo || '').trim() || '—'
                : protocoloPrevisaoCarregando
                  ? '…'
                  : protocoloPrevisao || '—'}
            </span>
          </div>
          <div className="hidden min-h-[2.75rem] min-w-0 justify-center justify-self-center md:flex" aria-hidden="true" />
          <div className="hidden min-h-[2.75rem] min-w-0 md:block justify-self-end" aria-hidden="true" />
        </div>
        {/* Linha 1 (md+): CPF | Consultar | Retorno | Nome */}
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,11rem)_auto_minmax(0,1fr)_minmax(0,3fr)] md:items-end md:gap-x-4">
          <FloatingLabelField
            id={`${fid}-cpf`}
            label="CPF"
            required
            value={formData.cpf}
            className="min-w-0"
          >
            <input
              id={`${fid}-cpf`}
              type="text"
              size={16}
              value={formData.cpf}
              onChange={(e) => setFormData((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }))}
              className={`box-border max-w-full min-h-12 rounded-lg border px-3 text-sm outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white ${
                validarCPF(formData.cpf)
                  ? 'border-2 border-green-500'
                  : 'border border-gray-400 dark:border-gray-500'
              } focus:ring-1 focus:ring-blue-500`}
              placeholder="000.000.000-00"
              maxLength={14}
              required
            />
          </FloatingLabelField>

          <div className="flex min-w-0 items-end justify-stretch md:justify-center">
            <button
              type="button"
              aria-label="Consultar reclamações por CPF"
              onClick={consultarPorCpf}
              disabled={buscando || !validarCPF(formData.cpf)}
              className="box-border flex h-12 min-h-12 w-full min-w-0 items-center justify-center whitespace-nowrap rounded-lg border border-[#006AB9] bg-transparent px-4 text-sm font-medium text-[#006AB9] transition-all duration-200 hover:bg-[#006AB9] hover:text-[#F3F7FC] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 md:w-auto"
            >
              {buscando ? 'Consultando...' : 'Consultar'}
            </button>
          </div>

          <FloatingLabelField
            id={`${fid}-retorno-busca`}
            label="Retorno da busca"
            value={formData.localizarAtendimentos}
            className="min-w-0"
          >
            <input
              type="text"
              readOnly
              title={formData.localizarAtendimentos || undefined}
              value={formData.localizarAtendimentos}
              className="h-12 min-h-12 box-border w-full cursor-default rounded-lg border border-gray-400 bg-gray-100 px-3 text-sm text-gray-700 outline-none dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200"
              placeholder="—"
            />
          </FloatingLabelField>

          <FloatingLabelField id={`${fid}-nome`} label="Nome do Cliente" required value={formData.nome} className="min-w-0">
            <input
              id={`${fid}-nome`}
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
              className="box-border min-h-12 w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              required
            />
          </FloatingLabelField>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end md:gap-x-4">
          <FloatingLabelField id={`${fid}-email`} label="E-mail" value={formData.email} className="min-w-0">
            <input
              id={`${fid}-email`}
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: formatarEmail(e.target.value) }))
              }
              className="box-border min-h-12 w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
            />
          </FloatingLabelField>

          <div className="flex min-w-0 items-end gap-2">
            <FloatingLabelField
              id={`${fid}-tel-0`}
              label="Telefone"
              value={formData.telefones.lista[0]}
              className="min-w-0 flex-1"
            >
              <input
                type="text"
                value={formData.telefones.lista[0]}
                onChange={(e) => atualizarTelefone(0, e.target.value)}
                className={`min-h-12 box-border w-full rounded-lg px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                  formData.telefones.lista[0] &&
                  String(formData.telefones.lista[0]).replace(/\D/g, '').length >= 10
                    ? 'border-2 border-green-500'
                    : 'border border-gray-400 dark:border-gray-500'
                }`}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </FloatingLabelField>
            {formData.telefones.lista.length > 1 ? (
              <button
                type="button"
                onClick={() => removerTelefone(0)}
                className="inline-flex h-12 min-h-12 shrink-0 items-center justify-center rounded border px-3 text-sm transition-all duration-300 dark:bg-gray-700"
                style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#dc2626';
                  e.target.style.color = '#F3F7FC';
                  e.target.style.borderColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#dc2626';
                  e.target.style.borderColor = '#dc2626';
                }}
              >
                Remover
              </button>
            ) : null}
          </div>

          <div className="flex items-end justify-stretch md:justify-end">
            <button
              type="button"
              onClick={adicionarTelefone}
              aria-label="Adicionar telefone"
              title="Adicionar telefone"
              className="box-border flex h-12 min-h-12 min-w-[3rem] items-center justify-center rounded-lg border text-lg font-semibold leading-none transition-all duration-200 dark:bg-gray-800"
              style={{
                borderColor: '#006AB9',
                color: '#006AB9',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#006AB9';
                e.target.style.color = '#F3F7FC';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#006AB9';
              }}
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-4 min-w-0">
          {formData.telefones.lista.slice(1).map((telefone, i) => {
            const index = i + 1;
            return (
              <div key={index} className="mb-2 flex gap-2">
                <FloatingLabelField
                  id={`${fid}-tel-${index}`}
                  label={`Telefone (${index + 1})`}
                  value={telefone}
                  className="min-w-0 flex-1"
                >
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => atualizarTelefone(index, e.target.value)}
                    className={`min-h-12 box-border w-full rounded-lg px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                      telefone && String(telefone).replace(/\D/g, '').length >= 10
                        ? 'border-2 border-green-500'
                        : 'border border-gray-400 dark:border-gray-500'
                    }`}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </FloatingLabelField>
                <button
                  type="button"
                  onClick={() => removerTelefone(index)}
                  className="inline-flex h-12 min-h-12 shrink-0 items-center justify-center rounded border px-3 text-sm transition-all duration-300 dark:bg-gray-700"
                  style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#dc2626';
                    e.target.style.color = '#F3F7FC';
                    e.target.style.borderColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#dc2626';
                    e.target.style.borderColor = '#dc2626';
                  }}
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <FloatingLabelField id={`${fid}-produto`} label="Produto" required value={formData.produto}>
            <select
              id={`${fid}-produto`}
              value={formData.produto}
              onChange={(e) => setFormData((prev) => ({ ...prev, produto: e.target.value }))}
              className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="">Selecione...</option>
              {OUVIDORIA_PRODUTO_OPCOES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FloatingLabelField>

          <FloatingLabelField id={`${fid}-data`} label="Data do chargeback" required value={formData.dataEntrada}>
            <input
              id={`${fid}-data`}
              type="date"
              value={formData.dataEntrada}
              onChange={(e) => setFormData((prev) => ({ ...prev, dataEntrada: e.target.value }))}
              className="box-border min-h-12 w-full rounded-lg border border-gray-400 px-3 text-sm outline-none dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              required
            />
          </FloatingLabelField>

          <FloatingLabelField id={`${fid}-valor`} label="Valor" value={formData.valorStr}>
            <input
              id={`${fid}-valor`}
              type="text"
              inputMode="decimal"
              value={formData.valorStr}
              onChange={(e) => setFormData((prev) => ({ ...prev, valorStr: e.target.value }))}
              className="box-border min-h-12 w-full rounded-lg border border-gray-400 px-3 text-sm outline-none dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              placeholder="0,00"
            />
          </FloatingLabelField>
        </div>

        <FloatingLabelField id={`${fid}-desc`} label="Descrição" required value={formData.descricao}>
          <textarea
            id={`${fid}-desc`}
            value={formData.descricao}
            onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
            rows={4}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            required
          />
        </FloatingLabelField>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Chamados relacionados (protocolos Central)
          </label>
          {formData.protocolosCentral.map((protocolo, index) => (
            <div key={index} className="flex flex-wrap gap-2 mb-2 items-end">
              <input
                type="text"
                value={protocolo}
                onChange={(e) => atualizarProtocoloCentral(index, e.target.value)}
                size={Math.min(Math.max(String(protocolo || '').length + 4, 14), 42)}
                title={protocolo ? String(protocolo) : undefined}
                className="min-h-12 box-border w-auto max-w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                placeholder="Protocolo"
              />
              {formData.protocolosCentral.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removerProtocoloCentral(index)}
                  className="inline-flex h-12 min-h-12 shrink-0 items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                  style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                >
                  Remover
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={adicionarProtocoloCentral}
            className="inline-flex h-12 min-h-12 items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
            style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
          >
            + Protocolo
          </button>
        </div>

        <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300 mb-4">
          <input
            type="checkbox"
            checked={formData.revertido === true}
            onChange={(e) => setFormData((prev) => ({ ...prev, revertido: e.target.checked }))}
            className="w-5 h-5"
          />
          <span>Revertido</span>
        </label>

        <div className="mb-4">
          <span className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Anexos</span>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => anexoInputRef.current?.click()}
              className="box-border inline-flex h-12 min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-[#006AB9] bg-transparent px-4 text-sm font-medium text-[#006AB9] transition-all duration-200 hover:bg-[#006AB9] hover:text-[#F3F7FC] dark:bg-gray-800"
            >
              Escolher arquivos
            </button>
            <input
              ref={anexoInputRef}
              type="file"
              onChange={onAnexosSelecionados}
              className="sr-only"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
              aria-label={`Selecionar arquivos para anexar ao chargeback (${fid})`}
            />
          </div>
          {anexosPendentes.length + (formData.anexos?.length || 0) > 0 ? (
            <div className="mt-2">
              <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                Anexos ({anexosPendentes.length + (formData.anexos?.length || 0)})
                {anexosPendentes.length > 0 ? (
                  <span className="text-gray-500"> — upload após salvar</span>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {anexosPendentes.map((p, i) => (
                  <ChargebackAnexoSlot
                    key={p.id}
                    anexoUxContext={mode}
                    kind={kindFromFileName(p.file.name)}
                    url={p.previewUrl}
                    index={i}
                    onOpen={() => openViewerAt(i)}
                    onRemove={() => {
                      removerAnexoPendente(p.id);
                      setAnexoMenuId(null);
                    }}
                    menuOpen={anexoMenuId === `p-${p.id}`}
                    onMenuToggle={() =>
                      setAnexoMenuId((cur) => (cur === `p-${p.id}` ? null : `p-${p.id}`))
                    }
                  />
                ))}
                {(formData.anexos || []).map((item, j) => {
                  const url = typeof item === 'string' ? item : item?.url;
                  if (!url) return null;
                  const globalIdx = anexosPendentes.length + j;
                  const u = String(url);
                  return (
                    <ChargebackAnexoSlot
                      key={`sv-${j}-${u}`}
                      anexoUxContext={mode}
                      kind={kindFromUrl(u)}
                      url={u}
                      index={globalIdx}
                      onOpen={() => openViewerAt(globalIdx)}
                      onRemove={() => {
                        removerAnexoSalvo(j);
                        setAnexoMenuId(null);
                      }}
                      menuOpen={anexoMenuId === `s-${j}`}
                      onMenuToggle={() =>
                        setAnexoMenuId((cur) => (cur === `s-${j}` ? null : `s-${j}`))
                      }
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <ChargebackAnexoViewerModal
          open={viewerOpen && viewerStrip.length > 0}
          onClose={() => setViewerOpen(false)}
          items={viewerStrip}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
        />

        <div className="relative flex justify-end pt-2" ref={dropdownRef}>
          <button
            type="button"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{
              borderColor: '#006AB9',
              color: '#006AB9',
              background: 'transparent',
            }}
            onMouseEnter={(ev) => {
              if (!loading) {
                ev.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                ev.target.style.color = '#F3F7FC';
                ev.target.style.borderColor = '#006AB9';
              }
            }}
            onMouseLeave={(ev) => {
              if (!loading) {
                ev.target.style.background = 'transparent';
                ev.target.style.color = '#006AB9';
                ev.target.style.borderColor = '#006AB9';
              }
            }}
            onClick={(ev) => handleSubmit(ev)}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Salvando...
              </>
            ) : (
              <>
                {mode === 'edit' ? 'Salvar tratamento' : 'Salvar ocorrência'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>

          {showSaveOptions && !loading ? (
            <div
              className="absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 z-50"
              style={{ border: '1px solid #1634FF' }}
            >
              <div className="py-1" role="menu">
                <button
                  type="button"
                  onClick={(ev) => handleSubmit(ev, 'em-andamento')}
                  className="flex min-h-12 w-full items-center px-4 text-left text-sm font-medium transition-colors"
                  style={{
                    color: '#F3F7FC',
                    backgroundColor: 'rgba(0, 106, 185, 0.7)',
                  }}
                  role="menuitem"
                >
                  Em andamento
                </button>
                <button
                  type="button"
                  onClick={(ev) => handleSubmit(ev, 'resolvido')}
                  className="flex min-h-12 w-full items-center px-4 text-left text-sm font-medium transition-colors"
                  style={{
                    color: '#F3F7FC',
                    backgroundColor: 'rgba(21, 162, 55, 0.7)',
                  }}
                  role="menuitem"
                >
                  Resolvido
                </button>
              </div>
            </div>
          ) : null}
        </div>
    </form>
  );
}
