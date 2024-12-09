import { createRouter, createWebHistory } from 'vue-router';
import TimelineView from '@/pages/timeline/TimelineView.vue';
import AddItemView from '@/pages/dialog/addItem/AddItemView.vue';
import AddVoiceScriptView from '@/pages/dialog/addItem/AddVoiceScriptView.vue';
import SettingView from '@/pages/dialog/setting/SettingView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'timeline',
      component: TimelineView,
    },
    {
      path: '/dialog/addItem',
      name: 'addItem',
      component: AddItemView,
    },
    {
      path: '/dialog/fileView',
      name: 'fileView',
      component: AddItemView,
    },
    {
      path: '/dialog/addVoiceScript',
      name: 'addVoiceScript',
      component: AddVoiceScriptView,
    },
    {
      path: '/dialog/setting',
      name: 'setting',
      component: SettingView,
    },

    /* {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    } */
  ]
})

export default router
