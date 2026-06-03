import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = document.getElementById('root')!;

// If the root already contains SSG-rendered HTML, hydrate instead of overwriting.
if (root.innerHTML.trim() && root.innerHTML.trim() !== '<!--app-html-->') {
  hydrateRoot(root, <App />);
} else {
  createRoot(root).render(<App />);
}
