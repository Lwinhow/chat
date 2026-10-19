<template>
  <div class="moon-shot">
    <div class="moon-box">
      <div :style="mergedColorConfig.headBg" class="moon-head">
        <div class="moon-title">
          <p :style="mergedColorConfig.headTitle" class="title-text">{{ title }}</p>
          <p class="name-text">
            <span>{{ myself.name }},</span>
            <span>{{ chatAi.name }}</span>
          </p>
        </div>
        <div class="moon-config">
          <div style="width: 200px" title="Select AI Model Version">
            <el-select v-model="model" placeholder="Please Select" style="width: 180px">
              <el-option
                  v-for="item in models"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
              </el-option>
            </el-select>
          </div>
          <div v-if="chatLogEnabled" title="存储对话">
            <el-switch
                v-model="isSave"
                active-color="#2eff9d"
                inactive-color="#39597a">
            </el-switch>
          </div>
          <div v-if="chatLogEnabled" title="下载对话">
            <el-popover placement="bottom-start" width="280" trigger="click" :append-to-body="true"
                        @show="loadChatFiles">
              <el-button slot="reference" type="info" icon="el-icon-download" circle></el-button>
              <div class="chat-files-panel">
                <div v-if="!chatFiles.length" class="chat-files-empty">No chat logs yet</div>
                <el-checkbox-group v-model="selectedFiles" class="chat-files-list">
                  <el-checkbox v-for="f in chatFiles" :key="f" :label="f" class="chat-file-item">{{
                      fileLabel(f)
                    }}
                  </el-checkbox>
                </el-checkbox-group>
                <el-button type="primary" size="mini" :disabled="!selectedFiles.length"
                           @click="downloadChatFiles">Download
                </el-button>
              </div>
            </el-popover>
          </div>
          <div title="清空对话">
            <el-popconfirm
                :hide-icon=false
                cancel-button-text='No'
                confirm-button-text='OK'
                icon="el-icon-info"
                icon-color="red"
                title="Are you sure to clear chat records?"
                @confirm="clearMessage">
              <el-button slot="reference" type="danger" icon="el-icon-delete" circle></el-button>
            </el-popconfirm>
          </div>
          <div title="关闭">
            <el-button type="primary" icon="el-icon-close" circle @click="closeChat"></el-button>
          </div>
        </div>
      </div>
      <div ref="messagesContainer" :style="mergedColorConfig.bodyBg" class="moon-body">
        <div v-for="(message,index) in messages" :key="index" class="message-box">
          <div v-if="message.role==='user'" class="my-message">
            <div class="message-content">
              <div class="bubble-wrap">
                <div :style="mergedColorConfig.message.my.content" class="message-text">
                  <p v-if="showName" :style="mergedColorConfig.message.my.name" class="message-name">{{ myself.name }}</p>
                  <p>{{ message.content }}</p>
                </div>
                <div class="bubble-meta">
                  <div v-if="mergedTimestampConfig.show" class="message-timestamp">
                    {{ formatTimestamp(message.timestamp) }}
                  </div>
                  <div class="bubble-actions">
                    <span class="ba-btn" title="Copy" @click="copyMessage(message.content)">
                      <i class="el-icon-document-copy"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="message-icon">
              <img v-if="showAvatar && mergedProfileConfig.my && myself.profilePicture" :src="myself.profilePicture"
                   :style="mergedProfileConfig.styles" alt="">
            </div>
          </div>
          <div v-else class="ai-message">
            <div class="message-icon">
              <img v-if="showAvatar && mergedProfileConfig.ai && chatAi.profilePicture" :src="chatAi.profilePicture"
                   :style="mergedProfileConfig.styles" alt="">
            </div>
            <div class="message-content">
              <div class="bubble-wrap">
                <div :style="mergedColorConfig.message.ai.content" class="message-text">
                  <p v-if="showName" :style="mergedColorConfig.message.ai.name" class="message-name">{{ chatAi.name }}</p>
                  <div class="md-body" v-html="renderMarkdown(message.content)"></div>
                </div>
                <div class="bubble-meta">
                  <div v-if="mergedTimestampConfig.show" class="message-timestamp">
                    {{ formatTimestamp(message.timestamp) }}
                  </div>
                  <div class="bubble-actions">
                    <span class="ba-btn" title="Copy" @click="copyMessage(message.content)"><i
                        class="el-icon-document-copy"></i></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="thinking" class="message-box">
          <div class="ai-message">
            <div class="message-icon">
              <img v-if="showAvatar && mergedProfileConfig.ai && chatAi.profilePicture" :src="chatAi.profilePicture"
                   :style="mergedProfileConfig.styles" alt="">
            </div>
            <div class="message-content">
              <div :style="mergedColorConfig.message.ai.content" class="message-text">
                <p v-if="showName" :style="mergedColorConfig.message.ai.name" class="message-name">{{ chatAi.name }}</p>
                <div class="md-body thinking"><span></span><span></span><span></span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div :style="mergedColorConfig.bottomBg" class="moon-bottom">
        <div class="message-input">
          <div ref="messageInput"
               :placeholder="placeholder"
               class="input-box"
               contenteditable="true"
               tabindex="0"
               @keydown="handleKeydown">
          </div>
        </div>
        <div class="sand-icon" title="sendMessage">
          <el-button circle icon="el-icon-s-promotion" type="primary" @click="sendMessage"></el-button>
        </div>
        <div class="sand-icon" title="sendFile">
          <input ref="fileInput" :accept="acceptImageTypes" style="display: none;" type="file" @change="sendFile">
          <el-button circle icon="el-icon-picture" type="primary" @click="openFileInput"></el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/utils/api'
