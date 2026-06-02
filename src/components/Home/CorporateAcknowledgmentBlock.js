/**
 * VeloHub V3 — Bloco de ciência corporativa (Políticas, LGPD, Termos)
 * VERSION: v1.2.0 | DATE: 2026-05-29 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.2.0: ackKey e className opcionais (ciência por acordeão)
 * - v1.1.0: Tipo etica-conduta (Código de Ética e Conduta)
 */

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { corporateAPI } from '../../services/api';
import { getUserSession } from '../../services/auth';

const CHECKBOX_LABELS = {
  'etica-conduta':
    'Declaro que li e estou ciente do Código de Ética e Conduta do Velotax.',
  'politicas-normas':
    'Declaro que li e estou ciente do Código de Ética e Conduta do Velotax.',
  lgpd: 'Declaro que li e estou ciente da política de privacidade e proteção de dados (LGPD) do Velotax.',
  'termo-usuario': 'Declaro que li e estou ciente dos Termos de Uso do VeloHub.',
};

const ACK_METHODS = {
  'etica-conduta': corporateAPI.acknowledgeEticaConduta,
  'politicas-normas': corporateAPI.acknowledgeEticaConduta,
  lgpd: corporateAPI.acknowledgeLgpd,
  'termo-usuario': corporateAPI.acknowledgeTermoUsuario,
};

const CorporateAcknowledgmentBlock = ({
  type,
  versaoId,
  ackKey,
  className = '',
  onAcknowledged,
}) => {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const checkboxLabel = CHECKBOX_LABELS[type] || CHECKBOX_LABELS['etica-conduta'];
  const acknowledgeFn = ACK_METHODS[type];
  const inputId = `corporate-ack-${ackKey || type}`;

  const handleConfirm = async () => {
    if (!checked || !versaoId || submitting) return;

    const session = getUserSession();
    const email = session?.user?.email;
    const name = session?.user?.name || session?.user?.nome || 'Usuário';

    if (!email) {
      toast.error('Sessão inválida. Faça login novamente.');
      return;
    }

    setSubmitting(true);
    try {
      await acknowledgeFn(versaoId, email, name);
      toast.success('Ciência registrada com sucesso.');
      setChecked(false);
      if (typeof onAcknowledged === 'function') {
        onAcknowledged();
      }
    } catch (error) {
      if (error?.status === 409) {
        toast.success('Ciência já registrada para esta versão.');
        if (typeof onAcknowledged === 'function') {
          onAcknowledged();
        }
      } else {
        toast.error(error?.message || 'Erro ao registrar ciência.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const rootClassName = ['container-secondary', 'home-corporate-ack', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName}>
      <div className="home-corporate-ack__row">
        <input
          id={inputId}
          type="checkbox"
          className="home-corporate-ack__checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          disabled={submitting}
        />
        <label htmlFor={inputId} className="home-corporate-ack__label">
          {checkboxLabel}
        </label>
        <button
          type="button"
          className="velohub-btn home-corporate-ack__confirm"
          disabled={!checked || submitting}
          onClick={handleConfirm}
        >
          {submitting ? 'Confirmando…' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
};

export default CorporateAcknowledgmentBlock;
