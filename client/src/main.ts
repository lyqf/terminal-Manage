import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import GlobalToast from './components/GlobalToast.vue'
import GlobalConfirm from './components/GlobalConfirm.vue'
import { toast } from './utils/toast'
import { confirm } from './utils/confirm'

const app = createApp(App)

app.component('GlobalToast', GlobalToast)
app.component('GlobalConfirm', GlobalConfirm)

app.config.globalProperties.$toast = toast;
app.config.globalProperties.$confirm = confirm;

(window as any).$toast = toast;
(window as any).$confirm = confirm;

app.use(router).mount('#app')
