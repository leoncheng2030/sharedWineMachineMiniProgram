<template>
  <view class="payment-success-page">
    <!-- 支付成功状态 -->
    <view class="success-header">
      <view class="success-icon">
        <up-icon name="checkmark-circle" size="80" color="#52c41a"></up-icon>
      </view>
      <text class="success-title">支付成功</text>
      <text class="success-desc">支付完成，请点击下方按钮控制设备出酒</text>
    </view>

    <!-- 订单信息卡片 -->
    <view class="order-info-card" v-if="orderInfo.id">
      <view class="card-header">
        <up-icon name="file-text" size="20" color="#007aff"></up-icon>
        <text class="card-title">订单信息</text>
      </view>
      <view class="order-details">
        <view class="detail-row">
          <text class="detail-label">订单号：</text>
          <text class="detail-value">{{ orderInfo.orderNo }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">商品：</text>
          <text class="detail-value">{{ orderInfo.wineName }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">出酒量：</text>
          <text class="detail-value">{{ formatWineAmount(orderInfo.amount) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">支付金额：</text>
          <text class="detail-value price">¥{{ orderInfo.totalAmount.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <!-- 设备控制状态 -->
    <view class="control-status-card">
      <view class="card-header">
        <up-icon name="setting" size="20" color="#007aff"></up-icon>
        <text class="card-title">设备控制状态</text>
      </view>
      <view class="control-steps">
        <view class="step-item" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
          <view class="step-icon">
            <up-icon v-if="currentStep > 1" name="checkmark" size="16" color="white"></up-icon>
            <text v-else>1</text>
          </view>
          <text class="step-text">验证支付</text>
          <view class="step-line" :class="{ completed: currentStep > 1 }"></view>
        </view>
        <view class="step-item" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
          <view class="step-icon">
            <up-icon v-if="currentStep > 2" name="checkmark" size="16" color="white"></up-icon>
            <text v-else>2</text>
          </view>
          <text class="step-text">检查蓝牙</text>
          <view class="step-line" :class="{ completed: currentStep > 2 }"></view>
        </view>
        <view class="step-item" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
          <view class="step-icon">
            <up-icon v-if="currentStep > 3" name="checkmark" size="16" color="white"></up-icon>
            <text v-else>3</text>
          </view>
          <text class="step-text">检查设备</text>
          <view class="step-line" :class="{ completed: currentStep > 3 }"></view>
        </view>
        <view class="step-item" :class="{ active: currentStep >= 4, completed: currentStep > 4 }">
          <view class="step-icon">
            <up-icon v-if="currentStep > 4" name="checkmark" size="16" color="white"></up-icon>
            <text v-else>4</text>
          </view>
          <text class="step-text">获取指令</text>
          <view class="step-line" :class="{ completed: currentStep > 4 }"></view>
        </view>
        <view class="step-item" :class="{ active: currentStep >= 5, completed: currentStep > 5 }">
          <view class="step-icon">
            <up-icon v-if="currentStep > 5" name="checkmark" size="16" color="white"></up-icon>
            <text v-else>5</text>
          </view>
          <text class="step-text">控制出酒</text>
        </view>
      </view>
      
      <!-- 当前状态提示 -->
      <view class="current-status">
        <up-loading-icon v-if="currentStep > 0 && !controlCompleted && !controlError" mode="circle" size="20"></up-loading-icon>
        <up-icon v-else-if="controlCompleted" name="checkmark-circle" size="20" color="#52c41a"></up-icon>
        <up-icon v-else-if="controlError" name="close-circle" size="20" color="#ff4757"></up-icon>
        <up-icon v-else name="play-circle" size="20" color="#007aff"></up-icon>
        <text class="status-text">{{ currentStatusText }}</text>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="bottom-actions">
      <!-- 开始控制按钮 -->
      <button 
        v-if="!controlCompleted && !controlError && currentStep === 0" 
        class="action-btn primary" 
        @click="startDeviceControl"
        :disabled="actionLoading"
      >
        {{ actionLoading ? '控制中...' : '开始出酒' }}
      </button>
      
      <!-- 重试控制按钮 -->
      <button 
        v-if="controlError" 
        class="action-btn secondary" 
        @click="retryControl"
        :disabled="actionLoading"
      >
        {{ actionLoading ? '重试中...' : '重试控制' }}
      </button>
      
      <!-- 确认取酒按钮 -->
      <button 
        v-if="controlCompleted" 
        class="action-btn primary" 
        @click="confirmOrder"
        :disabled="actionLoading"
      >
        {{ actionLoading ? '处理中...' : '确认取酒' }}
      </button>
      
      <!-- 联系客服按钮 -->
      <button 
        v-if="controlError" 
        class="action-btn secondary" 
        @click="contactService"
      >
        联系客服
      </button>
      
      <!-- 查看订单按钮 -->
      <button 
        class="action-btn secondary" 
        @click="viewOrderDetail"
      >
        查看订单
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { 
  OrderApi, 
  OrderDetail, 
  OrderStatus,
  formatWineAmount
} from '@/api/order'
import { paymentApi } from '@/api/payment'
import { useAuthStore } from '@/store/modules/auth'
import { deviceControlApi } from '@/api/deviceControl'
import { checkBluetooth, checkDeviceOnline, writeChargeData } from '@/utils/ble'

// 响应式数据
const orderNo = ref('')
const orderInfo = ref<OrderDetail>({} as OrderDetail)
const loading = ref(false)
const actionLoading = ref(false)
const currentStep = ref(0)
const controlCompleted = ref(false)
const controlError = ref(false)
const controlErrorMessage = ref('')

// 使用认证store
const authStore = useAuthStore()

// 计算属性
const currentStatusText = computed(() => {
  if (controlCompleted.value) {
    return '设备控制成功，请取酒'
  }
  if (controlError.value) {
    return '设备控制失败'
  }
  
  const statusMap: Record<number, string> = {
    0: '等待用户开始控制设备',
    1: '验证支付结果...',
    2: '检查蓝牙状态...',
    3: '检查设备状态...',
    4: '获取控制指令...',
    5: '控制设备出酒...'
  }
  return statusMap[currentStep.value] || '处理中...'
})

// 页面加载
onLoad(async (options) => {
  const orderNoParam = options?.orderNo
  
  if (orderNoParam) {
    orderNo.value = orderNoParam
    await loadOrderInfo()
    // 移除自动执行设备控制，改为手动触发
    console.log('📱 支付成功页面加载完成，等待用户手动开始设备控制')
  } else {
    uni.showToast({
      title: '缺少订单参数',
      icon: 'error'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 2000)
  }
})

onMounted(() => {
  uni.setNavigationBarTitle({
    title: '支付成功'
  })
})

// 加载订单信息
const loadOrderInfo = async () => {
  try {
    loading.value = true
    const result = await OrderApi.getOrderByOrderNo(orderNo.value)
    orderInfo.value = result
  } catch (error: any) {
    console.error('加载订单信息失败:', error)
    uni.showToast({
      title: '加载订单信息失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 开始设备控制流程
const startDeviceControl = async () => {
  try {
    console.log('🚀 用户手动开始设备控制流程')
    actionLoading.value = true
    controlError.value = false
    controlErrorMessage.value = ''
    currentStep.value = 1
    
    // 1. 验证支付结果
    await verifyPaymentResult()
    currentStep.value = 2
    
    // 2. 检查蓝牙状态
    await checkBluetoothStatus()
    currentStep.value = 3
    
    // 3. 检查设备在线状态
    await checkDeviceOnlineStatus()
    currentStep.value = 4
    
    // 4. 获取控制指令
    await getControlCommand()
    currentStep.value = 5
    
    // 5. 控制设备出酒
    await controlDevice()
    
    // 控制完成
    controlCompleted.value = true
    currentStep.value = 6
    
    uni.showToast({
      title: '设备控制成功，请取酒',
      icon: 'success',
      duration: 3000
    })
    
  } catch (error: any) {
    console.error('设备控制流程失败:', error)
    controlError.value = true
    controlErrorMessage.value = error.message || '设备控制失败'
    
    uni.showToast({
      title: error.message || '设备控制失败',
      icon: 'error',
      duration: 3000
    })
  } finally {
    actionLoading.value = false
  }
}

// 验证支付结果
const verifyPaymentResult = async () => {
  try {
    console.log('🔍 验证支付结果...')
    
    // 使用积极的轮询策略验证支付结果
    const payResultQuery = await paymentApi.pollPaymentResult(orderNo.value, 10, 1000)
    
    if (payResultQuery.tradeState !== 'SUCCESS') {
      throw new Error('支付结果验证失败')
    }
    
    // 重新加载订单信息获取最新状态
    await loadOrderInfo()
    
    if (orderInfo.value.status !== OrderStatus.DISPENSING) {
      throw new Error('订单状态异常，无法控制设备')
    }
    
    console.log('✅ 支付结果验证成功')
    
  } catch (error: any) {
    console.error('❌ 支付结果验证失败:', error)
    throw new Error('支付结果验证失败，请稍后重试')
  }
}

// 检查蓝牙状态
const checkBluetoothStatus = async () => {
  try {
    console.log('📱 检查蓝牙状态...')
    
    const bluetoothAvailable = await checkBluetooth()
    
    if (!bluetoothAvailable) {
      throw new Error('蓝牙未开启，请开启蓝牙后重试')
    }
    
    console.log('✅ 蓝牙状态检查成功')
    
  } catch (error: any) {
    console.error('❌ 蓝牙状态检查失败:', error)
    throw new Error('蓝牙状态检查失败，请确保蓝牙已开启')
  }
}

// 检查设备在线状态
const checkDeviceOnlineStatus = async () => {
  try {
    console.log('🔍 检查设备在线状态...')
    
    const deviceOnline = await checkDeviceOnline(parseInt(orderInfo.value.deviceCode || ''))
    
    if (!deviceOnline) {
      throw new Error('设备当前不在线，请确保设备正常工作并靠近设备')
    }
    
    console.log('✅ 设备在线状态检查成功')
    
  } catch (error: any) {
    console.error('❌ 设备在线状态检查失败:', error)
    throw new Error('设备在线状态检查失败，请确保设备正常工作并靠近设备')
  }
}

// 获取控制指令
const getControlCommand = async () => {
  try {
    console.log('📡 获取设备控制指令...',orderInfo.value)

    if (!orderInfo.value?.deviceCode) {
      throw new Error('设备编码为空')
    }

    // 构建设备控制参数
    const controlParam = {
      deviceCode: orderInfo.value.deviceCode,
      chargeId: orderInfo.value.orderNo,
      minute: Math.floor(orderInfo.value.amount / 100),
      second: Math.floor((orderInfo.value.amount % 100) * 0.6),
      userId: authStore.userId,
      quantity: orderInfo.value.amount,
      startTime: new Date(orderInfo.value.payTime || orderInfo.value.createTime).getTime(),
      validSecond: 300,
      overlap: 1
    }
    
    console.log('📊 设备控制参数:', controlParam)
    
    // 调用设备控制API获取控制指令
    const controlResult = await deviceControlApi.getControlCommand(controlParam)
    
    if (!controlResult.success || !controlResult.cmd) {
      throw new Error(controlResult.message || '获取控制指令失败')
    }
    
    console.log('✅ 获取控制指令成功', controlResult.cmd)
    
    // 存储控制指令供后续使用
    orderInfo.value.controlCmd = controlResult.cmd
    
  } catch (error: any) {
    console.error('❌ 获取控制指令失败:', error)
    throw new Error('获取控制指令失败，请重试')
  }
}

// 控制设备出酒
const controlDevice = async () => {
  try {
    console.log('📡 控制设备出酒...', orderInfo.value)
    
    if (!orderInfo.value.controlCmd) {
      throw new Error('控制指令为空')
    }
    
    // 通过蓝牙发送控制指令
    await writeChargeData(parseInt(orderInfo.value?.deviceCode || ''), orderInfo.value.controlCmd)
    
    console.log('✅ 设备控制成功')
    
  } catch (error: any) {
    console.error('❌ 设备控制失败:', error)
    throw new Error(error.message || '设备控制失败')
  }
}

// 重试控制
const retryControl = async () => {
  console.log('🔄 用户手动重试设备控制')
  await startDeviceControl()
}

// 确认取酒
const confirmOrder = async () => {
  try {
    actionLoading.value = true
    
    await OrderApi.confirmOrder(orderInfo.value.id)
    
    uni.showToast({
      title: '取酒成功',
      icon: 'success'
    })
    
    // 通知列表页面刷新数据
    uni.$emit('orderStatusChanged', {
      orderId: orderInfo.value.id,
      newStatus: 'COMPLETED'
    })
    
    // 跳转到订单详情页
    setTimeout(() => {
      uni.redirectTo({
        url: `/pages/order/detail?orderId=${orderInfo.value.id}`
      })
    }, 1500)
    
  } catch (error: any) {
    console.error('确认取酒失败:', error)
    uni.showToast({
      title: error.message || '确认失败',
      icon: 'error'
    })
  } finally {
    actionLoading.value = false
  }
}

// 联系客服
const contactService = () => {
  uni.showModal({
    title: '联系客服',
    content: '客服电话：400-xxx-xxxx\n工作时间：9:00-18:00',
    showCancel: true,
    cancelText: '取消',
    confirmText: '拨打电话',
    success: (res) => {
      if (res.confirm) {
        uni.makePhoneCall({
          phoneNumber: '400-xxx-xxxx'
        })
      }
    }
  })
}

// 查看订单详情
const viewOrderDetail = () => {
  uni.redirectTo({
    url: `/pages/order/detail?orderId=${orderInfo.value.id}`
  })
}
</script>

<style lang="scss" scoped>
.payment-success-page {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 120rpx;
}

.success-header {
  background: white;
  padding: 60rpx 40rpx;
  text-align: center;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .success-icon {
    margin-bottom: 30rpx;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .success-title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 16rpx;
    text-align: center;
  }
  
  .success-desc {
    font-size: 28rpx;
    color: #666;
    text-align: center;
  }
}

.order-info-card,
.control-status-card {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .card-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
}

.control-steps {
  padding: 30rpx 20rpx;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  
  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    flex: 1;
    min-width: 0;
    
    .step-icon {
      width: 50rpx;
      height: 50rpx;
      border-radius: 50%;
      background: #e9ecef;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
      margin-bottom: 12rpx;
      flex-shrink: 0;
      z-index: 2;
      transition: all 0.3s ease;
      border: 2rpx solid transparent;
    }
    
    .step-text {
      font-size: 24rpx;
      color: #666;
      text-align: center;
      transition: all 0.3s ease;
      min-height: 34rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .step-line {
      position: absolute;
      top: 25rpx;
      left: calc(50% + 25rpx);
      width: calc(100% - 25rpx);
      height: 2rpx;
      background: #e9ecef;
      z-index: 1;
      transition: background-color 0.3s ease;
      
      &.completed {
        background: #52c41a;
      }
    }
    
    &:last-child {
      .step-line {
        display: none;
      }
    }
    
    &.active {
      .step-icon {
        background: #007aff;
        color: white;
        border-color: #007aff;
        transform: scale(1.1);
      }
      
      .step-text {
        color: #007aff;
        font-weight: bold;
      }
    }
    
    &.completed {
      .step-icon {
        background: #52c41a;
        color: white;
        border-color: #52c41a;
      }
      
      .step-text {
        color: #52c41a;
        font-weight: 500;
      }
    }
  }
}

.current-status {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 30rpx;
  background: #f8f9fa;
  border-top: 1rpx solid #f0f0f0;
  
  .status-text {
    font-size: 28rpx;
    color: #333;
  }
}

.order-details {
  padding: 30rpx;
  
  .detail-row {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .detail-label {
      font-size: 28rpx;
      color: #666;
      width: 160rpx;
      flex-shrink: 0;
    }
    
    .detail-value {
      font-size: 28rpx;
      color: #333;
      flex: 1;
      
      &.price {
        color: #ff4757;
        font-weight: bold;
      }
    }
  }
}





.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  gap: 20rpx;
  
  .action-btn {
    flex: 1;
    padding: 24rpx;
    border: none;
    border-radius: 30rpx;
    font-size: 28rpx;
    font-weight: bold;
    
    &.primary {
      background: #007aff;
      color: white;
      
      &:disabled {
        background: #cccccc;
      }
    }
    
    &.secondary {
      background: #f8f9fa;
      color: #666;
      border: 1rpx solid #e9ecef;
      
      &:disabled {
        background: #f5f5f5;
        color: #cccccc;
      }
    }
  }
}
</style> 