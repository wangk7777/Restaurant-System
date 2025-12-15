import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Importing from root directory based on file structure
import './index.css';    // Importing from root directory

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
}