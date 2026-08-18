import { createApp } from 'vue';
import App from '@/app/App.vue';
import { router } from '@/app/router';
import { registerAuthenticationGuard } from '@/app/router/authentication-guard';
import { createSessionProvider } from '@/app/providers';
import { createSessionStore } from '@/shared/auth';
import { createI18n } from '@/shared/i18n';
import { initializeTheme } from '@/shared/theme/theme';
import '@/shared/styles/global.css';

initializeTheme();
const session = createSessionStore();
const i18n = createI18n();
registerAuthenticationGuard(router, session);
createApp(App).use(i18n).use(createSessionProvider(session)).use(router).mount('#app');
