/**
 * VeloHub V3 — Hero: Denúncias
 * VERSION: v1.2.1 | DATE: 2026-05-27 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.2.1: Sem título de página (hidePageTitle)
 * - v1.2.0: Modal de sucesso/falha após envio; OK em sucesso volta à Home
 * - v1.1.0: Formulário canal denúncias + envio via POST /api/portal/denuncias
 */

import React, { useCallback, useState } from 'react';
import HomeHeroPageShell from './HomeHeroPageShell';
import HomeDenunciasResultModal from '../../components/Home/HomeDenunciasResultModal';
import { denunciasAPI } from '../../services/api';
import {
  DENUNCIAS_CLOSING,
  DENUNCIAS_DISCLAIMER_PARAGRAPHS,
  DENUNCIAS_INTRO_PARAGRAPHS,
  DENUNCIAS_INTRO_TITLE,
  DENUNCIAS_MAX_MENSAGEM,
  DENUNCIAS_MENSAGEM_LABEL,
  DENUNCIAS_MODO_LABEL,
  DENUNCIAS_MODO_OPTIONS,
  DENUNCIAS_SITUACOES,
} from './denunciasContent';

const HeroDenunciasPage = ({ setActivePage }) => {
  const [modoComunicacao, setModoComunicacao] = useState('anonimo');
  const [mensagem, setMensagem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  const canSubmit = mensagem.trim().length > 0 && !submitting;

  const handleModalPrimary = useCallback(() => {
    if (resultModal?.type === 'success') {
      setActivePage('Home');
    }
    setResultModal(null);
  }, [resultModal, setActivePage]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!canSubmit) return;

      setSubmitting(true);
      setResultModal(null);

      try {
        await denunciasAPI.submit({ modoComunicacao, mensagem: mensagem.trim() });
        setResultModal({
          type: 'success',
          message: 'Manifestação enviada com sucesso.',
        });
        setMensagem('');
        setModoComunicacao('anonimo');
      } catch (err) {
        setResultModal({
          type: 'error',
          message: err?.message || 'Não foi possível enviar a manifestação. Tente novamente.',
        });
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, modoComunicacao, mensagem]
  );

  return (
    <HomeHeroPageShell hidePageTitle setActivePage={setActivePage}>
      <section className="home-hero-content__section home-denuncias-form">
        <h2 className="home-hero-content__section-title">{DENUNCIAS_INTRO_TITLE}</h2>

        <div className="home-denuncias-form__intro">
          {DENUNCIAS_INTRO_PARAGRAPHS.map((p) => (
            <p key={p.slice(0, 32)} className="home-denuncias-form__text">
              {p}
            </p>
          ))}
          <ul className="home-denuncias-form__list">
            {DENUNCIAS_SITUACOES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {DENUNCIAS_DISCLAIMER_PARAGRAPHS.map((p) => (
            <p key={p.slice(0, 32)} className="home-denuncias-form__text">
              {p}
            </p>
          ))}
          <p className="home-denuncias-form__text home-denuncias-form__closing">{DENUNCIAS_CLOSING}</p>
        </div>

        <form className="home-denuncias-form__fields" onSubmit={handleSubmit}>
          <fieldset className="home-denuncias-form__fieldset">
            <legend className="home-denuncias-form__legend">{DENUNCIAS_MODO_LABEL}</legend>
            <div className="home-denuncias-form__radios">
              {DENUNCIAS_MODO_OPTIONS.map((opt) => (
                <label key={opt.value} className="home-denuncias-form__radio-label">
                  <input
                    type="radio"
                    name="modoComunicacao"
                    value={opt.value}
                    checked={modoComunicacao === opt.value}
                    onChange={() => setModoComunicacao(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="home-denuncias-form__field">
            <span className="home-denuncias-form__label">{DENUNCIAS_MENSAGEM_LABEL}</span>
            <textarea
              className="home-denuncias-form__textarea"
              value={mensagem}
              onChange={(ev) => setMensagem(ev.target.value.slice(0, DENUNCIAS_MAX_MENSAGEM))}
              rows={8}
              required
            />
          </label>

          <button type="submit" className="home-denuncias-form__submit" disabled={!canSubmit}>
            {submitting ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </section>

      <HomeDenunciasResultModal
        open={resultModal != null}
        type={resultModal?.type}
        message={resultModal?.message}
        onPrimary={handleModalPrimary}
      />
    </HomeHeroPageShell>
  );
};

export default HeroDenunciasPage;
