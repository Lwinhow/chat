<template>
  <div id="app">
    <el-button type="primary" @click="dialogVisible = true">打开聊天</el-button>
    <moon-chat
        v-if="dialogVisible"
        ai-name="DeepSeek"
        :ai-avatar="aiAvatar"
        my-name="User"
        :my-avatar="myAvatar"
        :username="username"
        :build-system-prompt="buildSystemPrompt"
        :log-context="logContext"
        @closeChat="dialogVisible = false"
    />
  </div>
</template>

<script>
import MoonChat from '@/components/MoonChat/index.vue'
import {db, rawDoc} from '@/data/store'
import {currentUser} from '@/utils/auth'

export default {
  name: 'App',
  components: {
    MoonChat
  },
  data() {
    return {
      dialogVisible: false,
      aiAvatar: require('@/assets/deepseek.png'),
      myAvatar: require('@/assets/touxiang.jpg'),
      username: currentUser()
    }
  },
  methods: {
    /**
     * 系统提示词：角色设定 + 版本清单 + 当前看板全量数据。
     * 每次发消息都重新构建 —— 数据随版本切换/上传自动保持最新。
     */
    buildSystemPrompt() {
      const doc = rawDoc()
      const versions = (db.versions || [])
          .map(v => `${v.id} (${v.label || '-'})`)
          .join('; ')
      return [
        'You are the AI assistant embedded in the DE152 DART project command dashboard.',
        'Answer questions about this construction project strictly based on the dashboard data provided below.',
        'The project is located in Singapore. References shall be subject to local laws, regulations, work codes and requirements.',
        'If something is not in the data, say you cannot find it instead of guessing.',
        `Current dashboard version: ${doc.meta && doc.meta.version || '-'} (${doc.meta && doc.meta.label || '-'})`,
        `Other versions available on the server: ${versions || 'none'} — their data is NOT loaded; tell the user to switch versions in the top bar to inspect them.`,
        'Reply concisely in the same language the user writes in.',
        '--- DASHBOARD DATA (JSON) ---',
        JSON.stringify(doc)
      ].join('\n')
    },
    /** 日志附加字段：当前看板版本号 */
    logContext() {
      const doc = rawDoc()
      return {version: doc.meta && doc.meta.version}
    }
  }
}
</script>

<style>
#app {

}
</style>
