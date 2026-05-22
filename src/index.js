/**
 * Ponto de entrada React — VeloHub
 * VERSION: v1.0.2 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.0.1: Import do módulo raiz: App_v6.js (antes App_v2-1.js)
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/sociais.css';

// Componente raiz da aplicação (App_v6.js)
import App from './App_v6';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
