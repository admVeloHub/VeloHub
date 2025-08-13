import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Detectar qual versão usar baseado na variável de ambiente
const useV2 = process.env.REACT_APP_VERSION === 'v2';

// Importar o componente correto
const App = useV2 ? require('./App_v2').default : require('./App').default;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
