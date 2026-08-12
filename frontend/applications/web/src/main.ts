import { createApp } from 'vue';
import App from '@/app/App.vue';
import { router } from '@/app/router';
import { initializeTheme } from '@/shared/theme/theme';
import '@/shared/styles/global.css';

initializeTheme();
createApp(App).use(router).mount('#app');
