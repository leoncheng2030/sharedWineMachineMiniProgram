<template>
  <up-empty 
    :mode="mode"
    :icon="icon"
    :text="text"
    :textColor="textColor"
    :textSize="textSize"
    :iconSize="iconSize"
    :width="width"
    :height="height"
    :marginTop="marginTop"
    :marginBottom="marginBottom"
    iconColor="#ddd"
  ></up-empty>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon?: string
  text?: string
  textColor?: string
  textSize?: string | number
  iconSize?: string | number
  width?: string | number
  height?: string | number
  marginTop?: string | number
  marginBottom?: string | number
  type?: 'transaction' | 'order' | 'device' | 'message' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  textColor: '#999',
  textSize: 12,
  iconSize: 45,
  width: 45,
  height: 45,
  marginTop: 80,
  marginBottom: 40,
  type: 'default'
})

// 根据类型设置默认模式
const mode = computed(() => {
  switch (props.type) {
    case 'transaction':
      return 'data'
    case 'order':
      return 'order'
    case 'device':
      return 'data'
    case 'message':
      return 'message'
    default:
      return 'data'
  }
})

// 根据类型设置默认文本
const text = computed(() => {
  if (props.text) return props.text
  
  switch (props.type) {
    case 'transaction':
      return '暂无交易记录'
    case 'order':
      return '暂无订单记录'
    case 'device':
      return '暂无设备信息'
    case 'message':
      return '暂无消息'
    default:
      return '暂无数据'
  }
})

// 根据类型设置默认图标（如果需要自定义图标）
const icon = computed(() => {
  if (props.icon) return props.icon
  // 使用uView Plus内置的mode，不需要自定义图标
  return undefined
})
</script>

<style lang="scss" scoped>
/* 可以在这里添加自定义样式 */
</style> 