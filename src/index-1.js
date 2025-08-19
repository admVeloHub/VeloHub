import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Forçar uso da versão v2 que tem as APIs configuradas
const App = require('./App_v2').default;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
