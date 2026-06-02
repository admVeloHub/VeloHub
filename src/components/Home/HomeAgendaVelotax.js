/**
 * VeloHub V3 — Container 6: Agenda Velotax (compromissos MongoDB)
 * VERSION: v1.4.0 | DATE: 2026-06-01 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.4.0: Fonte hub_agenda via homeAgendaAPI (Google Calendar desabilitado temporariamente na Home)
 * - v1.3.0: Eventos da agenda configurada no Console (e-mail definido pelo responsável)
 */

import React, { useCallback, useEffect, useState } from 'react';
import HomeSidebarWidget from './HomeSidebarWidget';
import { homeAgendaAPI } from '../../services/api';

const EVENTOS_LIMITE = 4;

function formatarDataEvento(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';

  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  const mesmaData = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const hora = iso.includes('T')
    ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'Dia inteiro';

  if (mesmaData(data, hoje)) return `Hoje · ${hora}`;
  if (mesmaData(data, amanha)) return `Amanhã · ${hora}`;

  const dataCurta = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${dataCurta} · ${hora}`;
}

const HomeAgendaVelotax = ({ className = '' }) => {
  const [carregando, setCarregando] = useState(true);
  const [eventos, setEventos] = useState([]);
  const [mensagem, setMensagem] = useState('');

  const carregarAgenda = useCallback(async () => {
    setCarregando(true);
    setMensagem('');

    try {
      const resposta = await homeAgendaAPI.getEventos(EVENTOS_LIMITE);
      const lista = resposta?.data || [];
      setEventos(lista);

      if (lista.length === 0) {
        setMensagem('Nenhum compromisso futuro cadastrado.');
      }
    } catch (error) {
      setEventos([]);
      setMensagem(error?.message || 'Não foi possível carregar a agenda.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarAgenda();
  }, [carregarAgenda]);

  return (
    <HomeSidebarWidget
      className={className}
      titleFile="agenda.png"
      titleAlt="Agenda Velotax"
    >
      <div className="home-agenda">
        {carregando ? (
          <p className="home-agenda__message">Carregando agenda…</p>
        ) : null}

        {!carregando && mensagem ? (
          <p className="home-agenda__message">{mensagem}</p>
        ) : null}

        {!carregando && eventos.length > 0 ? (
          <div className="home-agenda-cards">
            {eventos.map((evento) => {
              const CardTag = evento.url ? 'a' : 'div';
              const cardProps =
                CardTag === 'a'
                  ? {
                      href: evento.url,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    }
                  : {};

              return (
                <CardTag
                  key={evento.id || `${evento.titulo}-${evento.inicio}`}
                  className="home-agenda-card"
                  {...cardProps}
                >
                  <span className="home-agenda-card__date">{formatarDataEvento(evento.inicio)}</span>
                  <span className="home-agenda-card__title">{evento.titulo}</span>
                </CardTag>
              );
            })}
          </div>
        ) : null}
      </div>
    </HomeSidebarWidget>
  );
};

export default HomeAgendaVelotax;
