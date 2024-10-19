import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

const queryClient = new QueryClient();

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement!);

root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <Router>
                <App />
            </Router>
        </QueryClientProvider>
    </React.StrictMode>
);