import markdownit from 'markdown-it'
import DOMPurify from 'dompurify'
import {
  defaultAcceptImageTypes,
  defaultColorConfig,
  defaultModels,
  defaultProfileConfig,
  defaultTimestampConfig
} from './theme'

const md = markdownit({breaks: true, linkify: true})

/** props 配置按段整体覆盖默认主题（浅合并），未传的段沿用 theme.js 默认值 */
function mergeTheme(defaults, overrides) {
  return Object.assign({}, defaults, overrides || {})
}

export default {
  name: 'MoonChat',
  props: {
    /** 标题与输入框占位符 */
    title: {type: String, default: 'Chat Title'},
    placeholder: {type: String, default: 'send your message !'},
    /** 双方名称与头像（头像传空且对应开关开启时不渲染 img） */
    myName: {type: String, default: 'User'},
    aiName: {type: String, default: 'AI'},
    myAvatar: {type: String, default: ''},
    aiAvatar: {type: String, default: ''},
    /** 模型下拉与默认选中项 */
    models: {type: Array, default: () => defaultModels.slice()},
    defaultModel: {type: String, default: ''},
    /** 主题配置，按段覆盖 theme.js 默认值 */
    colorConfig: {type: Object, default: () => ({})},
    profileConfig: {type: Object, default: () => ({})},
    timestampConfig: {type: Object, default: () => ({})},
    /** 头像总开关：false 时两侧头像都不展示（可与 profileConfig.ai/my 按侧开关叠加） */
    showAvatar: {type: Boolean, default: false},
    /** 是否在气泡内展示发送者名称（my/ai 两侧及 thinking 占位） */
    showName: {type: Boolean, default: false},
    /** 可发送的图片类型 */
    acceptImageTypes: {type: Array, default: () => defaultAcceptImageTypes.slice()},
    /** 请求 AI 时携带的历史消息上限（不含 system） */
    maxHistory: {type: Number, default: 20},
    /**
     * 系统提示词注入函数：() => string。
     * 返回值作为 role=system 消息插入请求最前；不传则不注入。
     * 看板数据等业务上下文由调用方组装，组件不耦合任何数据源。
     */
    buildSystemPrompt: {type: Function, default: null},
    /** 是否启用对话日志（保存/下载）；关闭时隐藏相关 UI 并静默跳过上报 */
    chatLogEnabled: {type: Boolean, default: true},
    /** 对话日志附加上下文：() => object，返回值合入上报体（如看板 version）；不传则只上报基础字段 */
    logContext: {type: Function, default: null},
    /** 对话日志归属的用户名，空则记为 anonymous */
    username: {type: String, default: ''}
  },
  data() {
    return {
      isSave: true,
      model: this.defaultModel || (this.models[0] && this.models[0].value) || defaultModels[0].value,
      messages: [],
      chatHistory: [],
      thinking: false,
      chatFiles: [],
      selectedFiles: [],
      scrollBottom: {
        messageSent: true,
        messageReceived: false
      }
    }
  },
  computed: {
    mergedColorConfig() {
      return mergeTheme(defaultColorConfig, this.colorConfig)
    },
    mergedProfileConfig() {
      return mergeTheme(defaultProfileConfig, this.profileConfig)
    },
    mergedTimestampConfig() {
      return mergeTheme(defaultTimestampConfig, this.timestampConfig)
    },
    myself() {
      return {name: this.myName, profilePicture: this.myAvatar}
    },
    chatAi() {
      return {name: this.aiName, profilePicture: this.aiAvatar}
    },
    logUser() {
      return this.username || 'anonymous'
    }
  },
  methods: {
    closeChat() {
      this.$emit('closeChat')
    },
    clearMessage() {
      this.messages = []
      this.$emit('clear')
    },
    /** AI 文本是 markdown（**加粗**、- 列表、```代码```），渲染前必须消毒防 XSS */
    renderMarkdown(text) {
      return DOMPurify.sanitize(md.render(text || ''))
    },
    async sendMessageToAI() {
      this.thinking = true
      this.scrollToBottom()
      try {
        this.chatHistory = []
        for (const message of this.messages) {
          this.chatHistory.push({
            role: message.role,
            content: message.content
          })
        }
        if (this.chatHistory.length > this.maxHistory) {
          const numberOfItemsToRemove = this.chatHistory.length - this.maxHistory
          this.chatHistory.splice(0, numberOfItemsToRemove)
        }
        const payload = [...this.chatHistory]
        if (typeof this.buildSystemPrompt === 'function') {
          payload.unshift({role: 'system', content: this.buildSystemPrompt()})
        }
        const response = await api.getCompletion(this.model, payload)
        const time = new Date()
        const result = {
          role: 'assistant',
          content: response.data.choices[0].message.content,
          timestamp: time
        }
        this.messages.push(result)
        this.emitConversationLog(result.content)
        this.$emit('receive', result)
        this.scrollToBottom()
      } catch (err) {
        const msg = (err.response && err.response.data && err.response.data.error && err.response.data.error.message) || err.message
        const errText = '⚠ ' + msg
        this.messages.push({role: 'assistant', content: errText, timestamp: new Date()})
        this.emitConversationLog(errText)
        this.$emit('error', err)
        this.scrollToBottom()
        console.log(err)
      } finally {
        this.thinking = false
        this.scrollToBottom()
      }
    },
    /** 取最近一条用户消息，与 AI 回复一起写入 server 端 public/chat/chat-YYYY-MM-DD-<username>.txt；isSave 关闭或 server 不在时静默跳过 */
    emitConversationLog(aiText) {
      if (!this.isSave || !this.chatLogEnabled) return
      const lastUser = [...this.messages].reverse().find(m => m.role === 'user')
      this.logConversation(lastUser ? lastUser.content : '', aiText)
    },
    logConversation(userText, aiText) {
      const extra = typeof this.logContext === 'function' ? (this.logContext() || {}) : {}
      fetch(`${(process.env.BASE_URL || '/').replace(/^\.\//, '/')}api/chat-log`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(Object.assign({
          user: userText,
          assistant: aiText,
          model: this.model
        }, extra, {
          username: this.logUser
        }))
      }).catch(() => {
      })
    },
    fileLabel(f) {
      return f.replace(/^chat-/, '').replace(new RegExp(`-${this.logUser}\\.txt$`), '')
    },
    loadChatFiles() {
      this.selectedFiles = []
      const base = (process.env.BASE_URL || '/').replace(/^\.\//, '/')
      fetch(`${base}api/chat-log/list?username=${encodeURIComponent(this.logUser)}`)
          .then(r => r.json())
          .then(d => {
            this.chatFiles = d.files || []
          })
          .catch(() => {
            this.chatFiles = []
          })
    },
    async downloadChatFiles() {
      if (!this.selectedFiles.length) return
      const base = (process.env.BASE_URL || '/').replace(/^\.\//, '/')
      for (const f of this.selectedFiles) {
        try {
          const res = await fetch(`${base}api/chat-log/download?file=${encodeURIComponent(f)}&username=${encodeURIComponent(this.logUser)}`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = f
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        } catch (e) {
          this.$message.error(`Download failed: ${f}`)
        }
        await new Promise(r => setTimeout(r, 400))
      }
    },
    copyMessage(text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => this.$message.success('Copied'))
            .catch(() => this.fallbackCopy(text))
      } else {
        this.fallbackCopy(text)
      }
    },
    fallbackCopy(text) {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        this.$message.success('Copied')
      } catch (e) {
        this.$message.error('Copy failed')
      }
      document.body.removeChild(ta)
    },
    sendMessage() {
      const messageContent = this.$refs.messageInput.innerText
      if (messageContent.trim()) {
        const message = {
          role: 'user',
          content: messageContent,
          timestamp: new Date()
        }
        this.messages.push(message)
        this.$refs.messageInput.innerText = ''
        this.$emit('send', message)
        if (this.scrollBottom.messageSent) {
          this.scrollToBottom()
        }
        this.sendMessageToAI()
      } else {
        console.log('输入信息不能为空')
      }
    },
    // TODO 图片上传尚未实现：当前仅校验类型并抛出 file-selected 事件，由调用方决定如何处理
    sendFile(event) {
      const files = event.target.files
      if (files.length > 0) {
        const file = files[0]
        const isAcceptedType = this.acceptImageTypes.includes(file.type)
        if (!isAcceptedType) {
          this.$message.error('不接受的文件类型，请选择PNG、JPG或JPEG格式的文件。')
          this.$refs.fileInput.value = ''
          return
        }
        this.$emit('file-selected', file)
      }
    },
    handleKeydown(event) {
      if (event.key === 'Enter') {
        event.preventDefault()
        this.sendMessage()
      }
    },
    openFileInput() {
      this.$refs.fileInput.click()
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        container.scrollTop = container.scrollHeight
      })
    },
    formatTimestamp(timestamp) {
      const date = new Date(timestamp)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      const year = date.getFullYear()
      switch (this.mergedTimestampConfig.format) {
        case 'MM/dd-HH:mm':
          return `${month}/${day}-${hour}:${minute}`
        case 'dd/MM/yyyy':
          return `${day}/${month}/${year}`
        case 'yyyy-MM-dd HH:mm':
          return `${year}-${month}-${day} ${hour}:${minute}`
        case 'MM dd, yyyy':
          return `${month} ${day}, ${year}`
        case 'dd-MM-yyyy HH:mm':
          return `${day}-${month}-${year} ${hour}:${minute}`
        case 'HH:mm':
          return `${hour}:${minute}`
        default:
          return `${month}/${day}-${hour}:${minute}`
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.moon-shot {
  position: absolute;
  z-index: 50;
  top: 100px;
  left: 350px;
  width: 1000px;
  height: 600px;
}

.moon-box {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #041e3a;
  border: 1px solid rgba(0, 200, 255, 0.35);
  box-shadow: 0 0 24px rgba(0, 200, 255, 0.25);
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  flex-direction: column;
  -webkit-box-align: stretch;
  align-items: stretch;
  overflow: hidden;
  border-radius: 10px 10px 0 0;

  .moon-head {
    position: relative;
    z-index: 10;
    height: 70px;
    display: flex;
    padding: 0 10px 0 10px;
    -webkit-box-align: center;
    align-items: center;
    box-shadow: 0 2px 20px 2px rgba(0, 80, 160, 0.35);
    background: rgba(4, 30, 58, 0.98);
    border-bottom: 1px solid rgba(0, 200, 255, 0.3);

    .moon-title {
      padding: 10px;
      -webkit-box-flex: 1;
      flex: 1;
      text-align: left;

      .title-text {
        color: #eaf7ff;
        margin-bottom: 0;
      }

      .name-text {
        color: #8fc6ea;
        font-size: 12px;
        margin-top: 5px;
        max-height: 30px;
        overflow: hidden;
      }
    }

    .moon-config {
      display: flex;

      div {
        width: 50px;
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #8fc6ea;
        text-decoration: none;
        //font-size: 20px;
        cursor: pointer;
        border-radius: 10px;

        &:hover {
          background-color: rgba(14, 154, 216, 0.28);
          color: #eaf7ff;
        }
      }

      ::v-deep .el-input__inner {
        background: rgba(4, 34, 64, 0.97);
        border-color: rgba(63, 210, 255, 0.35);
        color: #eaf7ff;

        &::placeholder {
          color: #6fb7e2;
        }
      }

      ::v-deep .el-switch__core:after {
        top: 2px;
      }
    }
  }

  .moon-body {
    -webkit-box-flex: 1;
    flex: 1;
    overflow-y: scroll;
    overflow-x: hidden;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    flex-direction: column;
    padding-bottom: 20px;
    height: calc(100% - 155px);
    background: rgba(4, 34, 64, 0.98);

    .message-box {
      display: flex;
      flex-wrap: wrap;
      -webkit-box-orient: vertical;
      -webkit-box-direction: normal;
      flex-direction: column;

      .my-message {
        display: flex;
        -webkit-box-pack: end;
        align-items: flex-end;
        padding-right: 10px;
        padding-top: 10px;

        .message-content {
          -webkit-box-pack: start;
          justify-content: flex-start;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          flex-direction: column;
          -webkit-box-flex: 1;
          flex-grow: 1;
          display: flex;
          -webkit-box-align: end;
          align-items: flex-end;

          .message-text {
            padding: 6px 10px;
            line-height: 1.55;
            margin: 5px 0 5px 0;
            overflow-wrap: break-word;
            text-align: left;
            white-space: pre-wrap;
            border-radius: 15px 15px 0 15px;
            word-break: break-word;
            background: linear-gradient(180deg, #3fd2ff, #0e9ad8);
            color: #ffffff;

            p {
              margin: 5px 0 5px 0;
              font-size: 14px;
            }

            .message-name {
              font-weight: 700;
            }
          }

          .message-timestamp {
            padding: 2px 7px;
            border-radius: 15px;
            margin: 0;
            overflow-wrap: break-word;
            text-align: left;
            font-size: 10px;
            color: #6fb7e2;
            display: flex;
            -webkit-box-align: center;
            align-items: center;
            justify-content: flex-start;
          }
        }

        .message-icon {
          img {
            margin-left: 10px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
          }
        }
      }

      .ai-message {
        display: flex;
        -webkit-box-align: end;
        align-items: flex-end;
        padding-left: 10px;
        padding-top: 10px;

        .message-icon {
          img {
            margin-right: 10px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
          }
        }

        .message-content {
          display: flex;
          -webkit-box-align: start;
          align-items: flex-start;
          -webkit-box-pack: start;
          justify-content: flex-start;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          flex-direction: column;
          -webkit-box-flex: 1;
          flex-grow: 1;

          .message-text {
            padding: 6px 10px;
            line-height: 1.55;
            margin: 5px 0 5px 0;
            overflow-wrap: break-word;
            text-align: left;
            white-space: pre-wrap;
            border-radius: 15px 15px 15px 0;
            word-break: break-word;
            background: rgba(10, 60, 110, 0.9);
            color: #eaf7ff;

            p {
              margin: 5px 0 5px 0;
              font-size: 14px;
            }

            .message-name {
              font-weight: 700;
            }
          }

          .message-timestamp {
            padding: 2px 7px;
            border-radius: 15px;
            margin: 0;
            overflow-wrap: break-word;
            text-align: left;
            font-size: 10px;
            color: #6fb7e2;
            display: flex;
            -webkit-box-align: center;
            align-items: center;
            justify-content: flex-start;
          }
        }
      }
    }
  }

  .moon-bottom {
    gap: 5px;
    position: absolute;
    left: 0;
    bottom: 1px;
    height: 65px;
    width: 100%;
    background: rgba(6, 34, 66, 0.98);
    border-top: 1px solid rgba(0, 200, 255, 0.25);
    display: flex;
    -webkit-box-align: center;
    align-items: center;
    //padding: 0 5px 0 0;
    box-shadow: 0 -2px 24px rgba(0, 200, 255, 0.12);

    .message-input {
      padding: 0 10px 0 10px;
      -webkit-box-flex: 1;
      flex: 1;
      overflow: hidden;

      .input-box {
        width: 100%;
        resize: none;
        border: 1px solid rgba(63, 210, 255, 0.35);
        outline: none;
        box-sizing: border-box;
        font-size: 15px;
        font-weight: 400;
        line-height: 1.33;
        white-space: pre-wrap;
        word-wrap: break-word;
        color: #eaf7ff;
        -webkit-font-smoothing: antialiased;
        height: 50px;
        overflow: scroll;
        overflow-x: hidden;
        overflow-y: auto;
        text-align: left;
        cursor: text;
        display: inline-block;
        background-color: rgba(4, 34, 64, 0.97);
        border-radius: 6px;
        padding: 5px 8px;

        &:focus {
          border-color: #3fd2ff;
        }

        &:empty:before {
          content: attr(placeholder);
          color: #6fb7e2;
        }

        &:focus:before {
          content: none;
        }
      }
    }

    .sand-icon {
      width: 50px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #8fc6ea;
      text-decoration: none;
      font-size: 20px;
      cursor: pointer;
      opacity: .7;
      transition: .3s;
      border-radius: 11px;

      &:hover {
        background-color: rgba(14, 154, 216, 0.28);
        opacity: 1;
      }
    }
  }

  ::v-deep .el-button--primary {
    background: linear-gradient(180deg, #3fd2ff, #0e9ad8);
    border: none;

    &:hover, &:focus {
      background: linear-gradient(180deg, #5bdaff, #17a7e6);
    }
  }
}

.bubble-wrap {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: fit-content;
  max-width: 70%;
}

.bubble-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: 2px;
}

.bubble-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  opacity: 0.55;
  transition: opacity 0.2s;

  .ba-btn {
    cursor: pointer;
    font-size: 13px;
    color: #6fb7e2;

    &:hover {
      color: #3fd2ff;
    }
  }

  &:hover {
    opacity: 1;
  }
}

::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.06);
  /* 背景颜色 */
}

::-webkit-scrollbar-thumb {
  background: rgba(63, 210, 255, 0.35);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(63, 210, 255, 0.7);
}
</style>

<!--
  v-html 注入的 markdown 内容不带 scoped data-v 属性，scoped 样式命中不了，
  必须用非 scoped 块并以 .md-body 为命名空间，避免污染其他组件。
-->
<style lang="scss">
.md-body {
  white-space: normal;
  line-height: 1.55;

  p {
    margin: 6px 0;
  }

  strong, b {
    font-weight: 800;
    color: #ffd83d;
  }

  ul, ol {
    margin: 6px 0;
    padding-left: 18px;
  }

  li {
    margin: 3px 0;
  }

  h1, h2, h3, h4 {
    margin: 8px 0 4px;
    font-size: 14px;
  }

  code {
    background: rgba(0, 0, 0, 0.18);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 12px;
  }

  pre {
    background: rgba(0, 0, 0, 0.18);
    padding: 6px 8px;
    border-radius: 4px;
    overflow-x: auto;

    code {
      background: none;
      padding: 0;
    }
  }

  table {
    border-collapse: collapse;
    margin: 4px 0;
  }

  th, td {
    border: 1px solid rgba(255, 255, 255, 0.45);
    padding: 2px 6px;
  }

  a {
    color: #fff;
  }

  blockquote {
    margin: 4px 0;
    padding-left: 8px;
    border-left: 3px solid rgba(255, 255, 255, 0.5);
  }
}

.thinking {
  display: inline-flex;
  gap: 4px;
  padding: 6px 0;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    animation: moonDot 1.2s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }
}

@keyframes moonDot {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

<!--
  el-popover 开了 append-to-body，下拉面板挂在 <body> 下，scoped 样式命中不了，
  用 .chat-files-* 命名空间写在非 scoped 块里。
-->
<style lang="scss">
.chat-files-list {
  max-height: 220px;
  overflow-y: auto;
}

.chat-file-item {
  display: flex;
  margin: 0 0 4px;
}

.chat-files-empty {
  color: #909399;
  font-size: 12px;
  padding: 4px 0;
}

.chat-files-panel .el-button--primary {
  margin-top: 8px;
  float: right;
  background: linear-gradient(180deg, #3fd2ff, #0e9ad8);
  border: none;

  &:hover, &:focus {
    background: linear-gradient(180deg, #5bdaff, #17a7e6);
  }
}
</style>
