/// <reference types="vite/client" />

import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    readonly navigationArea?: 'home' | 'ministries' | 'members' | 'activities';
  }
}
