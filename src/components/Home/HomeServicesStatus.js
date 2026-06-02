/**
 * VeloHub V3 — Status dos Serviços (Home / Atendimento)
 * VERSION: v1.0.4 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.4: Título via HomeWidgetTitle (PNG remodelado serviços.png)
 * - v1.0.1: Polling module-status a cada 60s (paridade Atendimento)
 */

import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api-config';
import HomeWidgetTitle from './HomeWidgetTitle';

const DEFAULT_MODULE_STATUS = {
  'credito-trabalhador': 'on',
  'credito-pessoal': 'on',
  antecipacao: 'off',
  'pagamento-antecipado': 'on',
  'modulo-irpf': 'off',
  'seguro-cred': 'on',
  'seguro-cel': 'on',
  'clube-velotax': 'on',
  'divida-zero': 'on',
  'perda-renda': 'on',
  cupons: 'on',
  'seguro-pessoal': 'on',
};

const SERVICE_ITEMS = [
  ['antecipacao', 'Antecipação'],
  ['credito-pessoal', 'Cr. Pessoal'],
  ['pagamento-antecipado', 'Pgto Antec'],
  ['seguro-cred', 'Prestamista'],
  ['seguro-cel', 'Seguro Cel'],
  ['perda-renda', 'Perda de Renda'],
  ['cupons', 'Cupons'],
  ['seguro-pessoal', 'Seguro Pessoal'],
];

function renderModuleStatusBadge(moduleStatus, moduleKey, moduleName) {
  const status = moduleStatus[moduleKey];
  let badgeConfig = {};

  switch (status) {
    case 'on':
      badgeConfig = {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        darkBg: 'dark:bg-green-900',
        darkText: 'dark:text-green-200',
        title: 'Serviço Online - Funcionando normalmente',
      };
      break;
    case 'revisao':
      badgeConfig = {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        darkBg: 'dark:bg-yellow-900',
        darkText: 'dark:text-yellow-200',
        title: 'Em Revisão - Serviço temporariamente indisponível',
      };
      break;
    case 'off':
      badgeConfig = {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        darkBg: 'dark:bg-red-900',
        darkText: 'dark:text-red-200',
        title: 'Serviço Offline - Indisponível no momento',
      };
      break;
    default:
      badgeConfig = {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        darkBg: 'dark:bg-gray-900',
        darkText: 'dark:text-gray-200',
        title: 'Status Desconhecido',
      };
  }

  return (
    <span
      className={`home-services-status__badge ${badgeConfig.bgColor} ${badgeConfig.textColor} ${badgeConfig.darkBg} ${badgeConfig.darkText} rounded-full`}
      title={badgeConfig.title}
    >
      {moduleName}
    </span>
  );
}

const HomeServicesStatus = ({ className = '', columns = 3 }) => {
  const [moduleStatus, setModuleStatus] = useState(DEFAULT_MODULE_STATUS);

  const fetchModuleStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/module-status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const statusData = await response.json();
        setModuleStatus((prev) => ({ ...prev, ...statusData }));
      }
    } catch (error) {
      console.error('HomeServicesStatus: erro ao buscar status:', error);
    }
  }, []);

  useEffect(() => {
    fetchModuleStatus();
    const id = setInterval(fetchModuleStatus, 60 * 1000);
    return () => clearInterval(id);
  }, [fetchModuleStatus]);

  return (
    <div className={`home-widget ${className}`.trim()}>
      <HomeWidgetTitle fileName="serviços.png" alt="Status dos serviços" />
      <div className={`home-services-status__grid grid ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {SERVICE_ITEMS.map(([key, label]) => (
          <React.Fragment key={key}>{renderModuleStatusBadge(moduleStatus, key, label)}</React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default HomeServicesStatus;
