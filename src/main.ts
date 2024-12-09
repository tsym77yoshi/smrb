import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate';
import { useItemsStore } from '@/store/tlStore';
import { useFileStore } from '@/store/fileStore';
import { Quasar } from 'quasar'
import 'quasar/dist/quasar.css'
import '@quasar/extras/material-icons/material-icons.css'

import '@/assets/main.css'
import '@/styles/colors.css'
import '@/styles/size.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedState)
app.use(pinia)
useFileStore().resetFileInfoStatus();
useItemsStore().idInitialize();

app.use(Quasar, {
  config: {
    brand: {
      //primary: "--var(--color-primary)"
      primary: "#eb6ea5",
    },
    dark: "auto",
  },
})
app.use(router)

app.mount('#app')
