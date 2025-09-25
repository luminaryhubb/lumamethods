import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './client',  // Certifique-se de que o caminho para o root esteja correto
  build: {
    outDir: 'dist',  // Onde o build será gerado
  },
  server: {
    host: true,  // Permite o acesso externo ao frontend
    port: 5173
  }
});
