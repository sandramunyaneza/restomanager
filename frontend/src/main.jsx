import React from 'react';
import { createRoot } from 'react-dom/client';
import './assets/styles/globals.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import '@fortawesome/fontawesome-free/css/all.min.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
