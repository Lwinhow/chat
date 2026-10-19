# MoonChat 通用 AI 聊天组件

基于 Vue 2 + Element UI 的对话式 AI 聊天面板。内置 DeepSeek（OpenAI 兼容）接口调用、markdown 渲染、对话日志保存/下载、气泡复制、请求中动画等能力；业务上下文（系统提示词、日志附加上下文）通过 props 由调用方注入，组件本身不耦合任何数据源。

## 文件结构

```
src/components/MoonChat/
├── index.vue   # 组件本体（name: MoonChat）
├── theme.js    # 默认主题（深蓝+青）与默认配置
└── README.md   # 本文档
```

## 特性

- AI 回复 markdown 渲染（markdown-it + DOMPurify 消毒防 XSS）
- 请求中 thinking 三点动画；失败信息以 assistant 消息形式入列
- 每条气泡可复制（clipboard API + execCommand 降级）
- 对话日志：服务端保存（`POST api/chat-log`）与按用户列出/下载（`api/chat-log/list|download`），可通过 prop 关闭
- 模型下拉、主题色、头像、时间戳格式均可配置，默认值见 `theme.js`
- 系统提示词与日志上下文由调用方注入，组件不依赖 `@/data/store` 等业务模块

## 快速开始

```vue
<template>
  <moon-chat
      v-if="visible"
      ai-name="DeepSeek"
      :ai-avatar="require('@/assets/deepseek.png')"
      my-name="User"
      :my-avatar="require('@/assets/touxiang.jpg')"
      @closeChat="visible = false"
  />
</template>

<script>
import MoonChat from '@/components/MoonChat/index.vue'

export default {
  components: {MoonChat},
  data() {
    return {visible: true}
  }
}
</script>
```

> 组件根元素为绝对定位面板（`position: absolute; top: 100px; left: 350px; 1000x600`），适合作为浮动弹层挂在页面任意位置。

## Props

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | String | `'Chat Title'` | 面板标题 |
| `placeholder` | String | `'send your message !'` | 输入框占位符 |
| `my-name` | String | `'User'` | 用户侧名称 |
| `ai-name` | String | `'AI'` | AI 侧名称 |
| `my-avatar` | String | `''` | 用户侧头像 URL，为空不渲染 |
| `ai-avatar` | String | `''` | AI 侧头像 URL，为空不渲染 |
| `models` | Array | DeepSeek 两档 | 下拉模型列表，元素 `{value, label}` |
| `default-model` | String | `models[0].value` | 默认选中模型 |
| `color-config` | Object | 见 theme.js | 主题色，按段整体覆盖默认值（浅合并） |
| `profile-config` | Object | 见 theme.js | `{ai, my, styles}` 头像显隐与样式 |
| `timestamp-config` | Object | 见 theme.js | `{format, show}` 时间戳格式与显隐 |
| `show-avatar` | Boolean | `true` | 头像总开关；`false` 时两侧头像都不渲染，可与 `profile-config` 的 `ai`/`my` 按侧开关叠加 |
| `show-name` | Boolean | `true` | 是否在气泡内展示发送者名称（用户/AI 及 thinking 占位） |
| `accept-image-types` | Array | png/jpg/jpeg | 图片按钮接受的 MIME 类型 |
| `max-history` | Number | `20` | 请求 AI 携带的历史消息上限（不含 system） |
| `build-system-prompt` | Function | `null` | `() => string`，返回值作为 `role=system` 消息插入请求最前；不传则不注入 |
| `chat-log-enabled` | Boolean | `true` | 是否启用对话日志；`false` 时隐藏存储开关与下载面板，并跳过上报 |
| `log-context` | Function | `null` | `() => object`，返回值合入日志上报体（如看板 version） |
| `username` | String | `''` | 日志归属用户名，空则记为 `anonymous` |

### 主题定制示例

`color-config` / `profile-config` / `timestamp-config` 均为"按段整体替换"的浅合并——传入某段即整体覆盖该段，未传的段沿用 `theme.js` 默认值：

```vue
<moon-chat
    :color-config="{
      message: {
        my:   {name: {color: '#fff'}, content: {background: '#409eff', color: '#fff'}},
        ai:   {name: {color: '#909399'}, content: {background: '#f4f4f5', color: '#303133'}}
      }
    }"
    :timestamp-config="{format: 'yyyy-MM-dd HH:mm', show: true}"
/>
```

> 注意：覆盖 `color-config.message` 时需同时给出 `my` 与 `ai` 两个子段。

### 隐藏头像与气泡内名称

```vue
<moon-chat :show-avatar="false" :show-name="false"/>
```

也可按侧控制头像：`:profile-config="{ai: true, my: false}"`（只显示 AI 头像）。

## Events

| 事件 | 载荷 | 触发时机 |
| --- | --- | --- |
| `closeChat` | 无 | 点击面板右上角关闭按钮 |
| `send` | 用户消息对象 `{role, content, timestamp}` | 用户消息入列后 |
| `receive` | AI 消息对象 `{role, content, timestamp}` | AI 回复入列后 |
| `error` | Error 对象 | 请求 AI 失败（失败文案已自动入列） |
| `clear` | 无 | 确认清空聊天记录后 |
| `file-selected` | File 对象 | 图片类型校验通过后（上传尚未实现） |

## 已知限制与注意事项

- **图片发送未实现**：`sendFile` 仅做类型校验并抛出 `file-selected` 事件，上传逻辑由调用方后续处理（组件内已留 TODO）。
- **API Key**：位于 `src/utils/api.js` 的 `API_KEY` 常量，当前为空占位；前端直连 DeepSeek 存在泄露风险，生产建议走后端代理。
- **对话日志依赖服务端**：需要服务端提供 `/api/chat-log`、`/api/chat-log/list`、`/api/chat-log/download` 三个端点（相对 `BASE_URL`）；无服务端时上报静默失败，不影响聊天。
- **markdown 注入**：AI 回复经 `v-html` 渲染，已用 DOMPurify 消毒；相关样式在非 scoped 块中以 `.md-body` 命名空间隔离。
- **组件定位**：默认样式含绝对定位坐标，嵌入文档流布局时请在调用处覆盖 `.moon-shot` 的定位样式。
