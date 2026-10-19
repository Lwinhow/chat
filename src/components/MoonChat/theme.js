/**
 * MoonChat 默认主题与默认配置。
 * props 传入的同名配置（color-config / profile-config / timestamp-config）按"段"整体覆盖默认值（浅合并）。
 */

/** 深蓝 + 青色主题 */
export const defaultColorConfig = {
  headBg: {
    background: 'rgba(4, 30, 58, 0.98)'
  },
  headTitle: {
    color: '#eaf7ff'
  },
  bodyBg: {
    background: 'rgba(4, 34, 64, 0.98)'
  },
  bottomBg: {
    background: 'rgba(6, 34, 66, 0.98)'
  },
  message: {
    my: {
      name: {
        color: '#ffffff'
      },
      content: {
        background: 'linear-gradient(180deg, #3fd2ff, #0e9ad8)',
        color: '#ffffff'
      }
    },
    ai: {
      name: {
        color: '#8fc6ea'
      },
      content: {
        background: 'rgba(10, 60, 110, 0.9)',
        color: '#eaf7ff'
      }
    }
  }
}

/** 头像显示开关与样式 */
export const defaultProfileConfig = {
  ai: true,
  my: true,
  styles: {
    width: '30px',
    height: '30px',
    borderRadius: '50%'
  }
}

/** 时间戳格式与显隐 */
export const defaultTimestampConfig = {
  format: 'MM/dd-HH:mm',
  show: true
}

/** 默认模型下拉（DeepSeek OpenAI 兼容接口） */
export const defaultModels = [
  {value: 'deepseek-v4-pro', label: 'deepseek-v4-pro'},
  {value: 'deepseek-flash', label: 'deepseek-flash'}
]

/** 可发送的图片类型 */
export const defaultAcceptImageTypes = ['image/png', 'image/jpg', 'image/jpeg']
