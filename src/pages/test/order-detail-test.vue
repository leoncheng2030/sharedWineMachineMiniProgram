<template>
  <view class="test-page">
    <view class="test-header">
      <text class="test-title">订单详情接口测试</text>
    </view>

    <view class="test-section">
      <text class="section-title">测试参数</text>
      <view class="input-group">
        <text class="input-label">订单ID:</text>
        <input 
          v-model="testOrderId" 
          placeholder="请输入测试订单ID" 
          class="test-input"
        />
      </view>
      <view class="input-group">
        <text class="input-label">订单号:</text>
        <input 
          v-model="testOrderNo" 
          placeholder="请输入测试订单号" 
          class="test-input"
        />
      </view>
    </view>

    <view class="test-buttons">
      <button 
        class="test-btn primary" 
        @click="testGetOrderDetail"
        :disabled="loading"
      >
        {{ loading ? '测试中...' : '测试订单详情(ID)' }}
      </button>
      <button 
        class="test-btn secondary" 
        @click="testGetOrderByOrderNo"
        :disabled="loading"
      >
        {{ loading ? '测试中...' : '测试订单详情(订单号)' }}
      </button>
      <button 
        class="test-btn info" 
        @click="testOrderList"
        :disabled="loading"
      >
        {{ loading ? '测试中...' : '测试订单列表' }}
      </button>
    </view>

    <view class="test-results">
      <text class="section-title">测试结果</text>
      <view class="result-box">
        <text class="result-text">{{ resultText }}</text>
      </view>
    </view>

    <view class="test-logs">
      <text class="section-title">请求日志</text>
      <view class="log-box">
        <text 
          v-for="(log, index) in logs" 
          :key="index" 
          class="log-item"
          :class="log.type"
        >
          {{ log.message }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { OrderApi } from '@/api/order'

// 响应式数据
const testOrderId = ref('1234567890')
const testOrderNo = ref('WO202501301234567890')
const loading = ref(false)
const resultText = ref('等待测试...')
const logs = ref<Array<{type: string, message: string}>>([])

// 添加日志
const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.unshift({
    type,
    message: `[${timestamp}] ${message}`
  })
  
  // 保持日志数量在合理范围内
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// 测试通过订单ID获取详情
const testGetOrderDetail = async () => {
  if (!testOrderId.value.trim()) {
    uni.showToast({
      title: '请输入订单ID',
      icon: 'none'
    })
    return
  }

  try {
    loading.value = true
    resultText.value = '正在测试订单详情接口...'
    
    addLog(`开始测试: 通过订单ID获取详情 (${testOrderId.value})`)
    addLog(`请求URL: GET /miniprogram/order/detail/${testOrderId.value}`)
    
    const result = await OrderApi.getOrderDetail(testOrderId.value)
    
    addLog('✅ 接口调用成功', 'success')
    addLog(`响应数据: ${JSON.stringify(result, null, 2)}`, 'success')
    
    resultText.value = `✅ 成功获取订单详情!\n订单号: ${result.orderNo || '未知'}\n状态: ${result.status || '未知'}\n金额: ¥${result.totalAmount || 0}`
    
    uni.showToast({
      title: '测试成功',
      icon: 'success'
    })
    
  } catch (error: any) {
    addLog(`❌ 接口调用失败: ${error.message}`, 'error')
    resultText.value = `❌ 测试失败: ${error.message}`
    
    uni.showToast({
      title: '测试失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 测试通过订单号获取详情
const testGetOrderByOrderNo = async () => {
  if (!testOrderNo.value.trim()) {
    uni.showToast({
      title: '请输入订单号',
      icon: 'none'
    })
    return
  }

  try {
    loading.value = true
    resultText.value = '正在测试订单号查询接口...'
    
    addLog(`开始测试: 通过订单号获取详情 (${testOrderNo.value})`)
    addLog(`请求URL: GET /miniprogram/order/orderNo/${testOrderNo.value}`)
    
    const result = await OrderApi.getOrderByOrderNo(testOrderNo.value)
    
    addLog('✅ 接口调用成功', 'success')
    addLog(`响应数据: ${JSON.stringify(result, null, 2)}`, 'success')
    
    resultText.value = `✅ 成功获取订单详情!\n订单号: ${result.orderNo || '未知'}\n状态: ${result.status || '未知'}\n金额: ¥${result.totalAmount || 0}`
    
    uni.showToast({
      title: '测试成功',
      icon: 'success'
    })
    
  } catch (error: any) {
    addLog(`❌ 接口调用失败: ${error.message}`, 'error')
    resultText.value = `❌ 测试失败: ${error.message}`
    
    uni.showToast({
      title: '测试失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 测试订单列表
const testOrderList = async () => {
  try {
    loading.value = true
    resultText.value = '正在测试订单列表接口...'
    
    addLog('开始测试: 获取订单列表')
    addLog('请求URL: GET /miniprogram/order/page?pageNum=1&pageSize=10')
    
    const result = await OrderApi.getOrderPage({
      pageNum: 1,
      pageSize: 10
    })
    
    addLog('✅ 接口调用成功', 'success')
    addLog(`响应数据: ${JSON.stringify(result, null, 2)}`, 'success')
    
    resultText.value = `✅ 成功获取订单列表!\n总数: ${result.total || 0}\n当前页: ${result.current || 1}\n每页: ${result.size || 10}`
    
    uni.showToast({
      title: '测试成功',
      icon: 'success'
    })
    
  } catch (error: any) {
    addLog(`❌ 接口调用失败: ${error.message}`, 'error')
    resultText.value = `❌ 测试失败: ${error.message}`
    
    uni.showToast({
      title: '测试失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 页面初始化
uni.setNavigationBarTitle({
  title: '订单接口测试'
})

addLog('测试页面已加载，可以开始测试')
</script>

<style lang="scss" scoped>
.test-page {
  padding: 20rpx;
  background: #f8f8f8;
  min-height: 100vh;
}

.test-header {
  text-align: center;
  padding: 30rpx 0;
  
  .test-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.test-section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .input-group {
    margin-bottom: 20rpx;
    
    .input-label {
      font-size: 28rpx;
      color: #666;
      display: block;
      margin-bottom: 10rpx;
    }
    
    .test-input {
      width: 100%;
      padding: 20rpx;
      border: 2rpx solid #e0e0e0;
      border-radius: 10rpx;
      font-size: 28rpx;
      background: #fafafa;
      
      &:focus {
        border-color: #007aff;
        background: white;
      }
    }
  }
}

.test-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 20rpx;
  
  .test-btn {
    padding: 30rpx;
    border-radius: 15rpx;
    font-size: 32rpx;
    font-weight: bold;
    border: none;
    
    &.primary {
      background: #007aff;
      color: white;
    }
    
    &.secondary {
      background: #34c759;
      color: white;
    }
    
    &.info {
      background: #ff9500;
      color: white;
    }
    
    &:disabled {
      opacity: 0.6;
    }
  }
}

.test-results {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .result-box {
    background: #f0f0f0;
    border-radius: 10rpx;
    padding: 20rpx;
    min-height: 120rpx;
    
    .result-text {
      font-size: 28rpx;
      color: #333;
      line-height: 1.6;
      white-space: pre-wrap;
    }
  }
}

.test-logs {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .log-box {
    background: #1a1a1a;
    border-radius: 10rpx;
    padding: 20rpx;
    max-height: 600rpx;
    overflow-y: auto;
    
    .log-item {
      font-size: 24rpx;
      line-height: 1.5;
      display: block;
      margin-bottom: 8rpx;
      font-family: monospace;
      
      &.info {
        color: #ffffff;
      }
      
      &.success {
        color: #52c41a;
      }
      
      &.error {
        color: #ff4d4f;
      }
    }
  }
}
</style> 