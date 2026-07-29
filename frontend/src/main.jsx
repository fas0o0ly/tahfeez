// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
          success: {
            iconTheme: { primary: '#2d6a4f', secondary: '#fff' },
            style: { borderLeft: '4px solid #2d6a4f' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
            style: { borderLeft: '4px solid #dc2626' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);