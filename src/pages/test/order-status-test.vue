<template>
  <view class="test-page">
    <view class="test-header">
      <text class="test-title">订单状态更新测试</text>
      <text class="test-desc">测试订单操作后的状态同步功能</text>
    </view>
    
    <!-- 缓存统计信息 -->
    <view class="cache-stats">
      <text class="stats-title">缓存统计</text>
      <view class="stats-item">
        <text>列表缓存数量: {{ cacheStats.listCount }}</text>
      </view>
      <view class="stats-item">
        <text>详情缓存数量: {{ cacheStats.detailCount }}</text>
      </view>
      <view class="stats-item">
        <text>缓存版本: {{ cacheStats.version }}</text>
      </view>
      <view class="stats-item">
        <text>是否过期: {{ cacheStats.isExpired ? '是' : '否' }}</text>
      </view>
    </view>
    
    <!-- 测试操作 -->
    <view class="test-actions">
      <text class="actions-title">测试操作</text>
      
      <button @click="testCancelOrder" class="test-btn cancel-btn">
        测试取消订单
      </button>
      
      <button @click="testConfirmOrder" class="test-btn confirm-btn">
        测试确认订单
      </button>
      
      <button @click="testPayOrder" class="test-btn pay-btn">
        测试支付订单
      </button>
      
      <button @click="clearCache" class="test-btn clear-btn">
        清空缓存
      </button>
      
      <button @click="goToOrderList" class="test-btn nav-btn">
        跳转订单列表
      </button>
    </view>
    
    <!-- 事件日志 -->
    <view class="event-logs">
      <text class="logs-title">事件日志</text>
      <view class="log-item" v-for="(log, index) in eventLogs" :key="index">
        <text class="log-time">{{ formatTime(log.timestamp) }}</text>
        <text class="log-content">{{ log.message }}</text>
      </view>
      
      <button @click="clearLogs" class="clear-logs-btn">清空日志</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  getCacheStats, 
  clearOrderCache, 
  orderCacheEvents,
  emitOrderStatusChanged 
} from '@/utils/orderCache'
import type { OrderStatus } from '@/api/order'

// 缓存统计信息
const cacheStats = ref(getCacheStats())

// 事件日志
interface EventLog {
  timestamp: number
  message: string
}

const eventLogs = ref<EventLog[]>([])

/**
 * 添加日志
 */
const addLog = (message: string) => {
  eventLogs.value.unshift({
    timestamp: Date.now(),
    message
  })
  
  // 限制日志数量
  if (eventLogs.value.length > 50) {
    eventLogs.value = eventLogs.value.slice(0, 50)
  }
}

/**
 * 格式化时间
 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 更新缓存统计
 */
const updateCacheStats = () => {
  cacheStats.value = getCacheStats()
}

/**
 * 测试取消订单
 */
const testCancelOrder = () => {
  const testOrderId = '1800000000000001002'
  addLog(`开始测试取消订单: ${testOrderId}`)
  
  // 模拟取消订单（从待支付状态取消）
  addLog(`订单 ${testOrderId} 已取消`)
  updateCacheStats()
  
  // 触发uni-app事件（取消订单）
  uni.$emit('orderStatusChanged', {
    orderId: testOrderId,
    newStatus: 'CANCELLED'
  })
}

/**
 * 测试确认订单
 */
const testConfirmOrder = () => {
  const testOrderId = '1800000000000001003'
  addLog(`开始测试确认订单: ${testOrderId}`)
  
  // 模拟订单状态变化：待取酒 -> 已完成
  emitOrderStatusChanged(testOrderId, 'COMPLETED' as OrderStatus, 'DISPENSING' as OrderStatus)
  
  addLog(`订单 ${testOrderId} 状态已更新为 COMPLETED`)
  updateCacheStats()
  
  // 触发uni-app事件
  uni.$emit('orderStatusChanged', {
    orderId: testOrderId,
    newStatus: 'COMPLETED'
  })
}

/**
 * 测试支付订单
 */
const testPayOrder = () => {
  const testOrderId = '1800000000000001001'
  addLog(`开始测试支付订单: ${testOrderId}`)
  
  // 模拟订单状态变化：待支付 -> 待取酒
  emitOrderStatusChanged(testOrderId, 'DISPENSING' as OrderStatus, 'PENDING' as OrderStatus)
  
  addLog(`订单 ${testOrderId} 状态已更新为 DISPENSING`)
  updateCacheStats()
  
  // 触发uni-app事件
  uni.$emit('orderStatusChanged', {
    orderId: testOrderId,
    newStatus: 'DISPENSING'
  })
}

/**
 * 清空缓存
 */
const clearCache = () => {
  clearOrderCache()
  updateCacheStats()
  addLog('所有订单缓存已清空')
}

/**
 * 清空日志
 */
const clearLogs = () => {
  eventLogs.value = []
  addLog('日志已清空')
}

/**
 * 跳转到订单列表
 */
const goToOrderList = () => {
  uni.navigateTo({
    url: '/pages/order/list'
  })
}

/**
 * 处理订单状态变化事件
 */
const handleOrderStatusChanged = (eventData: any) => {
  addLog(`接收到订单状态变化事件: ${eventData.orderId} -> ${eventData.newStatus}`)
  updateCacheStats()
}

// 页面生命周期
onMounted(() => {
  addLog('订单状态测试页面已加载')
  updateCacheStats()
  
  // 监听订单状态变化事件
  orderCacheEvents.on('orderStatusChanged', handleOrderStatusChanged)
  
  // 定时更新缓存统计
  const timer = setInterval(updateCacheStats, 2000)
  
  // 页面卸载时清理定时器
  onUnmounted(() => {
    clearInterval(timer)
    orderCacheEvents.off('orderStatusChanged', handleOrderStatusChanged)
  })
})
</script>

<style lang="scss" scoped>
.test-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.test-header {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  text-align: center;
  
  .test-title {
    display: block;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
  }
  
  .test-desc {
    font-size: 26rpx;
    color: #666;
  }
}

.cache-stats {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .stats-title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .stats-item {
    padding: 10rpx 0;
    font-size: 26rpx;
    color: #666;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
}

.test-actions {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .actions-title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .test-btn {
    width: 100%;
    padding: 20rpx;
    margin-bottom: 15rpx;
    border-radius: 15rpx;
    font-size: 26rpx;
    border: none;
    
    &.cancel-btn {
      background: #ff4757;
      color: white;
    }
    
    &.confirm-btn {
      background: #2ed573;
      color: white;
    }
    
    &.pay-btn {
      background: #007aff;
      color: white;
    }
    
    &.clear-btn {
      background: #ffa502;
      color: white;
    }
    
    &.nav-btn {
      background: #5352ed;
      color: white;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.event-logs {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  
  .logs-title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .log-item {
    padding: 15rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
    
    .log-time {
      display: inline-block;
      width: 120rpx;
      font-size: 22rpx;
      color: #999;
    }
    
    .log-content {
      font-size: 24rpx;
      color: #666;
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .clear-logs-btn {
    width: 100%;
    padding: 15rpx;
    margin-top: 20rpx;
    background: #ddd;
    color: #666;
    border: none;
    border-radius: 10rpx;
    font-size: 24rpx;
  }
}
</style> 