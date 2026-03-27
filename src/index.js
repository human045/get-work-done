import React from 'react';
import ReactDOM from 'react-dom/client';
import posthog from 'posthog-js';
import App from './App';
import { ClerkProvider } from '@clerk/react';

posthog.init('phc_SS5g62UUVqA4fgyCprePiSmV0HvsQ7pl6eyFgQhPmMg', {
  api_host: 'https://eu.i.posthog.com',
  defaults: '2026-01-30',
  debug: true,
});

const clerkKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkKey) {
  console.error('Clerk Publishable Key is missing! Neither REACT_APP_CLERK_PUBLISHABLE_KEY nor VITE_CLERK_PUBLISHABLE_KEY was found.');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkKey || 'missing'} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
