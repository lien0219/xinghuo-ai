# 讯飞星火大模型V3.0 WebApi使用

文档说明：[星火认知大模型Web文档 | 讯飞开放平台文档中心 (xfyun.cn)](https://www.xfyun.cn/doc/spark/Web.html#_1-接口说明)

## 实现效果

![](https://szx-bucket1.oss-cn-hangzhou.aliyuncs.com/picgo/ai.gif)



## 初始化

首先构建一个基础脚手架项目

```sh
npm init vue@latest
```

用到如下依赖

```json
"dependencies": {
    "crypto-js": "^4.2.0",
    "highlight.js": "^11.9.0",
    "marked": "^9.1.3",
    "pinia": "^2.1.7",
    "pinia-plugin-persistedstate": "^3.2.0",
    "vue": "^3.3.4",
    "vue-router": "^4.2.5"
  }
```

修改 `main.js`

```js
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
```

## TTSRecorder

新建 `utils/TTSRecorder.js`

这个文件封装了发送消息并相应消息的核心功能

```js
import CryptoJS from "crypto-js"
const APPID = '' // 从控制台可以获取
const API_SECRET = '' // 从控制台可以获取
const API_KEY = '' // 从控制台可以获取
let total_res = "";

function getWebsocketUrl() {
  return new Promise((resolve, reject) => {
    var apiKey = API_KEY
    var apiSecret = API_SECRET
    var url = 'ws://spark-api.xf-yun.com/v3.1/chat'
    var host = location.host
    var date = new Date().toGMTString()
    var algorithm = 'hmac-sha256'
    var headers = 'host date request-line'
    var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v3.1/chat HTTP/1.1`
    var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
    var signature = CryptoJS.enc.Base64.stringify(signatureSha)
    var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
    var authorization = btoa(authorizationOrigin)
    url = `${url}?authorization=${authorization}&date=${date}&host=${host}`
    resolve(url)
  })
}


export default class TTSRecorder {
  constructor({appId = APPID} = {}) {
    this.appId = appId
    this.msgStore = null
    this.msgDom = null
  }

  // 连接websocket
  connectWebSocket() {
    return getWebsocketUrl().then(url => {
      let ttsWS
      if ('WebSocket' in window) {
        ttsWS = new WebSocket(url)
      } else if ('MozWebSocket' in window) {
        ttsWS = new MozWebSocket(url)
      } else {
        alert('浏览器不支持WebSocket')
        return
      }
      this.ttsWS = ttsWS
      ttsWS.onopen = e => {
        this.webSocketSend()
      }
      ttsWS.onmessage = e => {
        this.result(e.data)
      }
      ttsWS.onerror = e => {
        alert('WebSocket报错，请f12查看详情')
        console.error(`详情查看：${encodeURI(url.replace('wss:', 'https:'))}`)
      }
      ttsWS.onclose = e => {
        console.log(e)
      }
    })
  }


  // websocket发送数据
  webSocketSend() {
    var params = {
      "header": {
        "app_id": this.appId,
      },
      "parameter": {
        "chat": {
          // 指定访问的领域,general指向V1.5版本,generalv2指向V2版本,generalv3指向V3版本 。
          // 注意：不同的取值对应的url也不一样！
          "domain": "generalv3",
          // 核采样阈值。用于决定结果随机性，取值越高随机性越强即相同的问题得到的不同答案的可能性越高
          "temperature": 0.5,
          // 模型回答的tokens的最大长度
          "max_tokens": 1024
        }
      },
      "payload": {
        "message": {
          "text": this.msgStore.list
        }
      }
    }
    console.log(params,'请求的参数')
    this.ttsWS.send(JSON.stringify(params))
  }

  start(msgStore,msgDom) {
    this.msgStore = msgStore
    this.msgDom = msgDom.value
    total_res = ""; // 请空回答历史
    this.connectWebSocket().then(r => {})
  }

