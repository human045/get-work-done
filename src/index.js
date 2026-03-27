import React from 'react';
import ReactDOM from 'react-dom/client';
import posthog from 'posthog-js';
import App from './App';

posthog.init('phc_SS5g62UUVqA4fgyCprePiSmV0HvsQ7pl6eyFgQhPmMg', {
  api_host: 'https://eu.i.posthog.com',
  defaults: '2026-01-30',
  debug: true,
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
