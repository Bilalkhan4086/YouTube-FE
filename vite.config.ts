import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import {blogPlugin, configuredSiteOrigin} from './scripts/blog.mjs';
export default defineConfig(({mode}) => {
 const env = loadEnv(mode, '.', '');
 return {plugins:[react(), blogPlugin(configuredSiteOrigin(env))],server:{proxy:{'/api':{target:env.API_PROXY_TARGET || 'http://localhost:8000',changeOrigin:true}}}};
});
