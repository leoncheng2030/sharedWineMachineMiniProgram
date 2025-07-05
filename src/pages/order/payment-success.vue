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
          <text class="step-text">检查蓝牙</text>
          <view class="step-line" :class="{ completed: currentStep > 1 }"></view>
        </view>
        <view class="step-item" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
          <view class="step-icon">
            <up-icon v-if="currentStep > 2" name="checkmark" size="16" color="white"></up-icon>
            <text v-else>2</text>
          </view>
          <text class="step-text">检查设备</text>
          <view class="step-line" :class="{ completed: currentStep > 2 }"></view>
        </view>
        <view class="step-item" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
          <view class="step-icon">
            <up-icon v-if="currentStep > 3" name="checkmark" size="16" color="white"></up-icon>
            <text v-else>3</text>
          </view>
          <text class="step-text">获取指令</text>
          <view class="step-line" :class="{ completed: currentStep > 3 }"></view>
        </view>
        <view class="step-item" :class="{ active: currentStep >= 4, completed: currentStep > 4 }">
          <view class="step-icon">
            <up-icon v-if="currentStep > 4" name="checkmark" size="16" color="white"></up-icon>
            <text v-else>4</text>
          </view>
          <text class="step-text">控制出酒</text>
          <view class="step-line" :class="{ completed: currentStep > 4 }"></view>
        </view>
        <view class="step-item" :class="{ active: currentStep >= 5, completed: currentStep > 5 }">
          <view class="step-icon">
            <up-icon v-if="currentStep > 5" name="checkmark" size="16" color="white"></up-icon>
            <text v-else>5</text>
          </view>
          <text class="step-text">出酒完成</text>
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
      
      <!-- 设备状态监听信息 -->
      <view v-if="isMonitoringDevice && deviceStatus" class="device-status-info">
        <view class="status-header">
          <up-icon name="wifi" size="16" :color="deviceStatus.isOnline ? '#52c41a' : '#ff4757'"></up-icon>
          <text class="status-label">设备状态监听中</text>
        </view>
        <view v-if="deviceStatus.isOnline && deviceStatus.status" class="status-detail">
          <text class="status-value">{{ deviceStatus.status.text }}</text>
          <text v-if="deviceStatus.remainInfo?.timeDisplay && deviceStatus.remainInfo.timeDisplay !== '无'" 
                class="status-extra">剩余: {{ deviceStatus.remainInfo.timeDisplay }}</text>
        </view>
        <view v-else class="status-detail">
          <text class="status-value offline">{{ deviceStatus.errorInfo?.errorMessage || '设备离线' }}</text>
          <text v-if="deviceOfflineCount > 0" class="status-hint">
            继续监听中，设备可能正在工作...
          </text>
        </view>
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
      
      <!-- 出酒完成提示 -->
      <view v-if="controlCompleted && !actionLoading && !autoConfirmFailed" class="completion-notice">
        <up-icon name="checkmark-circle" size="24" color="#52c41a"></up-icon>
        <text class="completion-text">出酒已完成，订单自动确认中...</text>
      </view>
      
      <!-- 手动确认按钮（自动确认失败时显示） -->
      <button 
        v-if="controlCompleted && autoConfirmFailed" 
        class="action-btn primary" 
        @click="confirmOrder"
        :disabled="actionLoading"
      >
        {{ actionLoading ? '确认中...' : '手动确认取酒' }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
import { 
  checkBluetooth, 
  checkDeviceOnline, 
  writeChargeData,
  startDeviceHeartbeat,
  stopDeviceHeartbeat,
  checkDetailedDeviceStatus,
  checkDetailedDeviceStatusSilent,
  type DetailedDeviceStatus
} from '@/utils/ble'

// 响应式数据
const orderNo = ref('')
const orderInfo = ref<OrderDetail>({} as OrderDetail)
const loading = ref(false)
const actionLoading = ref(false)
const currentStep = ref(0)
const controlCompleted = ref(false)
const controlError = ref(false)
const controlErrorMessage = ref('')
const autoConfirmFailed = ref(false) // 自动确认失败标记
const deviceStatus = ref<DetailedDeviceStatus | null>(null)
const isMonitoringDevice = ref(false)
const deviceOfflineCount = ref(0) // 设备离线次数计数
const maxOfflineCount = 30 // 最大离线次数（5分钟，每10秒检查一次）
const deviceIdleCount = ref(0) // 设备空闲计数（通电停止状态）
const maxIdleCount = 20 // 最多空闲20次(1分钟)后提示重试

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
    1: '检查蓝牙状态...',
    2: '检查设备状态...',
    3: '获取控制指令...',
    4: '控制设备出酒...',
    5: '出酒完成，请取酒'
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

// 页面销毁时清理资源
onUnmounted(() => {
  console.log('🧹 页面销毁，清理设备监听资源')
  stopDeviceStatusMonitoring()
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
    
    // 静默验证支付结果（不显示在步骤条中）
    await verifyPaymentResult()
    
    // 1. 检查蓝牙状态
    currentStep.value = 1
    await checkBluetoothStatus()
    
    // 2. 检查设备在线状态
    currentStep.value = 2
    await checkDeviceOnlineStatus()
    
    // 3. 获取控制指令
    currentStep.value = 3
    await getControlCommand()
    
    // 4. 控制设备出酒
    currentStep.value = 4
    await controlDevice()
    
    // 设备控制指令发送完成，等待设备工作完成
    // 实际的完成状态会在设备状态监听中处理
    
    uni.showToast({
      title: '控制指令已发送，正在监听设备状态...',
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

// 获取心跳间隔 - 根据设备状态动态调整
const getHeartbeatInterval = () => {
  // 如果设备正在工作（状态码为1），使用更短的间隔来更及时地更新剩余时间
  if (deviceStatus.value?.status?.code === 1) {
    return 2000 // 2秒间隔，设备工作时更频繁检测剩余时间
  }
  return 3000 // 3秒间隔，正常检测
}

// 开始设备状态监听
const startDeviceStatusMonitoring = async () => {
  if (!orderInfo.value?.deviceCode || isMonitoringDevice.value) {
    return
  }

  try {
    console.log('🔍 开始监听设备状态变化...')
    isMonitoringDevice.value = true
    
    const deviceId = parseInt(orderInfo.value.deviceCode)
    
    // 首次获取设备状态
    try {
      const initialStatus = await checkDetailedDeviceStatus(deviceId)
      deviceStatus.value = initialStatus
      console.log('📊 初始设备状态:', initialStatus)
    } catch (error) {
      console.warn('获取初始设备状态失败:', error)
    }
    
    // 开始心跳监听（每10秒检查一次）
    startDeviceHeartbeat(deviceId, async (status) => {
      console.log(`💓 设备心跳状态: ${status}`)
      
      if (status === 'online') {
        // 设备在线，获取详细状态（使用静默版本，避免显示loading）
        try {
          const detailedStatus = await checkDetailedDeviceStatusSilent(deviceId)
          const previousStatus = deviceStatus.value
          const wasOffline = deviceOfflineCount.value > 0
          
          console.log(`📊 设备详细状态:`, detailedStatus)
          
                     // 如果设备之前离线，现在重新上线
           if (wasOffline && detailedStatus.isOnline) {
             console.log(`🔄 设备重新上线! 离线计数: ${deviceOfflineCount.value}`)
             
             // 检查设备状态是否表示工作完成
             const statusText = detailedStatus.status?.text || ''
             const statusCode = detailedStatus.status?.code || detailedStatus.deviceInfo?.STATUS || 0
             
             // 状态码0表示通电停止，状态码1表示通电启动
             const isWorkCompleted = statusCode === 0 || 
                                   statusText.includes('通电停止') || 
                                   statusText.includes('待机') || 
                                   statusText.includes('停止')
             
             if (isWorkCompleted) {
               console.log('🎉 设备重新上线且工作完成:', { statusCode, statusText })
               handleDeviceWorkCompleted()
               return
             } else {
               console.log('⚡ 设备重新上线但仍在工作:', { statusCode, statusText })
             }
           }
          
          // 重置离线计数
          if (detailedStatus.isOnline) {
            deviceOfflineCount.value = 0
          }
          
          // 检查设备是否长时间处于空闲状态（通电停止）
          if (detailedStatus.status?.code === 0 && !wasOffline) {
            deviceIdleCount.value++
            console.log(`⏸️ 设备空闲状态计数: ${deviceIdleCount.value}/${maxIdleCount}`)
            
            // 如果设备长时间保持空闲状态，提示用户重试
            if (deviceIdleCount.value >= maxIdleCount) {
              console.log('⚠️ 设备长时间未启动，提示重试')
              uni.showModal({
                title: '设备未启动',
                content: '设备接收到指令但长时间未启动，可能设备正忙或指令无效。是否重试？',
                showCancel: true,
                cancelText: '继续等待',
                confirmText: '重试控制',
                success: (res) => {
                  if (res.confirm) {
                    retryControl()
                  } else {
                    // 重置空闲计数，继续等待
                    deviceIdleCount.value = 0
                  }
                }
              })
            }
          } else if (detailedStatus.status?.code === 1) {
            // 设备启动了，重置空闲计数
            deviceIdleCount.value = 0
          }
          
          // 更新设备状态
          deviceStatus.value = detailedStatus
          
          // 日志记录剩余时间更新
          if (detailedStatus.remainInfo?.timeDisplay) {
            console.log(`⏰ 设备剩余时间更新: ${detailedStatus.remainInfo.timeDisplay}`)
          }
          
          // 检查状态是否发生变化
          if (previousStatus && detailedStatus.status?.code !== previousStatus.status?.code) {
            console.log(`🔄 设备状态变化: ${previousStatus.status?.text} → ${detailedStatus.status?.text}`)
            handleDeviceStatusChange(previousStatus, detailedStatus)
          }
          
          // 检查剩余时间是否发生变化
          if (previousStatus && previousStatus.remainInfo?.timeDisplay !== detailedStatus.remainInfo?.timeDisplay) {
            console.log(`⏰ 剩余时间变化: ${previousStatus.remainInfo?.timeDisplay} → ${detailedStatus.remainInfo?.timeDisplay}`)
          }
          
        } catch (error) {
          console.error('获取设备详细状态失败:', error)
          // 如果获取详细状态失败，但心跳显示在线，可能是临时问题
          if (deviceOfflineCount.value > 0) {
            console.log('🔄 心跳显示在线但获取详细状态失败，继续监听')
          }
        }
      } else {
        // 设备离线
        deviceOfflineCount.value++
        console.log(`📴 设备离线 (${deviceOfflineCount.value}/${maxOfflineCount})`)
        
        if (deviceStatus.value?.isOnline) {
          // 第一次检测到离线
          console.log('📴 设备首次离线，可能已启动工作')
          handleDeviceOffline()
        }
        
        // 更新设备状态为离线
        deviceStatus.value = {
          isOnline: false,
          deviceId,
          errorInfo: {
            hasError: true,
            errorMessage: `设备离线 (${deviceOfflineCount.value}/${maxOfflineCount})`
          }
        }
        
        // 如果离线时间过长，停止监听
        if (deviceOfflineCount.value >= maxOfflineCount) {
          console.log('⏰ 设备离线时间过长，停止监听')
          uni.showModal({
            title: '设备监听超时',
            content: '设备离线时间过长，可能已完成工作或出现故障。\n请检查设备状态或手动确认取酒。',
            showCancel: true,
            cancelText: '继续监听',
            confirmText: '确认完成',
            success: (res) => {
              if (res.confirm) {
                handleDeviceWorkCompleted()
              } else {
                // 重置计数，继续监听
                deviceOfflineCount.value = 0
              }
            }
          })
        }
      }
    }, getHeartbeatInterval()) // 动态心跳间隔，根据设备状态调整
    
  } catch (error) {
    console.error('启动设备状态监听失败:', error)
    isMonitoringDevice.value = false
  }
}

// 处理设备状态变化
const handleDeviceStatusChange = (previousStatus: DetailedDeviceStatus, currentStatus: DetailedDeviceStatus) => {
  const prevCode = previousStatus.status?.code
  const currCode = currentStatus.status?.code
  const currText = currentStatus.status?.text
  
  console.log(`🎯 设备状态码变化: ${prevCode} → ${currCode} (${currText})`)
  
  // 根据状态码判断设备工作状态
  if (currCode === 1) {
    // 设备启动中
    uni.showToast({
      title: '设备已启动，正在出酒...',
      icon: 'success',
      duration: 2000
    })
  } else if (currCode === 0) {
    // 设备停止工作
    if (prevCode === 1) {
      // 从启动状态变为停止，说明工作完成
      console.log('🎉 设备工作完成')
      handleDeviceWorkCompleted()
    }
  } else if (currCode && currCode >= 2) {
    // 设备故障状态 (2: 拔插断电, 3: 过载断电, 4: 短路断电, 等)
    console.warn(`⚠️ 设备故障: ${currText}`)
    uni.showModal({
      title: '设备状态异常',
      content: `设备状态: ${currText}\n请检查设备或联系客服`,
      showCancel: true,
      cancelText: '联系客服',
      confirmText: '我知道了',
      success: (res) => {
        if (res.cancel) {
          contactService()
        }
      }
    })
  }
}

// 处理设备离线
const handleDeviceOffline = () => {
  console.log('📴 设备离线，可能已开始工作')
  
  // 设备离线通常意味着开始工作，给用户提示
  uni.showToast({
    title: '设备可能已开始工作',
    icon: 'none',
    duration: 3000
  })
  
  // 不要立即停止监听，继续监听设备重新上线后的状态
  // 设备工作完成后会重新上线并显示"通电停止"状态
}

// 处理设备工作完成
const handleDeviceWorkCompleted = async () => {
  console.log('🎉 设备工作完成')
  
  // 停止监听
  stopDeviceStatusMonitoring()
  
  // 标记控制完成并设置步骤为5（出酒完成）
  controlCompleted.value = true
  currentStep.value = 5
  
  uni.showToast({
    title: '出酒完成，正在自动确认订单...',
    icon: 'success',
    duration: 3000
  })
  
  // 自动调用确认取酒动作
  try {
    await confirmOrder()
  } catch (error) {
    console.error('自动确认订单失败:', error)
    // 如果自动确认失败，显示手动确认按钮
    autoConfirmFailed.value = true
    uni.showToast({
      title: '自动确认失败，请手动确认',
      icon: 'none',
      duration: 2000
    })
  }
}

// 停止设备状态监听
const stopDeviceStatusMonitoring = () => {
  if (isMonitoringDevice.value && orderInfo.value?.deviceCode) {
    console.log('🛑 停止设备状态监听')
    stopDeviceHeartbeat(parseInt(orderInfo.value.deviceCode))
    isMonitoringDevice.value = false
    deviceOfflineCount.value = 0 // 重置离线计数
    deviceIdleCount.value = 0 // 重置空闲计数
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
    
    console.log('✅ 设备控制指令发送成功')
    
    // 等待设备处理指令（给设备一些时间来启动）
    console.log('⏳ 等待设备处理指令...')
    await new Promise(resolve => setTimeout(resolve, 2000)) // 等待2秒
    
    // 检查设备是否已经启动
    const deviceId = parseInt(orderInfo.value?.deviceCode || '')
    try {
      const initialStatus = await checkDetailedDeviceStatusSilent(deviceId)
      console.log('🔍 指令发送后设备状态:', initialStatus)
      
      if (initialStatus.status?.code === 1) {
        console.log('🎉 设备已成功启动')
        uni.showToast({
          title: '设备已启动，正在出酒...',
          icon: 'success',
          duration: 2000
        })
             } else if (initialStatus.status?.code === 0) {
         console.log('⚠️ 设备未启动，状态为通电停止')
         // 设备没有启动，但不立即提示重试，先继续监听一段时间
         // 有些设备可能需要更长时间来处理指令
         console.log('⏳ 设备暂未启动，继续监听...')
         uni.showToast({
           title: '设备处理中，请稍候...',
           icon: 'loading',
           duration: 3000
         })
       }
    } catch (error) {
      console.warn('获取设备初始状态失败:', error)
      // 即使获取状态失败，也继续监听
    }
    
    // 开始监听设备状态变化
    await startDeviceStatusMonitoring()
    
  } catch (error: any) {
    console.error('❌ 设备控制失败:', error)
    throw new Error(error.message || '设备控制失败')
  }
}

// 重试控制
const retryControl = async () => {
  console.log('🔄 用户手动重试设备控制')
  
  // 先停止之前的监听
  stopDeviceStatusMonitoring()
  
  // 重置状态
  controlCompleted.value = false
  controlError.value = false
  autoConfirmFailed.value = false
  currentStep.value = 0
  deviceStatus.value = null
  deviceOfflineCount.value = 0
  deviceIdleCount.value = 0
  
  // 重新开始控制流程
  await startDeviceControl()
}

// 确认取酒
const confirmOrder = async () => {
  try {
    actionLoading.value = true
    
    await OrderApi.confirmOrder(orderInfo.value.id)
    
    console.log('✅ 订单确认成功')
    
    // 重置自动确认失败标记
    autoConfirmFailed.value = false
    
    uni.showToast({
      title: '订单已完成，感谢您的使用！',
      icon: 'success',
      duration: 3000
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
    }, 2000)
    
  } catch (error: any) {
    console.error('确认取酒失败:', error)
    uni.showToast({
      title: error.message || '订单确认失败',
      icon: 'error'
    })
    throw error // 重新抛出错误，让调用方知道失败了
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
      line-height: 1.2;
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

.device-status-info {
  margin: 20rpx 30rpx;
  padding: 20rpx;
  background: #f0f8ff;
  border-radius: 12rpx;
  border-left: 4rpx solid #007aff;
  
  .status-header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 12rpx;
    
    .status-label {
      font-size: 26rpx;
      color: #666;
      font-weight: 500;
    }
  }
  
  .status-detail {
    display: flex;
    align-items: center;
    gap: 16rpx;
    
    .status-value {
      font-size: 28rpx;
      color: #333;
      font-weight: bold;
      
      &.offline {
        color: #ff4757;
      }
    }
    
    .status-extra {
      font-size: 24rpx;
      color: #999;
      background: #e8f4fd;
      padding: 4rpx 12rpx;
      border-radius: 12rpx;
    }
    
    .status-hint {
      font-size: 22rpx;
      color: #007aff;
      font-style: italic;
      margin-top: 8rpx;
      display: block;
    }
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
  
  .completion-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 24rpx;
    background: #f0f9ff;
    border-radius: 16rpx;
    border: 1rpx solid #bfdbfe;
    
    .completion-text {
      font-size: 28rpx;
      color: #1e40af;
      font-weight: 500;
    }
  }
}
</style> 