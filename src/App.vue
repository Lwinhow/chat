<template>
  <div id="app">
    <el-button type="primary" @click="dialogVisible = true">打开聊天</el-button>
    <moon-shot
        v-if="dialogVisible"
        @closeChat="dialogVisible=false"
    ></moon-shot>
  </div>
</template>

<script>
import moonShot from '@/views/moonShot.vue'

export default {
  name: 'App',
  components: {
    moonShot
  },
  data() {
    return {
      dialogVisible: false
    }
  }
}
</script>

<style>
#app {

}
</style>
