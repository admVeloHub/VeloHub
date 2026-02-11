// components/FormSolicitacao.jsx
// VERSION: v2.0.0 | DATE: 2025-02-10 | AUTHOR: VeloHub Development Team
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { toTitleCase, normStatus, normCpf } from "@/lib/utils";
import { fetchWithTimeout } from "@/lib/fetchUtils";
import { getApiUrl } from "@/lib/apiConfig";

export default function FormSolicitacao({ registrarLog }) {
  const [form, setForm] = useState({
    agente: "",
    cpf: "",
    tipo: "Alteração de Dados Cadastrais",
    infoTipo: "",
    dadoAntigo: "",
    dadoNovo: "",
    fotosVerificadas: false,
    excluirVelotax: false,
    excluirCelcoin: false,
    saldoZerado: false,
    portabilidadePendente: false,
    dividaIrpfQuitada: false,
    semDebitoAberto: false,
    n2Ouvidora: false,
    procon: false,
    reclameAqui: false,
    processo: false,
    nomeCliente: "",
    dataContratacao: "",
    valor: "",
    observacoes: "",
  });
  const [loading, setLoading] = useState(false);
  const [cpfError, setCpfError] = useState('');
  const [localLogs, setLocalLogs] = useState([]); // {cpf, tipo, waMessageId, status, createdAt}
  const [buscaCpf, setBuscaCpf] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [buscaResultados, setBuscaResultados] = useState([]);
  const [expandedBuscaKeys, setExpandedBuscaKeys] = useState(new Set());
  const [expandedLogKeys, setExpandedLogKeys] = useState(new Set());

  // Utilidades de normalização importadas de @/lib/utils

  // carregar cache inicial
  useEffect(() => {
    try {
      const cached = localStorage.getItem('velotax_local_logs');
      if (cached) setLocalLogs(JSON.parse(cached));
      const agent = localStorage.getItem('velotax_agent');
      if (agent) setForm((prev) => ({ ...prev, agente: toTitleCase(agent) }));
    } catch {}
  }, []);

  // util: salvar cache
  const saveCache = (items) => {
    setLocalLogs(items);
    try { localStorage.setItem('velotax_local_logs', JSON.stringify(items)); } catch {}
  };

  const buscarCpf = async () => {
    const digits = normCpf(buscaCpf);
    if (!digits) {
      setBuscaResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const res = await fetchWithTimeout('/api/requests', {}, 15000);
      if (!res.ok) return;
      const list = await res.json();
      const filtered = Array.isArray(list)
        ? list.filter((r) => normCpf(r?.cpf || '').includes(digits))
        : [];
      setBuscaResultados(filtered);
    } catch (error) {
      console.error('[FormSolicitacao buscarCpf] Erro:', error);
      if (error.name === 'AbortError') {
        toast.error('Busca demorou muito. Tente novamente.');
      }
    }
    setBuscando(false);
  };

  // função para buscar status atualizados agora
  const refreshNow = async () => {
    if (!localLogs.length) return;
    try {
      const res = await fetchWithTimeout('/api/requests', {}, 15000);
      if (!res.ok) return;
      const all = await res.json();
      const updated = localLogs.map(item => {
        const match = item.waMessageId
          ? all.find(r => r.waMessageId === item.waMessageId)
          : all.find(r => r.cpf === item.cpf && r.tipo === item.tipo);
        if (match) {
          // Atualizar status, replies e id
          return {
            ...item,
            id: match.id,
            status: match.status,
            replies: Array.isArray(match.replies) ? match.replies : (item.replies || [])
          };
        }
        return item;
      });
      saveCache(updated);
    } catch (error) {
      console.error('[FormSolicitacao refreshNow] Erro:', error);
      // Silencioso - não mostrar toast para atualizações automáticas
    }
  };

  // Função para confirmar visualização de resposta
  const confirmarResposta = async (requestId, replyMessageId, confirmedBy = null) => {
    try {
      const res = await fetchWithTimeout('/api/requests/reply-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, replyMessageId, confirmedBy })
      }, 15000);

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao confirmar resposta');
      }

      toast.success('Resposta confirmada com sucesso');
      
      // Recarregar logs locais após confirmação
      await refreshNow();
      
      return { ok: true, confirmedAt: data.confirmedAt };
    } catch (error) {
      console.error('[FormSolicitacao confirmarResposta] Erro:', error);
      if (error.name === 'AbortError') {
        toast.error('Confirmação demorou muito. Tente novamente.');
      } else {
        toast.error(error.message || 'Erro ao confirmar resposta');
      }
      throw error;
    }
  };

  // refresh de status a cada 20s buscando no servidor
  useEffect(() => {
    const refresh = async () => {
      if (!localLogs.length) return;
      try {
        const res = await fetchWithTimeout('/api/requests', {}, 15000);
        if (!res.ok) return;
        const all = await res.json();
        const updated = localLogs.map(item => {
          // preferir match por waMessageId; fallback por cpf+tipo
          const match = item.waMessageId
            ? all.find(r => r.waMessageId === item.waMessageId)
            : all.find(r => r.cpf === item.cpf && r.tipo === item.tipo);
          if (match) {
            // Atualizar status, replies e id
            return {
              ...item,
              id: match.id,
              status: match.status,
              replies: Array.isArray(match.replies) ? match.replies : (item.replies || [])
            };
          }
          return item;
        });
        saveCache(updated);
      } catch (error) {
        console.error('[FormSolicitacao refresh] Erro:', error);
        // Silencioso - não mostrar toast para atualizações automáticas
      }
    };
    refresh();
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, [localLogs.length]);

  const atualizar = (campo, valor) => {
    setForm(prev => {
      const novo = { ...prev, [campo]: valor };
      if (campo === 'tipo') {
        console.log('[FormSolicitacao] Tipo alterado para:', valor);
      }
      return novo;
    });
    if (campo === 'cpf') {
      setCpfError('');
    }
    if (campo === 'agente') {
      const norm = toTitleCase(valor);
      try { localStorage.setItem('velotax_agent', norm); } catch {}
    }
  };

  const montarMensagem = () => {
    const simNao = v => (v ? "✅ Sim" : "❌ Não");
    const typeMap = {
      "Exclusão de Conta": "Exclusão de Conta",
      "Exclusão de Chave PIX": "Exclusão de Chave PIX",
      "Alteração de Dados Cadastrais": "Alteração de Dados Cadastrais",
      "Reativação de Conta": "Reativação de Conta",
      "Reset de Senha": "Reset de Senha",
      "Cancelamento": "Cancelamento",
      "Aumento de Limite Pix": "Aumento de Limite Pix",
    };
    const tipoCanon = typeMap[form.tipo] || toTitleCase(String(form.tipo || ''));
    const cpfNorm = String(form.cpf || '').replace(/\D/g, '');
    let msg = `*Nova Solicitação Técnica - ${tipoCanon}*\n\n`;
    msg += `Agente: ${form.agente}\nCPF: ${cpfNorm}\n\n`;

    if (form.tipo === "Exclusão de Conta") {
      msg += `Excluir conta Velotax: ${simNao(form.excluirVelotax)}\n`;
      msg += `Excluir conta Celcoin: ${simNao(form.excluirCelcoin)}\n`;
      msg += `Conta zerada: ${simNao(form.saldoZerado)}\n`;
      msg += `Portabilidade pendente: ${simNao(form.portabilidadePendente)}\n`;
      msg += `Dívida IRPF quitada: ${simNao(form.dividaIrpfQuitada)}\n`;
      msg += `Observações: ${form.observacoes || "—"}\n`;
    } else if (form.tipo === "Alteração de Dados Cadastrais") {
      msg += `Tipo de informação: ${form.infoTipo}\nDado antigo: ${form.dadoAntigo}\nDado novo: ${form.dadoNovo}\nFotos verificadas: ${simNao(form.fotosVerificadas)}\nObservações: ${form.observacoes || "—"}\n`;
    } else if (form.tipo === "Exclusão de Chave PIX") {
      msg += `Sem Débito em aberto: ${simNao(form.semDebitoAberto)}\n`;
      msg += `N2 - Ouvidora: ${simNao(form.n2Ouvidora)}\n`;
      msg += `Procon: ${simNao(form.procon)}\n`;
      msg += `Reclame Aqui: ${simNao(form.reclameAqui)}\n`;
      msg += `Processo: ${simNao(form.processo)}\n`;
      msg += `Observações: ${form.observacoes || "—"}\n`;
    } else if (form.tipo === "Cancelamento") {
      msg += `Nome do Cliente: ${form.nomeCliente || "—"}\n`;
      msg += `Data da Contratação: ${form.dataContratacao || "—"}\n`;
      msg += `Valor: ${form.valor || "—"}\n`;
      msg += `Observações: ${form.observacoes || "—"}\n`;
    } else if (form.tipo === "Aumento de Limite Pix") {
      msg += `Valor: ${form.valor || "—"}\n`;
      msg += `Observações: ${form.observacoes || "—"}\n`;
    } else {
      msg += `Observações: ${form.observacoes || "—"}\n`;
    }
    return msg;
  };

  const enviar = async (e) => {
    e.preventDefault();
    const digits = normCpf(form.cpf);
    if (digits.length !== 11) {
      setCpfError('CPF inválido. Digite os 11 dígitos.');
      toast.error('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    if (form.tipo === "Exclusão de Chave PIX" && !form.semDebitoAberto && !form.n2Ouvidora && !form.procon && !form.reclameAqui && !form.processo) {
      toast.error('Para Exclusão de Chave PIX, selecione pelo menos uma opção: Sem Débito em aberto, N2 - Ouvidora, Procon, Reclame Aqui ou Processo.');
      return;
    }
    setLoading(true);
    registrarLog("Iniciando envio...");

    const notifyError = (title, body) => {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(title, { body });
          } else {
            // tenta pedir permissão uma única vez
            Notification.requestPermission().then((p) => {
              if (p === 'granted') new Notification(title, { body });
            }).catch(()=>{});
          }
        }
      } catch {}
    };

    // garantir nome do agente normalizado e em cache
    let agenteNorm = form.agente && form.agente.trim() ? toTitleCase(form.agente) : '';
    if (!agenteNorm) {
      try { agenteNorm = toTitleCase(localStorage.getItem('velotax_agent') || ''); } catch {}
      if (agenteNorm) setForm((prev) => ({ ...prev, agente: agenteNorm }));
    }
    if (agenteNorm) {
      try { localStorage.setItem('velotax_agent', agenteNorm); } catch {}
    }

    const mensagemTexto = montarMensagem();

    const apiUrl = getApiUrl();
    const defaultJid = process.env.NEXT_PUBLIC_DEFAULT_JID;
    const payload = { jid: defaultJid, mensagem: mensagemTexto, cpf: form.cpf, solicitacao: form.tipo, agente: agenteNorm || form.agente };

    try {
      // 1) Tentar enviar via WhatsApp se configurado (timeout 20s)
      let res = { ok: false };
      let waMessageId = null;
      let whatsappTimeout = false;
      
      if (apiUrl && defaultJid) {
        try {
          res = await fetchWithTimeout(`${apiUrl}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }, 20000);

          // 2) Extrair waMessageId quando houver resposta OK
          if (res && res.ok) {
            try {
              const data = await res.json();
              waMessageId = data?.messageId || data?.key?.id || null;
            } catch {}
          }
        } catch (whatsappError) {
          console.error('[FormSolicitacao] Erro ao enviar WhatsApp:', whatsappError);
          if (whatsappError.name === 'AbortError') {
            whatsappTimeout = true;
            registrarLog("⏱️ Envio para o grupo demorou; solicitação será registrada no painel");
            toast.info("Envio para o grupo demorou; solicitação será registrada no painel");
          } else {
            const errorText = whatsappError.message || String(whatsappError);
            // Detectar WhatsApp desconectado
            if (/WhatsApp desconectado|desconectado/i.test(errorText)) {
              registrarLog("⚠️ WhatsApp está reconectando. Aguarde alguns segundos e tente enviar novamente.");
              toast.error("WhatsApp está reconectando. Aguarde alguns segundos e tente enviar novamente.");
            } else {
              registrarLog("❌ Erro da API WhatsApp: " + errorText);
              toast.error("Erro ao enviar para WhatsApp: " + errorText);
            }
          }
        }
      }

      // 3) Persistir SEMPRE a solicitação e o log (mesmo se WhatsApp falhar)
      try {
        await fetchWithTimeout('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agente: agenteNorm || form.agente,
            cpf: form.cpf,
            tipo: form.tipo,
            payload: { ...form },
            agentContact: defaultJid || null,
            waMessageId,
          })
        }, 15000);
      } catch (persistError) {
        console.error('[FormSolicitacao] Erro ao persistir solicitação:', persistError);
        if (persistError.name === 'AbortError') {
          toast.error('Persistência demorou muito. Tente novamente.');
        } else {
          toast.error('Erro ao salvar solicitação: ' + persistError.message);
        }
        throw persistError; // Re-throw para não continuar se persistência falhar
      }

      try {
        await fetchWithTimeout('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_request',
            detail: {
              tipo: form.tipo,
              cpf: form.cpf,
              waMessageId,
              whatsappSent: !!(apiUrl && defaultJid && res && res.ok),
              exclusao:
                form.tipo === 'Exclusão de Conta'
                  ? {
                      excluirVelotax: !!form.excluirVelotax,
                      excluirCelcoin: !!form.excluirCelcoin,
                      saldoZerado: !!form.saldoZerado,
                      portabilidadePendente: !!form.portabilidadePendente,
                      dividaIrpfQuitada: !!form.dividaIrpfQuitada,
                    }
                  : undefined,
            alteracao:
              form.tipo === 'Alteração de Dados Cadastrais'
                ? {
                    infoTipo: form.infoTipo || '',
                    dadoAntigo: form.dadoAntigo || '',
                    dadoNovo: form.dadoNovo || '',
                    fotosVerificadas: !!form.fotosVerificadas,
                  }
                : undefined,
            observacoes: form.observacoes || '',
          },
        }),
      }, 10000);
      } catch (logError) {
        console.error('[FormSolicitacao] Erro ao salvar log:', logError);
        // Não bloquear se log falhar
      }

      // 4) Atualizar UI/Cache
      if (!apiUrl || !defaultJid) {
        registrarLog("ℹ️ WhatsApp não configurado: apenas registrado no painel");
        toast.success("Solicitação registrada");
      } else if (whatsappTimeout) {
        // Já mostrou mensagem acima
      } else if (res && res.ok) {
        registrarLog("✅ Enviado com sucesso");
        toast.success("Solicitação enviada");
      } else if (res && !res.ok) {
        const txt = await res.text().catch(() => 'Erro desconhecido');
        registrarLog("❌ Erro da API: " + txt);
        toast.error("Erro ao enviar: " + txt);
        notifyError('Falha ao enviar solicitação', txt || 'Erro desconhecido da API');
      }

      const wasSentOK = !!(apiUrl && defaultJid && res && res.ok);
      // Buscar o id da solicitação recém-criada
      let newItemId = null;
      try {
        const resCheck = await fetchWithTimeout('/api/requests', {}, 5000);
        if (resCheck && resCheck.ok) {
          const all = await resCheck.json();
          const found = waMessageId
            ? all.find(r => r.waMessageId === waMessageId)
            : all.find(r => r.cpf === form.cpf && r.tipo === form.tipo && new Date(r.createdAt).getTime() > Date.now() - 10000);
          if (found) newItemId = found.id;
        }
      } catch {}
      const newItem = {
        cpf: form.cpf,
        tipo: form.tipo,
        waMessageId,
        id: newItemId,
        status: wasSentOK ? 'enviado' : 'em aberto',
        enviado: wasSentOK,
        createdAt: new Date().toISOString(),
      };
      saveCache([newItem, ...localLogs].slice(0, 50));
    } catch (err) {
      console.error('[FormSolicitacao enviar] Erro:', err);
      registrarLog("❌ Falha de conexão com a API.");
      const errorMsg = err.message || 'Não foi possível contactar a API';
      toast.error("Falha de conexão: " + errorMsg);
      notifyError('Falha de conexão', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={enviar} onKeyDown={(e)=>{ if(e.key==='Enter' && e.shiftKey){ e.preventDefault(); enviar(e); } }} className="space-y-5 relative" aria-busy={loading} aria-live="polite">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-black/80">CPF</label>
          <div className="input-wrap">
            <span className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V5Zm0 4h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Zm4 3v2h6v-2H7Z" fill="currentColor"/></svg>
            </span>
            <input className="input input-with-icon" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => atualizar("cpf", e.target.value)} required />
          </div>
          {cpfError && (
            <div className="mt-1 text-xs text-red-600">{cpfError}</div>
          )}
          <div className="mt-2">
            <button type="button" onClick={() => { setBuscaCpf(form.cpf); (async () => { await buscarCpf(); })(); }} className="text-sm px-2 py-1 rounded bg-black/5 hover:bg-black/10">
              Consultar histórico deste CPF
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm text-black/80">Tipo de Solicitação</label>
        <div className="input-wrap">
          <span className="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5H7z" fill="currentColor"/></svg>
          </span>
          <select className="input input-with-icon" value={form.tipo} onChange={(e) => atualizar("tipo", e.target.value)}>
          <option>Alteração de Dados Cadastrais</option>
          <option>Aumento de Limite Pix</option>
          <option>Exclusão de Chave PIX</option>
          <option>Exclusão de Conta</option>
          <option>Reativação de Conta</option>
          <option>Reset de Senha</option>
          <option>Cancelamento</option>
          </select>
        </div>
      </div>

      {form.tipo === "Exclusão de Conta" && (
        <div className="bg-white p-4 rounded-lg mt-2 border border-black/10">
          <label className="flex items-center gap-2"><input className="check-anim" type="checkbox" checked={form.excluirVelotax} onChange={(e) => atualizar("excluirVelotax", e.target.checked)} /> Excluir conta Velotax</label>
          <label className="flex items-center gap-2 mt-2"><input className="check-anim" type="checkbox" checked={form.excluirCelcoin} onChange={(e) => atualizar("excluirCelcoin", e.target.checked)} /> Excluir conta Celcoin</label>
          <label className="flex items-center gap-2 mt-2"><input className="check-anim" type="checkbox" checked={form.saldoZerado} onChange={(e) => atualizar("saldoZerado", e.target.checked)} /> Conta zerada</label>
          <label className="flex items-center gap-2 mt-2"><input className="check-anim" type="checkbox" checked={form.portabilidadePendente} onChange={(e) => atualizar("portabilidadePendente", e.target.checked)} /> Portabilidade pendente</label>
          <label className="flex items-center gap-2 mt-2"><input className="check-anim" type="checkbox" checked={form.dividaIrpfQuitada} onChange={(e) => atualizar("dividaIrpfQuitada", e.target.checked)} /> Dívida IRPF quitada</label>
        </div>
      )}

      {form.tipo === "Alteração de Dados Cadastrais" && (
        <div className="bg-white p-4 rounded-lg mt-2 border border-black/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-black/80">Tipo de informação</label>
              <select className="input" value={form.infoTipo} onChange={(e) => atualizar("infoTipo", e.target.value)}>
                <option value="Telefone">Telefone</option>
                <option value="E-mail">E-mail</option>
                <option value="Nome">Nome</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="flex items-center pt-7 gap-2">
              <input type="checkbox" className="w-4 h-4" checked={form.fotosVerificadas} onChange={(e) => atualizar("fotosVerificadas", e.target.checked)} />
              <label className="mb-0 text-black/80">Fotos verificadas</label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm text-black/80">Dado antigo</label>
              <input className="input" value={form.dadoAntigo} onChange={(e) => atualizar("dadoAntigo", e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-black/80">Dado novo</label>
              <input className="input" value={form.dadoNovo} onChange={(e) => atualizar("dadoNovo", e.target.value)} />
            </div>
          </div>

          {/* Anexos removidos nesta tela */}
        </div>
      )}

      {form.tipo === "Exclusão de Chave PIX" && (
        <div className="bg-white p-4 rounded-lg mt-2 border border-black/10" data-debug="exclusao-chave-pix">
          <p className="text-sm text-black/70 mb-3">* Selecione pelo menos uma opção:</p>
          <label className="flex items-center gap-2">
            <input className="check-anim" type="checkbox" checked={form.semDebitoAberto} onChange={(e) => atualizar("semDebitoAberto", e.target.checked)} />
            <span>Sem Débito em aberto</span>
          </label>
          <label className="flex items-center gap-2 mt-2">
            <input className="check-anim" type="checkbox" checked={form.n2Ouvidora} onChange={(e) => atualizar("n2Ouvidora", e.target.checked)} />
            <span>N2 - Ouvidora</span>
          </label>
          <label className="flex items-center gap-2 mt-2">
            <input className="check-anim" type="checkbox" checked={form.procon} onChange={(e) => atualizar("procon", e.target.checked)} />
            <span>Procon</span>
          </label>
          <label className="flex items-center gap-2 mt-2">
            <input className="check-anim" type="checkbox" checked={form.reclameAqui} onChange={(e) => atualizar("reclameAqui", e.target.checked)} />
            <span>Reclame Aqui</span>
          </label>
          <label className="flex items-center gap-2 mt-2">
            <input className="check-anim" type="checkbox" checked={form.processo} onChange={(e) => atualizar("processo", e.target.checked)} />
            <span>Processo</span>
          </label>
        </div>
      )}

      {form.tipo === "Aumento de Limite Pix" && (
        <div className="bg-white p-4 rounded-lg mt-2 border border-black/10" data-debug="aumento-limite-pix">
          <p className="text-sm text-black/70 mb-3">CPF preenchido no campo acima. Informe o valor desejado:</p>
          <div>
            <label className="text-sm text-black/80">Valor</label>
            <input className="input" type="text" placeholder="R$ 0,00" value={form.valor} onChange={(e) => atualizar("valor", e.target.value)} required />
          </div>
        </div>
      )}

      {form.tipo === "Cancelamento" && (
        <div className="bg-white p-4 rounded-lg mt-2 border border-black/10" data-debug="cancelamento">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-black/80">Nome do Cliente</label>
              <input className="input" type="text" placeholder="Nome completo do cliente" value={form.nomeCliente} onChange={(e) => atualizar("nomeCliente", e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-black/80">Data da Contratação</label>
              <input className="input" type="date" value={form.dataContratacao} onChange={(e) => atualizar("dataContratacao", e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-black/80">Valor</label>
              <input className="input" type="text" placeholder="R$ 0,00" value={form.valor} onChange={(e) => atualizar("valor", e.target.value)} required />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm text-black/80">Observações</label>
        <textarea className="input h-28" placeholder="Adicione observações adicionais..." value={form.observacoes} onChange={(e) => atualizar("observacoes", e.target.value)} />
      </div>

      <div className="flex items-center gap-4">
        <button disabled={loading} className={`btn-primary inline-flex items-center gap-2 transition-all duration-200 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`} type="submit">
          {loading && <img src="/brand/loading.gif" alt="Carregando" style={{ width: 18, height: 18 }} />}
          {loading ? "Enviando..." : "Enviar Solicitação"}
        </button>
        <span className="text-sm text-white/70">Envia para o grupo padrão configurado</span>
      </div>

      {buscaResultados && buscaResultados.length > 0 && (
        <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-black/10 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
            <h2 className="text-lg font-semibold">Histórico recente para {String(buscaCpf || form.cpf)}</h2>
          </div>
          <div className="space-y-2">
            {buscaResultados.slice(0,5).map((r) => {
              const repliesList = Array.isArray(r.replies) ? r.replies : [];
              const isExpanded = expandedBuscaKeys.has(r.id);
              const toggleBusca = (e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpandedBuscaKeys((prev) => {
                  const next = new Set(prev);
                  if (next.has(r.id)) next.delete(r.id);
                  else next.add(r.id);
                  return next;
                });
              };
              return (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={toggleBusca}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBusca(e); } }}
                  className="p-3 bg-white rounded border border-black/10 cursor-pointer hover:border-black/20 hover:bg-black/[0.02] transition-colors select-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <div>
                        <div className="font-medium">{r.tipo} — {r.cpf}</div>
                        <div className="text-xs text-black/60">Agente: {r.agente || '—'} • Status: {r.status || '—'}</div>
                      </div>
                      {repliesList.length > 0 && (
                        <span className="text-[11px] text-black/50 shrink-0">
                          {isExpanded ? '▼' : '▶'} {repliesList.length} resposta{repliesList.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-black/60 shrink-0">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  {isExpanded && repliesList.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-black/10">
                      <div className="text-[11px] font-medium text-black/70 mb-1.5">Menções / Respostas no grupo ({repliesList.length})</div>
                      <div className="space-y-1.5 max-h-48 overflow-auto">
                        {[...repliesList].reverse().map((rep, i) => (
                          <div key={i} className="text-[11px] text-black/70 bg-black/5 rounded px-2 py-1.5">
                            <div className="font-medium text-black/80">{rep.reactor || '—'}</div>
                            <div className="mt-0.5 text-black/80 whitespace-pre-wrap break-words">{(rep.text || '—').trim() || '—'}</div>
                            <div className="mt-1 flex items-center justify-between gap-2 flex-wrap">
                              {rep.at && <span className="opacity-60">{new Date(rep.at).toLocaleString('pt-BR')}</span>}
                              <span className="text-[10px]">
                                {rep.replyMessageId ? (
                                  rep.confirmedAt ? (
                                    <span className="text-emerald-600">✓ Confirmado{rep.confirmedBy ? ` por ${rep.confirmedBy}` : ''}</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        confirmarResposta(r.id, rep.replyMessageId, form.agente).then(() => {
                                          buscarCpf();
                                        }).catch(() => {});
                                      }}
                                      className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    >
                                      Confirmar visto (✓ no WhatsApp)
                                    </button>
                                  )
                                ) : (
                                  <span className="opacity-60">Check no WhatsApp disponível só para respostas novas</span>
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consulta de CPF (removida por solicitação) */}

      {/* Logs de Envio (para o agente acompanhar) */}
      <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-black/10 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
          <h2 className="text-lg font-semibold">Logs de Envio</h2>
          <button type="button" onClick={refreshNow} className="ml-auto text-sm px-2 py-1 rounded bg-black/5 hover:bg-black/10">Atualizar agora</button>
        </div>
        {(!localLogs || localLogs.length === 0) && (
          <div className="text-black/60">Nenhum log ainda.</div>
        )}
        <div className="space-y-2 max-h-56 overflow-auto pr-1">
          {localLogs.map((l, idx) => {
            const s = String(l.status || '').toLowerCase();
            // Mapeamento de barras:
            // - 'feito' => 3 verdes
            // - 'não feito' => 3 vermelhas
            // - 'enviado' (ou enviado==true) => 2 amarelas
            // - demais => 1 cinza
            const isDoneFail = (s === 'não feito' || s === 'nao feito');
            const isDoneOk = (s === 'feito');
            const sentOnly = (!isDoneOk && !isDoneFail) && (s === 'enviado' || l.enviado === true);
            const colorDone1 = isDoneFail ? 'bg-red-500' : 'bg-emerald-500';
            const colorDone2 = isDoneFail ? 'bg-red-500' : 'bg-emerald-500';
            const colorDone3 = isDoneFail ? 'bg-red-500' : 'bg-emerald-500';
            const bar1 = (isDoneOk || isDoneFail) ? colorDone1 : (sentOnly ? 'bg-amber-400' : 'bg-black/15 dark:bg-white/20');
            const bar2 = (isDoneOk || isDoneFail) ? colorDone2 : (sentOnly ? 'bg-amber-400' : 'bg-black/15 dark:bg-white/20');
            const bar3 = (isDoneOk || isDoneFail) ? colorDone3 : 'bg-black/15 dark:bg-white/20';
            const icon = isDoneOk ? '✅' : (isDoneFail ? '❌' : (sentOnly ? '📨' : '⏳'));
            const repliesList = Array.isArray(l.replies) ? l.replies : [];
            const logKey = l.waMessageId || `log-${idx}-${String(l.createdAt)}`;
            const isExpanded = expandedLogKeys.has(logKey);
            const toggleExpand = (e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpandedLogKeys((prev) => {
                const next = new Set(prev);
                if (next.has(logKey)) next.delete(logKey);
                else next.add(logKey);
                return next;
              });
            };
            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                onClick={toggleExpand}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(e); } }}
                className="p-3 bg-white rounded border border-black/10 cursor-pointer hover:border-black/20 hover:bg-black/[0.02] transition-colors select-none"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl shrink-0">{icon}</span>
                    <span className="text-sm truncate">{l.cpf} — {l.tipo}</span>
                    {repliesList.length > 0 && (
                      <span className="text-[11px] text-black/50 shrink-0">
                        {isExpanded ? '▼' : '▶'} {repliesList.length} resposta{repliesList.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-black/60 shrink-0">{new Date(l.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-2 flex items-center gap-1.5" aria-label={`progresso: ${s || 'em aberto'}`}>
                  <span className={`h-1.5 w-8 rounded-full ${bar1}`}></span>
                  <span className={`h-1.5 w-8 rounded-full ${bar2}`}></span>
                  <span className={`h-1.5 w-8 rounded-full ${bar3}`}></span>
                  <span className="text-[11px] opacity-60 ml-2">{s || 'em aberto'}</span>
                </div>
                {isExpanded && repliesList.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-black/10">
                    <div className="text-[11px] font-medium text-black/70 mb-1.5">Menções / Respostas no grupo ({repliesList.length})</div>
                    <div className="space-y-1.5 max-h-48 overflow-auto">
                      {[...repliesList].reverse().map((rep, i) => (
                        <div key={i} className="text-[11px] text-black/70 bg-black/5 rounded px-2 py-1.5">
                          <div className="font-medium text-black/80">{rep.reactor || '—'}</div>
                          <div className="mt-0.5 text-black/80 whitespace-pre-wrap break-words">{(rep.text || '—').trim() || '—'}</div>
                          <div className="mt-1 flex items-center justify-between gap-2 flex-wrap">
                            {rep.at && <span className="opacity-60">{new Date(rep.at).toLocaleString('pt-BR')}</span>}
                            <span className="text-[10px]">
                              {rep.replyMessageId && l.id ? (
                                rep.confirmedAt ? (
                                  <span className="text-emerald-600">✓ Confirmado{rep.confirmedBy ? ` por ${rep.confirmedBy}` : ''}</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmarResposta(l.id, rep.replyMessageId, form.agente).catch(() => {});
                                    }}
                                    className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  >
                                    Confirmar visto (✓ no WhatsApp)
                                  </button>
                                )
                              ) : (
                                <span className="opacity-60">Check no WhatsApp disponível só para respostas novas</span>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="loading-overlay backdrop-blur-sm transition-opacity duration-200" style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.20), rgba(2,6,23,0.35))' }}>
          <div className="loading-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <img src="/brand/loading.gif" alt="Carregando" style={{ width: 72, height: 72, objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </form>
  );
}


