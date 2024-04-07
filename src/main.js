import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PiniaPluginPersistedstate from "pinia-plugin-persistedstate"
import App from './App.vue'
import router from './router'
import highlight from 'highlight.js'
import "highlight.js/styles/atom-one-dark.css"

const app = createApp(App)
// 配置Pinia并设置持久化缓存
const pinia = createPinia()
pinia.use(PiniaPluginPersistedstate)

app.use(pinia)
app.use(router)

// 配置Markdown语法高亮
app.directive("highlight",function(el){
  let blocks = el.querySelectorAll('pre code');
  blocks.forEach((block)=>{
    highlight.highlightBlock(block);
  })
})

app.mount('#app')
