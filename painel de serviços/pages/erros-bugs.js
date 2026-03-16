// pages/erros-bugs.js
// VERSION: v2.0.0 | DATE: 2026-03-13 | AUTHOR: VeloHub Development Team
// Anexos: upload via signed URL GCS (mediabank_velohub/anexos_produto)
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function ErrosBugs() {
  const [agente, setAgente] = useState('');
  const [cpf, setCpf] = useState('');
  const [tipo, setTipo] = useState('App');
  const [descricao, setDescricao] = useState('');
  const [imagens, setImagens] = useState([]); // [{ nome, imagemUrl }]
  const [videos, setVideos] = useState([]);   // [{ nome, videoUrl }]
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [localLogs, setLocalLogs] = useState([]);
  const [searchCpf, setSearchCpf] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('velotax_local_logs_bugs');
      if (cached) setLocalLogs(JSON.parse(cached));
    } catch {}
  }, []);
  const saveCache = (items) => {
    setLocalLogs(items);
    try { localStorage.setItem('velotax_local_logs_bugs', JSON.stringify(items)); } catch {}
  };

  // Upload para GCS via signed URL
  const uploadToGcs = async (file, tipoAnexo) => {
    const res = await fetch('/api/anexos-produto/get-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || (tipoAnexo === 'imagem' ? 'image/jpeg' : 'video/mp4'),
        tipo: tipoAnexo
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao obter URL de upload');
    const putRes = await fetch(data.signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || (tipoAnexo === 'imagem' ? 'image/jpeg' : 'video/mp4') }
    });
    if (!putRes.ok) throw new Error('Falha no upload para o servidor');
    return tipoAnexo === 'imagem'
      ? { nome: file.name, imagemUrl: data.publicUrl }
      : { nome: file.name, videoUrl: data.publicUrl };
  };

  // Função para abrir modal de anexos
  const openAttachmentsModal = (request) => {
    setSelectedRequest(request);
    setShowAttachmentsModal(true);
  };

  // Função para fechar modal
  const closeAttachmentsModal = () => {
    setSelectedRequest(null);
    setShowAttachmentsModal(false);
  };

  const buscarCpf = async () => {
    const digits = String(searchCpf || "").replace(/\D/g, "");
    if (!digits) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) return;
      const list = await res.json();
      const filtered = Array.isArray(list)
        ? list.filter((r) => String(r?.cpf || '').replace(/\D/g, '').includes(digits))
        : [];
      setSearchResults(filtered);
    } catch {}
    setSearchLoading(false);
  };

  const refreshNow = async () => {
    if (!localLogs.length) return;
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) return;
      const all = await res.json();
      const updated = localLogs.map(item => {
        const match = item.waMessageId
          ? all.find(r => r.waMessageId === item.waMessageId)
          : all.find(r => r.cpf === item.cpf && String(r.tipo||'').startsWith('Erro/Bug'));
        return match ? { ...item, status: match.status } : item;
      });
      saveCache(updated);
    } catch {}
  };
  useEffect(() => {
    const tick = async () => { await refreshNow(); };
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [localLogs.length]);

  const montarLegenda = () => {
    let m = `*Novo Erro/Bug - ${tipo}*\n\n`;
    m += `Agente: ${agente}\n`;
    if (cpf) m += `CPF: ${cpf}\n`;
    m += `\nDescrição:\n${descricao || '—'}\n`;
    if (imagens?.length || videos?.length) {
      const totalAnexos = (imagens?.length || 0) + (videos?.length || 0);
      const tipos = [];
      if (imagens?.length) tipos.push(`${imagens.length} imagem(ns)`);
      if (videos?.length) tipos.push(`${videos.length} vídeo(s)`);
      m += `\n[Anexos: ${totalAnexos} - ${tipos.join(', ')}]\n`;
    }
    return m;
  };

  const enviar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agente,
          cpf,
          tipo: `Erro/Bug - ${tipo}`,
          payload: { 
            agente, 
            cpf, 
            tipo, 
            descricao, 
            imagens: imagens?.map(({ nome, imagemUrl }) => ({ nome, imagemUrl })) || [],
            videos: videos?.map(({ nome, videoUrl }) => ({ nome, videoUrl })) || []
          },
          agentContact: null,
          waMessageId: null
        })
      });

      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_request', detail: { tipo: `Erro/Bug - ${tipo}`, cpf, waMessageId: null, whatsappSent: false } })
      });

      // add to local logs cache
      const newItem = {
        cpf,
        tipo: `Erro/Bug - ${tipo}`,
        waMessageId: null,
        status: 'em aberto',
        createdAt: new Date().toISOString()
      };
      saveCache([newItem, ...localLogs].slice(0, 50));

      setMsg('Registrado no painel com sucesso.');
      setAgente(''); setCpf(''); setDescricao(''); setImagens([]); setVideos([]);
    } catch (err) {
      setMsg('Falha ao enviar/registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Velotax • Erros/Bugs</title>
      </Head>

      <div className="min-h-screen container-pad py-10">
        <div className="max-w-3xl mx-auto animate-fadeUp">
          <div className="mb-6 surface p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/brand/velotax-symbol.png" alt="Velotax" className="h-10 md:h-12 w-auto" />
              <div>
                <h1 className="titulo-principal mb-1">Erros / Bugs</h1>
                <p className="text-white/80">Reporte problemas com anexos de imagem para o time</p>
              </div>

        {loading && (
          <div className="loading-overlay backdrop-blur-sm transition-opacity duration-200" style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.20), rgba(2,6,23,0.35))' }}>
            <div className="loading-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <img src="/brand/loading.gif" alt="Carregando" style={{ width: 72, height: 72, objectFit: 'contain' }} />
              <div className="mt-2 text-white/90 text-sm">Enviando solicitação…</div>
            </div>
          </div>
        )}
            </div>
            <a href="/" className="px-3 py-2 rounded bg-black/10 hover:bg-black/20 text-sm">← Voltar para a Home</a>
          </div>

          <div className="mb-6 bg-white/80 backdrop-blur p-4 rounded-xl border border-black/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
              <h2 className="text-lg font-semibold">Consulta de CPF</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:items-end" aria-busy={searchLoading} aria-live="polite">
              <div className="flex-1">
                <label className="text-sm text-black/80">CPF</label>
                <input className="input" placeholder="Digite o CPF" value={searchCpf} onChange={(e) => setSearchCpf(e.target.value)} />
              </div>
              <button type="button" onClick={buscarCpf} className="btn-primary px-3 py-2 inline-flex items-center gap-2 transition-all duration-200" disabled={searchLoading}>
                {searchLoading ? (<><img src="/brand/loading.gif" alt="Carregando" style={{ width: 16, height: 16 }} /> Buscando...</>) : 'Buscar'}
              </button>
            </div>
            {searchCpf && (
              <div className="text-sm text-black/60 mt-2">{searchResults.length} registro(s) encontrado(s)</div>
            )}
            {searchLoading && (
              <div className="space-y-2 mt-3 max-h-64">
                {[...Array(4)].map((_,i) => (
                  <div key={i} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between animate-pulse">
                    <div>
                      <div className="h-4 w-40 bg-black/10 rounded mb-1" />
                      <div className="h-3 w-32 bg-black/10 rounded" />
                    </div>
                    <div className="h-3 w-24 bg-black/10 rounded" />
                  </div>
                ))}
              </div>
            )}
            {searchResults && searchResults.length > 0 && !searchLoading && (
              <div className="space-y-2 mt-3 max-h-64 overflow-auto">
                {searchResults.slice(0,8).map((r) => {
                  const imgCount = Array.isArray(r?.payload?.imagens) ? r.payload.imagens.length : 0;
                  const videoCount = Array.isArray(r?.payload?.videos) ? r.payload.videos.length : 0;
                  const total = imgCount + videoCount;
                  return (
                    <div key={r.id} className="p-3 bg-white rounded border border-black/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <span>{r.tipo} — {r.cpf}</span>
                            {total > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 text-xs">
                                Anexos: {imgCount > 0 ? `${imgCount} img` : ''}{imgCount > 0 && videoCount > 0 ? ' + ' : ''}{videoCount > 0 ? `${videoCount} vid` : ''}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-black/60">Agente: {r.agente || '—'} • Status: {r.status || '—'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-black/60">{new Date(r.createdAt).toLocaleString()}</div>
                          {total > 0 && (
                            <button
                              type="button"
                              onClick={() => openAttachmentsModal(r)}
                              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            >
                              Ver anexos
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={enviar} className="card p-6 space-y-5" aria-busy={loading} aria-live="polite">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-black/80">Agente</label>
                <input className="input" value={agente} onChange={(e) => setAgente(e.target.value)} required placeholder="Nome do agente" />
              </div>
              <div>
                <label className="text-sm text-black/80">CPF (opcional)</label>
                <input className="input" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>

            <div>
              <label className="text-sm text-black/80">Tipo</label>
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option>App</option>
                <option>Crédito Pessoal</option>
                <option>Crédito do Trabalhador</option>
                <option>Antecipação</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-black/80">Descrição</label>
              <textarea
                className="input h-32"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Explique o problema, passos para reproduzir, telas envolvidas...\n(Dica: você pode colar imagens aqui)"
                onPaste={async (e) => {
                  const items = Array.from(e.clipboardData?.items || []);
                  const imgs = items.filter(it => it.type && it.type.startsWith('image/'));
                  if (!imgs.length) return;
                  e.preventDefault();
                  setUploading(true);
                  try {
                    for (const it of imgs) {
                      const file = it.getAsFile();
                      if (!file) continue;
                      const item = await uploadToGcs(file, 'imagem');
                      setImagens(prev => [...prev, item]);
                    }
                  } catch (err) {
                    setMsg('Erro ao enviar imagem da área de transferência: ' + (err.message || ''));
                  }
                  setUploading(false);
                }}
              />
            </div>

            <div>
              <label className="text-sm text-black/80">Anexos (imagens e vídeos)</label>
              <div className="mt-1 p-4 border-2 border-dashed rounded-lg text-center bg-white hover:bg-black/5">
                <div className="mb-2 text-black/70">Arraste e solte aqui, clique para selecionar ou cole imagens no campo de descrição</div>
                <div className="mb-2 text-xs text-black/60">Aceitamos imagens (JPG, PNG, GIF) e vídeos (MP4, WebM, MOV) - Máx 50MB por arquivo</div>
                <div className="flex gap-2 justify-center">
                  <label className={`inline-block px-3 py-2 rounded bg-sky-600 text-white cursor-pointer hover:bg-sky-700 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {uploading ? 'Enviando...' : 'Selecionar imagens'}
                    <input type="file" accept="image/*" multiple disabled={uploading} onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      e.target.value = '';
                      if (!files.length) return;
                      setUploading(true);
                      try {
                        for (const f of files) {
                          const item = await uploadToGcs(f, 'imagem');
                          setImagens(prev => [...prev, item]);
                        }
                      } catch (err) {
                        setMsg('Erro ao enviar imagem: ' + (err.message || ''));
                      }
                      setUploading(false);
                    }} className="hidden" />
                  </label>
                  <label className={`inline-block px-3 py-2 rounded bg-purple-600 text-white cursor-pointer hover:bg-purple-700 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {uploading ? 'Enviando...' : 'Selecionar vídeos'}
                    <input type="file" accept="video/*" multiple disabled={uploading} onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      e.target.value = '';
                      if (!files.length) return;
                      setUploading(true);
                      try {
                        for (const f of files) {
                          if (f.size > 50 * 1024 * 1024) {
                            setMsg(`O vídeo "${f.name}" é muito grande. Máximo: 50MB`);
                            continue;
                          }
                          const item = await uploadToGcs(f, 'video');
                          setVideos(prev => [...prev, item]);
                        }
                      } catch (err) {
                        setMsg('Erro ao enviar vídeo: ' + (err.message || ''));
                      }
                      setUploading(false);
                    }} className="hidden" />
                  </label>
                </div>
              </div>
              {(imagens?.length > 0 || videos?.length > 0) && (
                <>
                  <div className="text-xs text-black/60 mt-2">
                    {imagens?.length || 0} imagem(ns) e {videos?.length || 0} vídeo(s) anexado(s)
                  </div>
                  {imagens?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-black/70 mb-1">Imagens:</div>
                      <div className="flex gap-2 flex-wrap">
                        {imagens.map((im, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={im.imagemUrl} 
                              alt={im.nome} 
                              className="h-16 w-auto rounded border object-cover" 
                            />
                            <button
                              type="button"
                              onClick={() => setImagens(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {videos?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-black/70 mb-1">Vídeos:</div>
                      <div className="flex gap-2 flex-wrap">
                        {videos.map((vid, idx) => (
                          <div key={idx} className="relative group">
                            <div className="relative">
                              <video src={vid.videoUrl} className="h-16 w-auto rounded border object-cover" preload="metadata" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded pointer-events-none">
                                <span className="text-white text-xs">▶</span>
                              </div>
                            </div>
                            <div className="text-xs text-black/60 mt-1 max-w-32 truncate">{vid.nome}</div>
                            <button
                              type="button"
                              onClick={() => setVideos(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button type="submit" disabled={loading} className={`btn-primary inline-flex items-center gap-2 transition-all duration-200 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {loading ? (<><img src="/brand/loading.gif" alt="Carregando" style={{ width: 16, height: 16 }} /> Enviando...</>) : 'Enviar'}
              </button>
              {msg && <span className="text-sm text-black/70">{msg}</span>}
            </div>
          </form>

          {/* Logs de Envio */}
          <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-black/10 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
              <h2 className="text-lg font-semibold">Logs de Envio</h2>
              <button type="button" onClick={refreshNow} className="ml-auto text-sm px-2 py-1 rounded bg-black/5 hover:bg-black/10">Atualizar agora</button>
            </div>
            <div className="max-h-72 overflow-auto pr-1">
            {(!localLogs || localLogs.length === 0) && (
              <div className="text-black/60">Nenhum log ainda.</div>
            )}
            <div className="space-y-2">
              {localLogs.map((l, idx) => {
                const icon = l.status === 'feito' ? '✅' : (l.status === 'não feito' ? '❌' : '⏳');
                return (
                  <div key={idx} className="p-3 bg-white rounded border border-black/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{icon}</span>
                        <span className="text-sm">{l.cpf || '—'} — {l.tipo}</span>
                      </div>
                      <div className="text-xs text-black/60">{new Date(l.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {(() => {
                        const s = String(l.status || '').toLowerCase();
                        const step = s === 'feito' ? 3 : (s === 'não feito' ? 2 : 1);
                        const Dot = (i) => (
                          <span key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-black/15 dark:bg-white/20'}`}></span>
                        );
                        return (
                          <div className="flex items-center gap-1.5" aria-label={`progresso: ${s || 'em aberto'}`}>
                            {Dot(1)}{Dot(2)}{Dot(3)}
                            <span className="text-[11px] opacity-60 ml-2">{s || 'em aberto'}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Anexos */}
      {showAttachmentsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="p-4 border-b border-black/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Anexos - {selectedRequest.tipo}</h3>
              <button
                type="button"
                onClick={closeAttachmentsModal}
                className="text-black/60 hover:text-black text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-4">
                {/* Informações básicas */}
                <div className="bg-black/5 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div><strong>CPF:</strong> {selectedRequest.cpf || '—'}</div>
                    <div><strong>Agente:</strong> {selectedRequest.agente || '—'}</div>
                    <div><strong>Status:</strong> {selectedRequest.status || '—'}</div>
                    <div><strong>Descrição:</strong> {selectedRequest.payload?.descricao || '—'}</div>
                  </div>
                </div>

                {/* Imagens */}
                {(() => {
                  const imgs = selectedRequest.payload?.imagens || [];
                  if (imgs.length === 0) return null;
                  return (
                    <div>
                      <h4 className="font-medium mb-2">Imagens ({imgs.length})</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {imgs.map((im, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={im.imagemUrl}
                              alt={im.nome}
                              className="w-full h-32 object-cover rounded-lg border"
                              onClick={() => window.open(im.imagemUrl, '_blank')}
                              style={{ cursor: 'pointer' }}
                            />
                            <button
                              type="button"
                              onClick={() => window.open(im.imagemUrl, '_blank')}
                              className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Abrir
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Vídeos */}
                {(() => {
                  const vids = selectedRequest.payload?.videos || [];
                  if (vids.length === 0) return null;
                  return (
                    <div>
                      <h4 className="font-medium mb-2">Vídeos ({vids.length})</h4>
                      <div className="space-y-2">
                        {vids.map((vid, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-black/5 rounded-lg">
                            <video
                              src={vid.videoUrl}
                              controls
                              className="w-40 h-24 object-cover rounded border"
                              preload="metadata"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{vid.nome}</div>
                              <a
                                href={vid.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-sky-600 hover:underline"
                              >
                                Abrir em nova aba
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Mensagem se não houver anexos */}
                {(!selectedRequest.payload?.imagens?.length && !selectedRequest.payload?.videos?.length) && (
                  <div className="text-center text-black/60 py-8">
                    Nenhum anexo disponível para esta solicitação.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
