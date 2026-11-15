/*
 * ============================================================================
 * Program Name:   vite.config.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Vite build settings. The dev server always runs on
 *                 http://localhost:3000. base is '/' because the site is
 *                 served from a custom domain on GitHub Pages.
 * ============================================================================
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true, // fail loudly instead of silently moving to another port
  },
  preview: {
    port: 3000,
  },
});
