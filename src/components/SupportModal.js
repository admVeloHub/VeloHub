/**
 * VeloHub V3 - Support Modal Component
 * VERSION: v1.6.0 | DATE: 2026-05-27 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.6.0: Modo fale_rh — ticket RH na Home (gênero fixo, sem seletor)
 * - v1.5.3: Seletor de gênero centralizado no topo do modal
 * - v1.5.2: Modal — largura +25% (52,5rem, antes max-w-2xl / 42rem)
 * - v1.5.1: Seletor de gênero — sem container-secondary
 * - v1.5.0: Cards agrupados — seletor de subgênero (container-secondary); Caixa de Sugestões (atalho Home)
 * - v1.4.3: Gestão: opção de direcionamento QA (_direcionamento "qa" → permissão gestaoQa no Console)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FloatingLabelField } from './shared/FloatingLabelField';
import {
    X, Send, FileText, Puzzle, User, BookOpen, Lightbulb,
} from 'lucide-react';
import { getUserSession } from '../services/auth';
import { API_BASE_URL } from '../config/api-config';

const CONTEUDO_TYPES = ['artigo', 'bot', 'treinamento', 'roteiro', 'funcionalidade', 'recurso'];
const GESTAO_TYPES = ['gestao', 'rh_financeiro', 'facilities'];

export const SUPPORT_CARD_GROUPS = [
    {
        id: 'conteudo',
        name: 'Conteúdo',
        title: 'Solicitar Conteúdo',
        description: 'Artigos, processos e treinamentos da central',
        subTypes: [
            { key: 'artigo', label: 'Artigo' },
            { key: 'bot', label: 'Processo' },
            { key: 'treinamento', label: 'Treinamento' },
        ],
    },
    {
        id: 'recursos_atendimento',
        name: 'Recursos de Atendimento',
        title: 'Solicitar Recursos de Atendimento',
        description: 'Funcionalidades, roteiros e recursos adicionais',
        subTypes: [
            { key: 'funcionalidade', label: 'Funcionalidade' },
            { key: 'roteiro', label: 'Roteiro' },
            { key: 'recurso', label: 'Recurso Adicional' },
        ],
    },
    {
        id: 'gestao',
        name: 'Gestão',
        title: 'Solicitar Gestão',
        description: 'RH, financeiro e facilities',
        subTypes: [
            { key: 'gestao', label: 'Gestão', visibleInSelector: false },
            { key: 'rh_financeiro', label: 'RH e Financeiro' },
            { key: 'facilities', label: 'Facilities' },
        ],
    },
];

const getDefaultSubType = (cardGroup) => {
    const group = SUPPORT_CARD_GROUPS.find((g) => g.id === cardGroup);
    if (!group) return null;
    const visible = group.subTypes.filter((st) => st.visibleInSelector !== false);
    return visible[0]?.key ?? group.subTypes[0]?.key ?? null;
};

const getVisibleSubTypes = (cardGroup) => {
    const group = SUPPORT_CARD_GROUPS.find((g) => g.id === cardGroup);
    if (!group) return [];
    return group.subTypes.filter((st) => st.visibleInSelector !== false);
};

const mapToTkConteudos = (type, formData, userEmail, userName) => {
    const generoMapping = {
        artigo: 'Artigo',
        bot: 'Processo',
        treinamento: 'Treinamento',
        roteiro: 'Roteiro',
        funcionalidade: 'Funcionalidade',
        recurso: 'Recurso Adicional',
    };

    const corpoArray = [{
        autor: 'user',
        userName: userName || 'Usuário',
        timestamp: new Date(),
        mensagem: formData.descricao || '',
    }];

    return {
        _genero: generoMapping[type],
        _tipo: formData.tipo,
        _assunto: formData.assunto,
        _corpo: corpoArray,
        _obs: formData.ocorrencia || '',
        _userEmail: userEmail,
        _statusHub: 'novo',
        _statusConsole: 'novo',
        _lastUpdatedBy: 'user',
        notification: false,
    };
};

const mapToTkGestao = (type, formData, userEmail, userName) => {
    const titleMapping = {
        gestao: 'Gestão',
        rh_financeiro: 'RH e Financeiro',
        facilities: 'Facilities',
    };

    const fieldMapping = {
        gestao: { _direcionamento: formData.direcionado },
        rh_financeiro: { _direcionamento: formData.setor },
        facilities: { _direcionamento: formData.categoria },
    };

    const corpoArray = [{
        autor: 'user',
        userName: userName || 'Usuário',
        timestamp: new Date(),
        mensagem: formData.mensagem || '',
    }];

    return {
        _genero: titleMapping[type],
        _tipo: formData.tipo,
        ...fieldMapping[type],
        _corpo: corpoArray,
        _userEmail: userEmail,
        notification: false,
    };
};

const mapToTkCaixaSugestoes = (formData, userEmail, userName) => {
    const corpoArray = [{
        autor: 'user',
        userName: userName || 'Usuário',
        timestamp: new Date(),
        mensagem: formData.mensagem || '',
    }];

    return {
        _genero: 'Gestão',
        _tipo: 'Caixa de Sugestões',
        _direcionamento: formData.direcionamento,
        _corpo: corpoArray,
        _userEmail: userEmail,
        notification: false,
    };
};

const CHIP_BASE =
    'h-12 min-h-12 box-border inline-flex items-center justify-center px-3 rounded-lg text-sm font-medium transition-all duration-200 border shrink-0';
const CHIP_SELECTED =
    'border-[#1694FF] bg-[#1694FF] text-[#FFFFFF] shadow-[0_4px_12px_rgba(22,148,255,0.4)] -translate-y-0.5';
const CHIP_UNSELECTED =
    'border-gray-300/60 bg-[#E8EEF5] text-[#272A30] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)] translate-y-px dark:border-gray-600 dark:bg-[#3d4650] dark:text-[#F3F7FC] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.35)]';

const SupportModal = ({ isOpen, onClose, cardGroup, mode = 'default', title }) => {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSubType, setActiveSubType] = useState(() => getDefaultSubType(cardGroup));

    const visibleSubTypes = useMemo(
        () => (cardGroup ? getVisibleSubTypes(cardGroup) : []),
        [cardGroup],
    );

    useEffect(() => {
        if (!isOpen) return;
        if (mode === 'fale_rh') {
            setFormData({ setor: 'rh' });
            setActiveSubType('rh_financeiro');
        } else {
            setFormData({});
            if (mode === 'caixa_sugestoes') {
                setActiveSubType(null);
            } else if (cardGroup) {
                setActiveSubType(getDefaultSubType(cardGroup));
            }
        }
    }, [isOpen, cardGroup, mode]);

    if (!isOpen) return null;

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubTypeChange = (key) => {
        setActiveSubType(key);
        setFormData({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const session = getUserSession();
            const userEmail = session?.user?.email;
            const userName = session?.user?.name;

            if (!userEmail) {
                alert('Erro: Usuário não autenticado');
                return;
            }

            let endpoint;
            let mappedData;

            if (mode === 'caixa_sugestoes') {
                endpoint = '/support/tk-gestao';
                mappedData = mapToTkCaixaSugestoes(formData, userEmail, userName);
            } else if (mode === 'fale_rh') {
                endpoint = '/support/tk-gestao';
                mappedData = mapToTkGestao('rh_financeiro', { ...formData, setor: 'rh' }, userEmail, userName);
            } else {
                const type = activeSubType;
                const isTkGestao = GESTAO_TYPES.includes(type);
                endpoint = isTkGestao ? '/support/tk-gestao' : '/support/tk-conteudos';
                mappedData = isTkGestao
                    ? mapToTkGestao(type, formData, userEmail, userName)
                    : mapToTkConteudos(type, formData, userEmail, userName);
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mappedData),
            });

            const result = await response.json();

            if (result.success) {
                alert(`Solicitação enviada com sucesso! Número do ticket: ${result.ticketId}`);
                onClose();
                setFormData({});
            } else {
                alert('Erro ao enviar solicitação: ' + (result.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            alert('Erro ao enviar solicitação. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIcon = () => {
        if (mode === 'caixa_sugestoes') return <Lightbulb size={24} />;
        if (mode === 'fale_rh') return <User size={24} />;
        switch (cardGroup) {
            case 'conteudo': return <BookOpen size={24} />;
            case 'recursos_atendimento': return <Puzzle size={24} />;
            case 'gestao': return <User size={24} />;
            default: return <FileText size={24} />;
        }
    };

    const renderSubTypeSelector = () => {
        if (mode === 'caixa_sugestoes' || mode === 'fale_rh' || !cardGroup || visibleSubTypes.length === 0) return null;

        return (
            <div className="w-full flex justify-center mb-4">
                <div
                    className="flex w-fit max-w-full flex-wrap justify-center gap-1.5"
                    role="radiogroup"
                    aria-label="Gênero"
                >
                    {visibleSubTypes.map((st) => {
                        const sel = activeSubType === st.key;
                        return (
                            <button
                                key={st.key}
                                type="button"
                                role="radio"
                                aria-checked={sel}
                                onClick={() => handleSubTypeChange(st.key)}
                                className={`${CHIP_BASE} ${sel ? CHIP_SELECTED : CHIP_UNSELECTED}`}
                            >
                                {st.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderConteudoForm = () => (
        <div className="space-y-4">
            <div>
                <FloatingLabelField
                    id={`sm-${activeSubType}-tipo`}
                    label="Tipo"
                    required
                    value={formData.tipo || ''}
                >
                    <select
                        required
                        className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                            backgroundColor: 'var(--cor-container)',
                            color: 'var(--cor-texto-principal)',
                            borderColor: 'var(--cor-borda)',
                        }}
                        value={formData.tipo || ''}
                        onChange={(e) => handleInputChange('tipo', e.target.value)}
                    >
                        <option value="">Selecione o tipo</option>
                        <option value="Solicitação">Solicitação</option>
                        <option value="Correção">Correção</option>
                        <option value="Remoção">Remoção</option>
                    </select>
                </FloatingLabelField>
            </div>
            <div>
                <FloatingLabelField id={`sm-${activeSubType}-assunto`} label="Assunto" required value={formData.assunto || ''}>
                    <input
                        type="text"
                        required
                        className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                            backgroundColor: 'var(--cor-container)',
                            color: 'var(--cor-texto-principal)',
                            borderColor: 'var(--cor-borda)',
                        }}
                        value={formData.assunto || ''}
                        onChange={(e) => handleInputChange('assunto', e.target.value)}
                        placeholder="Digite o assunto"
                    />
                </FloatingLabelField>
            </div>
            <div>
                <FloatingLabelField id={`sm-${activeSubType}-descricao`} label="Descrição" required value={formData.descricao || ''}>
                    <textarea
                        required
                        rows={4}
                        className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        style={{
                            backgroundColor: 'var(--cor-container)',
                            color: 'var(--cor-texto-principal)',
                            borderColor: 'var(--cor-borda)',
                        }}
                        value={formData.descricao || ''}
                        onChange={(e) => handleInputChange('descricao', e.target.value)}
                        placeholder="Descreva o conteúdo"
                    />
                </FloatingLabelField>
            </div>
            <div>
                <FloatingLabelField id={`sm-${activeSubType}-ocorrencia`} label="Ocorrência" value={formData.ocorrencia || ''}>
                    <textarea
                        rows={3}
                        className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        style={{
                            backgroundColor: 'var(--cor-container)',
                            color: 'var(--cor-texto-principal)',
                            borderColor: 'var(--cor-borda)',
                        }}
                        value={formData.ocorrencia || ''}
                        onChange={(e) => handleInputChange('ocorrencia', e.target.value)}
                        placeholder="Se houver, situação que exemplifica a necessidade"
                    />
                </FloatingLabelField>
            </div>
        </div>
    );

    const renderCaixaSugestoesForm = () => (
        <div className="space-y-4">
            <div>
                <FloatingLabelField id="sm-sugestoes-direcionamento" label="Direcionamento" required value={formData.direcionamento || ''}>
                    <select
                        required
                        className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                            backgroundColor: 'var(--cor-container)',
                            color: 'var(--cor-texto-principal)',
                            borderColor: 'var(--cor-borda)',
                        }}
                        value={formData.direcionamento || ''}
                        onChange={(e) => handleInputChange('direcionamento', e.target.value)}
                    >
                        <option value="">Selecione o direcionamento</option>
                        <option value="gestao">Gestão</option>
                        <option value="produtos">Produtos</option>
                        <option value="rh">RH</option>
                        <option value="facilities">Facilities</option>
                    </select>
                </FloatingLabelField>
            </div>
            <div>
                <FloatingLabelField id="sm-sugestoes-mensagem" label="Mensagem" required value={formData.mensagem || ''}>
                    <textarea
                        required
                        rows={6}
                        className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        style={{
                            backgroundColor: 'var(--cor-container)',
                            color: 'var(--cor-texto-principal)',
                            borderColor: 'var(--cor-borda)',
                        }}
                        value={formData.mensagem || ''}
                        onChange={(e) => handleInputChange('mensagem', e.target.value)}
                        placeholder="Digite sua sugestão"
                    />
                </FloatingLabelField>
            </div>
        </div>
    );

    const renderRhFinanceiroForm = ({ hideSetor = false } = {}) => (
        <div className="space-y-4">
            <div>
                <FloatingLabelField id="sm-rh-tipo" label="Tipo" required value={formData.tipo || ''}>
                    <select
                        required
                        className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                            backgroundColor: 'var(--cor-container)',
                            color: 'var(--cor-texto-principal)',
                            borderColor: 'var(--cor-borda)',
                        }}
                        value={formData.tipo || ''}
                        onChange={(e) => handleInputChange('tipo', e.target.value)}
                    >
                        <option value="">Selecione o tipo</option>
                        <option value="solicitacao">Solicitação</option>
                        <option value="agendamento">Agendamento</option>
                        <option value="notificacao">Notificação</option>
                    </select>
                </FloatingLabelField>
            </div>
            {!hideSetor && (
                <div>
                    <FloatingLabelField id="sm-rh-setor" label="Setor" required value={formData.setor || ''}>
                        <select
                            required
                            className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                                backgroundColor: 'var(--cor-container)',
                                color: 'var(--cor-texto-principal)',
                                borderColor: 'var(--cor-borda)',
                            }}
                            value={formData.setor || ''}
                            onChange={(e) => handleInputChange('setor', e.target.value)}
                        >
                            <option value="">Selecione o setor</option>
                            <option value="rh">RH</option>
                            <option value="financeiro">Financeiro</option>
                        </select>
                    </FloatingLabelField>
                </div>
            )}
            <div>
                <FloatingLabelField id="sm-rh-mensagem" label="Mensagem" required value={formData.mensagem || ''}>
                    <textarea
                        required
                        rows={6}
                        className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        style={{
                            backgroundColor: 'var(--cor-container)',
                            color: 'var(--cor-texto-principal)',
                            borderColor: 'var(--cor-borda)',
                        }}
                        value={formData.mensagem || ''}
                        onChange={(e) => handleInputChange('mensagem', e.target.value)}
                        placeholder="Digite sua mensagem"
                    />
                </FloatingLabelField>
            </div>
        </div>
    );

    const renderFormFields = () => {
        if (mode === 'caixa_sugestoes') {
            return renderCaixaSugestoesForm();
        }

        if (mode === 'fale_rh') {
            return renderRhFinanceiroForm({ hideSetor: true });
        }

        const type = activeSubType;
        if (!type) return null;

        if (CONTEUDO_TYPES.includes(type)) {
            return renderConteudoForm();
        }

        switch (type) {
            case 'gestao':
                return (
                    <div className="space-y-4">
                        <div>
                            <FloatingLabelField id="sm-gestao-tipo" label="Tipo" required value={formData.tipo || ''}>
                                <select
                                    required
                                    className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{
                                        backgroundColor: 'var(--cor-container)',
                                        color: 'var(--cor-texto-principal)',
                                        borderColor: 'var(--cor-borda)',
                                    }}
                                    value={formData.tipo || ''}
                                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                                >
                                    <option value="">Selecione o tipo</option>
                                    <option value="solicitacao">Solicitação</option>
                                    <option value="agendamento">Agendamento</option>
                                    <option value="notificacao">Notificação</option>
                                </select>
                            </FloatingLabelField>
                        </div>
                        <div>
                            <FloatingLabelField id="sm-gestao-direcionado" label="Direcionado a" required value={formData.direcionado || ''}>
                                <select
                                    required
                                    className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{
                                        backgroundColor: 'var(--cor-container)',
                                        color: 'var(--cor-texto-principal)',
                                        borderColor: 'var(--cor-borda)',
                                    }}
                                    value={formData.direcionado || ''}
                                    onChange={(e) => handleInputChange('direcionado', e.target.value)}
                                >
                                    <option value="">Selecione o destinatário</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="gestor">Gestor</option>
                                    <option value="backoffice">Backoffice</option>
                                    <option value="qa">QA</option>
                                </select>
                            </FloatingLabelField>
                        </div>
                        <div>
                            <FloatingLabelField id="sm-gestao-mensagem" label="Mensagem" required value={formData.mensagem || ''}>
                                <textarea
                                    required
                                    rows={6}
                                    className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    style={{
                                        backgroundColor: 'var(--cor-container)',
                                        color: 'var(--cor-texto-principal)',
                                        borderColor: 'var(--cor-borda)',
                                    }}
                                    value={formData.mensagem || ''}
                                    onChange={(e) => handleInputChange('mensagem', e.target.value)}
                                    placeholder="Digite sua mensagem"
                                />
                            </FloatingLabelField>
                        </div>
                    </div>
                );

            case 'rh_financeiro':
                return renderRhFinanceiroForm();

            case 'facilities':
                return (
                    <div className="space-y-4">
                        <div>
                            <FloatingLabelField id="sm-fac-tipo" label="Tipo" required value={formData.tipo || ''}>
                                <select
                                    required
                                    className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{
                                        backgroundColor: 'var(--cor-container)',
                                        color: 'var(--cor-texto-principal)',
                                        borderColor: 'var(--cor-borda)',
                                    }}
                                    value={formData.tipo || ''}
                                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                                >
                                    <option value="">Selecione o tipo</option>
                                    <option value="reposicao">Reposição</option>
                                    <option value="substituicao">Substituição</option>
                                    <option value="aquisicao">Aquisição</option>
                                    <option value="acesso">Acesso</option>
                                    <option value="manutencao">Manutenção</option>
                                </select>
                            </FloatingLabelField>
                        </div>
                        <div>
                            <FloatingLabelField id="sm-fac-categoria" label="Categoria" required value={formData.categoria || ''}>
                                <select
                                    required
                                    className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{
                                        backgroundColor: 'var(--cor-container)',
                                        color: 'var(--cor-texto-principal)',
                                        borderColor: 'var(--cor-borda)',
                                    }}
                                    value={formData.categoria || ''}
                                    onChange={(e) => handleInputChange('categoria', e.target.value)}
                                >
                                    <option value="">Selecione a categoria</option>
                                    <option value="computador">Computador</option>
                                    <option value="acessorio">Acessório</option>
                                    <option value="mobilia">Mobília</option>
                                    <option value="item_escritorio">Item de Escritório</option>
                                    <option value="servico">Serviço</option>
                                    <option value="estrutural">Estrutural</option>
                                </select>
                            </FloatingLabelField>
                        </div>
                        <div>
                            <FloatingLabelField id="sm-fac-mensagem" label="Mensagem" required value={formData.mensagem || ''}>
                                <textarea
                                    required
                                    rows={6}
                                    className="w-full px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    style={{
                                        backgroundColor: 'var(--cor-container)',
                                        color: 'var(--cor-texto-principal)',
                                        borderColor: 'var(--cor-borda)',
                                    }}
                                    value={formData.mensagem || ''}
                                    onChange={(e) => handleInputChange('mensagem', e.target.value)}
                                    placeholder="Digite sua mensagem"
                                />
                            </FloatingLabelField>
                        </div>
                    </div>
                );

            default:
                return <div>Formulário não encontrado</div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: 'var(--cor-container)', maxWidth: '52.5rem' }}
            >
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--cor-borda)' }}>
                    <div className="flex items-center space-x-3">
                        <div className="text-blue-500 dark:text-blue-400">
                            {getIcon()}
                        </div>
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--cor-texto-principal)' }}>
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {renderSubTypeSelector()}
                    {renderFormFields()}

                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t" style={{ borderColor: 'var(--cor-borda)' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            style={{
                                borderColor: 'var(--cor-borda)',
                                color: 'var(--cor-texto-principal)',
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Enviando...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    <span>Enviar</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupportModal;
