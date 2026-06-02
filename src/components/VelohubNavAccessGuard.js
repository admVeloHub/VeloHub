/**
 * VeloHub V3 — guard genérico por item de navegação (permissoesVelohub)
 * VERSION: v1.0.0 | DATE: 2026-05-28 | AUTHOR: VeloHub Development Team
 */

import React from 'react';
import { getPermissoesVelohub, navItemPermitidoVelohub } from '../services/auth';

const VelohubNavAccessGuard = ({ navItem, children }) => {
  const permissoes = getPermissoesVelohub();
  const allowed = navItemPermitidoVelohub(navItem, permissoes);

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: 'var(--cor-fundo)' }}>
      <div className="velohub-container max-w-md text-center p-8">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-4 velohub-title" style={{ color: 'var(--blue-dark)' }}>
          Acesso negado
        </h2>
        <p className="mb-6" style={{ color: 'var(--cor-texto-secundario)' }}>
          Você não tem permissão para acessar o módulo {navItem}.
        </p>
        <p className="text-sm" style={{ color: 'var(--cor-texto-secundario)' }}>
          Se acredita que deveria ter acesso, fale com o administrador do sistema.
        </p>
      </div>
    </div>
  );
};

export default VelohubNavAccessGuard;
