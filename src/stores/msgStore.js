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
        // 在页面中进行marked操作
        // if(status === 2){
        //   runMsg.content = marked(runMsg.content)
        // }
      }
    }
  },
})
