/**
 * VeloHub V3 — Modal Solicitar Liberação (Ouvidoria → Req_Prod liberacao_pix_prod)
 * VERSION: v1.1.5 | DATE: 2026-05-18 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.1.5: `agente`/POST usa `getVelotaxAgentForLoggedUser()` — não reutiliza `velotax_agent` de outro userMail após troca de login
 * - v1.0.2: POST `agente`: prioriza nome da sessão (`velohub_user_session` → `velotax_agent`) igual à página Req_Prod — `colaboradorNome` no Mongo casa com `getByColaborador` sem expor filas de outros
 * - v1.0.1: Após sucesso: dispara `velohub:liberacao-pix-solicitada` (detail.id) para RequisicoesPage atualizar GET sem depender da aba montada
 */

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { solicitacoesAPI } from '../../services/requisicoesApi';
import { getVelotaxAgentForLoggedUser } from '../../services/auth';
import {
  LIBERACAO_PIX_BOOLEAN_ROWS,
  getLiberacaoChavePixBooleanKeyOcultoPorOrigem,
  getLiberacaoChavePixEffectiveBooleans,
} from '../../utils/liberacaoChavePixRules';
import toast from 'react-hot-toast';

/** Mesma fonte escopada ao userMail que Req_Prod (`auth.getVelotaxAgentForLoggedUser`). */
function readAgenteAlinhadoSessao(propAgente) {
  const fromProp = String(propAgente || '').trim();
  const synced = String(getVelotaxAgentForLoggedUser() || '').trim();
  if (synced) return synced;
  return fromProp;
}

const emptyChecks = () => ({
  semDebitoAberto: false,
  n2Ouvidora: false,
  procon: false,
  reclameAqui: false,
  processo: false,
  bacen: false,
  revogadoConsentimentoEcac: false,
});

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.origem — rótulo Req_Prod (ex. Bacen, N2 Pix)
 * @param {string} props.nomeCliente
 * @param {string} props.cpf — com ou sem máscara
 * @param {string} props.agente — colaborador (POST agente)
 * @param {string} props.tipoOuvidoriaApi — BACEN | OUVIDORIA | RECLAME_AQUI | PROCON (para FK)
 * @param {string|null|undefined} props.reclamacaoId — _id Mongo quando edição
 * @param {string} [props.ouvidoriaNumeroProtocolo] — número em exibição no formulário Ouvidoria
 * @param {(res: object) => void} [props.onSuccess]
 */
export default function ModalSolicitarLiberacaoPix({
  open,
  onClose,
  origem,
  nomeCliente,
  cpf,
  agente,
  tipoOuvidoriaApi,
  reclamacaoId,
  ouvidoriaNumeroProtocolo,
  onSuccess,
}) {
  const [checks, setChecks] = useState(emptyChecks);
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setChecks(emptyChecks());
    setObservacoes('');
  }, [open, origem]);

  const setCheck = useCallback((key, value) => {
    setChecks((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const digits = String(cpf || '').replace(/\D/g, '');
    if (digits.length !== 11) {
      toast.error('CPF inválido. Informe 11 dígitos.');
      return;
    }
    const nome = String(nomeCliente || '').trim();
    if (!nome) {
      toast.error('Informe o nome do cliente.');
      return;
    }
    const o = String(origem || '').trim();
    if (!o) {
      toast.error('Origem da liberação não definida para este tipo de ocorrência.');
      return;
    }

    const formLike = { origem: o, ...checks, observacoes };
    const pixEff = getLiberacaoChavePixEffectiveBooleans(formLike);
    if (
      !pixEff.semDebitoAberto &&
      !pixEff.n2Ouvidora &&
      !pixEff.procon &&
      !pixEff.reclameAqui &&
      !pixEff.processo &&
      !pixEff.bacen &&
      !pixEff.revogadoConsentimentoEcac
    ) {
      toast.error(
        'Marque pelo menos uma opção entre as condições exibidas (ou confira a origem: ela já pode cobrir N2, Procon, Reclame Aqui, Processo ou Bacen).'
      );
      return;
    }

    const ag = readAgenteAlinhadoSessao(agente);
    if (!ag) {
      toast.error('Colaborador não identificado. Faça login novamente ou preencha o responsável.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        origem: o,
        nomeCliente: nome,
        observacoes: String(observacoes || '').trim(),
        semDebitoAberto: pixEff.semDebitoAberto,
        n2Ouvidora: pixEff.n2Ouvidora,
        procon: pixEff.procon,
        reclameAqui: pixEff.reclameAqui,
        processo: pixEff.processo,
        bacen: pixEff.bacen,
        revogadoConsentimentoEcac: pixEff.revogadoConsentimentoEcac,
      };
      if (reclamacaoId && String(reclamacaoId).trim() && tipoOuvidoriaApi) {
        payload.ouvidoriaReclamacaoId = String(reclamacaoId).trim();
        payload.ouvidoriaReclamacaoTipo = String(tipoOuvidoriaApi).trim();
      }
      const proto = String(ouvidoriaNumeroProtocolo || '').trim();
      if (proto) {
        payload.ouvidoriaNumeroProtocolo = proto;
      }

      const res = await solicitacoesAPI.create({
        agente: ag,
        cpf: digits,
        tipo: 'Exclusão de Chave PIX',
        payload,
      });

      if (res?.warning) {
        toast(res.warning, { duration: 6000 });
      } else {
        toast.success('Solicitação de liberação registrada no Req_Prod.');
      }
      onSuccess?.(res);
      try {
        const id =
          res?.data?._id != null
            ? String(res.data._id)
            : res?.data?.id != null
              ? String(res.data.id)
              : '';
        if (typeof window !== 'undefined' && id) {
          window.dispatchEvent(
            new CustomEvent('velohub:liberacao-pix-solicitada', { detail: { id } })
          );
        }
      } catch {
        /* ignore */
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Erro ao enviar solicitação de liberação.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  const ocultoKey = getLiberacaoChavePixBooleanKeyOcultoPorOrigem(origem);
  const rows = LIBERACAO_PIX_BOOLEAN_ROWS.filter(({ key }) => key !== ocultoKey);

  return createPortal(
    <div
      className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={() => !submitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-solicitar-liberacao-titulo"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-vh-container border p-6 shadow-xl"
        style={{
          backgroundColor: 'var(--cor-container)',
          borderColor: 'var(--cor-borda)',
        }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2 id="modal-solicitar-liberacao-titulo" className="velohub-title mb-2 text-xl font-semibold">
          Solicitar liberação chave PIX
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Origem: <strong>{origem || '—'}</strong>. Os dados serão enviados ao Req_Prod (Liberação chave pix).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
              Condições
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {rows.map(({ key, label }) => (
                <label key={key} className="flex min-h-[1.75rem] items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0"
                    checked={checks[key] === true}
                    onChange={(e) => setCheck(key, e.target.checked)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={submitting}
              className="inline-flex h-12 min-h-12 items-center justify-center rounded-lg border border-gray-400 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 min-h-12 items-center justify-center rounded-lg border-2 px-4 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#006AB9', borderColor: '#006AB9' }}
            >
              {submitting ? 'Enviando…' : 'Enviar solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
