import { defineConfig } from 'vite';
export default defineConfig({base:'/kickoff/',build:{outDir:'../public/kickoff',emptyOutDir:true,rollupOptions:{input:{player:'index.html',team:'team.html'}}}});
