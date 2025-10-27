import { createRouter, createWebHistory } from 'vue-router'
import Scan from '../views/Scan.vue'
import BinResults from '../views/BinResults.vue'
import ItemResults from '../views/ItemResults.vue'

const routes = [
  { path: '/', name: 'Scan', component: Scan },
  { path: '/results/bin/:code', name: 'BinResults', component: BinResults, props: true },
  { path: '/results/item/:code', name: 'ItemResults', component: ItemResults, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
