import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Permite acessar o frontend no endereço correto
    port: 5173   // A porta padrão para o Vite
  }
});
