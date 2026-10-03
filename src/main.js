import '@fontsource/baloo-2/500.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/baloo-2/800.css';
import './ui/style.css';
import { App } from './App.js';

// Signs and labels are drawn into canvas textures, so the font must be ready
// before the scene is built. The Vietnamese sample pulls in that subset too.
Promise.all([
  document.fonts.load('800 64px "Baloo 2"', 'Quán Phở Bác Ba ồ'),
  document.fonts.load('700 22px "Baloo 2"', 'Điểm ồ'),
])
  .catch(() => {})
  .then(() => {
    const app = new App();
    // Handy for debugging and browser-driven checks during development.
    if (import.meta.env.DEV) window.__app = app;
  });
