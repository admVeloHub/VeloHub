import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Importar a versão v2-1 que tem as APIs configuradas
import App from './App_v2-1';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
