import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';  // Ou o arquivo de estilo que você preferir
import App from './App';  // Componente principal
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();