  // websocket接收数据的处理
  result(resultData) {
    let jsonData = JSON.parse(resultData)
    jsonData.payload.choices.text.forEach(res=>{
      this.msgStore.aiAddMsg(res.content,jsonData.header.status)
      this.msgDom.scrollTop = this.msgDom.scrollHeight + 500
    })
    // 提问失败
    if (jsonData.header.code !== 0) {
      alert(`提问失败: ${jsonData.header.code}:${jsonData.header.message}`)
      console.error(`${jsonData.header.code}:${jsonData.header.message}`)
      return
    }
    if (jsonData.header.code === 0 && jsonData.header.status === 2) {
      // 关闭WebSocket
      this.ttsWS.close()
    }
  }
}
```

## msgStore

新建 `stores/msgStore.js` 

用于存放历史问题

```js
import { defineStore } from 'pinia'
import { marked } from 'marked'

export const userMsgStore = defineStore("userMsgStore",{
  // 持久化
  persist: true,
  state: () => {
    return {
      list:[]
    }
  },
  actions: {
    userAddMsg(msg) {
      this.list.push({
        role:"user",
        content:marked(msg),
        status:2
      })
    },
    aiAddMsg(content,status){
      let runMsg = this.list.find(i=>i.status !== 2)
      if(!runMsg){
        this.list.push({
          role:"assistant",
          content:content,
          status:status
        })
      }else{
        runMsg.content += content
        runMsg.status = status
        if(status === 2){
          runMsg.content = marked(runMsg.content)
        }
      }
    }
  },
})
```

## 编写界面代码

```html
<template>
  <div class="content">

    <div class="message" id='message-box'>
      <div v-for="(msg,index) in msgList" :key="index" :class="{
          'user':msg.role === 'user',
          'assistant':msg.role === 'assistant'
        }">
        <div>
          <div>
            <img class='role-img' :src="userImg" v-if="msg.role === 'user'"/>
          </div>
          <div class='imgbox' v-if="msg.role === 'assistant'">
            <img class='role-img' :src="aiImg" />
            <div class='name'>讯飞AI</div>
          </div>
        </div>
        <div v-highlight v-html='msg.content'></div>
      </div>
    </div>


    <div class="footer">
      <textarea rows="5" placeholder="请输入问题" class="text" v-model="msgValue"></textarea>
      <button class="btn" @click="submitMsg">发送</button>
    </div>
  </div>
</template>

<script setup>
import userImg from "@/assets/user.png"
import aiImg from "@/assets/ai.png"
import { nextTick, onMounted, ref } from 'vue'
import TTSRecorder from "@/utils/TTSRecorder"
import { userMsgStore } from '@/stores/msgStore'
const msgStore = userMsgStore()
const msgValue = ref("")
let ttsRecorder = new TTSRecorder()
const msgList = ref([])
let msgDom = ref(null)

onMounted(()=>{
  msgDom.value = document.getElementById("message-box")
  msgList.value = msgStore.list
  scroll()
})

// 滚动到最底部
const scroll = () => {
  nextTick(()=>{
    msgDom.value.scrollTop = msgDom.value.scrollHeight
  })
}

// 发送消息
const submitMsg = async () => {
  msgStore.userAddMsg(msgValue.value)
  msgValue.value = ""
  // 开始提问
  ttsRecorder.start(msgStore,msgDom)
  scroll()
}
</script>

<style scoped lang="less">


.content{
  height: 100%;
  position: relative;



  .message{
    position: absolute;
    top: 0;
    left: 20%;
    right: 20%;
    bottom: 150px;
    display: flex;
    overflow: auto;
    flex-direction: column;
    .user{
      background-color: #ebf7f8;
      padding: 15px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      border-bottom: 1px solid #dfdfdf;
    }
    .assistant{
      background-color: #f7f7f7;
      padding: 15px;
      box-sizing: border-box;
      border-bottom: 1px solid #dfdfdf;
    }
  }

  .footer{
    position: absolute;
    bottom: 50px;
    left: 20%;
    right: 20%;
    display: flex;
    align-items: flex-end;
    gap: 15px;
    .text{
      width: 100%;
    }
    .btn{
      width: 100px;
      height: 40px;
      background-color: #1a60ea;
      color: white;
      border: none;
    }
  }

  @media screen and (max-width: 768px) {
    .message,.footer {
      left: 0;
      right: 0;
    }
    .message{
      bottom: 100px;
    }
    .footer{
      bottom: 10px;
    }
  }
}

.imgbox{
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  .name{
    font-size: 13px;
    color: #fd919e;
    font-weight: 400;
  }
}

.role-img{
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

</style>
```





