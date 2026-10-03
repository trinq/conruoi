import '@fontsource/paytone-one/400.css';
import '@fontsource/patrick-hand/400.css';
import './ui/style.css';
import { App } from './App.js';

// Signs and labels are drawn into canvas textures, so the font must be ready
// before the scene is built. The Vietnamese sample pulls in that subset too.
Promise.all([
  document.fonts.load('64px "Paytone One"', 'Quán Phở Bác Ba ồ'),
  document.fonts.load('22px "Patrick Hand"', 'Thực đơn hôm nay ồ'),
])
  .catch(() => {})
  .then(() => {
    const app = new App();
    // Handy for debugging and browser-driven checks during development.
    if (import.meta.env.DEV) window.__app = app;
  });
