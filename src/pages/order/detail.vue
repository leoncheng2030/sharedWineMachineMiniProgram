<template>
  <view class="order-detail-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <up-loading-icon mode="circle" size="50"></up-loading-icon>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <up-icon name="warning" size="60" color="#ff4757"></up-icon>
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="loadOrderDetail(orderId)">重试</button>
    </view>

    <!-- 订单详情内容 -->
    <template v-else-if="orderInfo.id">
      <!-- 订单状态卡片 -->
      <view class="status-card">
        <view class="status-icon" :class="orderInfo.status">
          <up-icon :name="getStatusIcon(orderInfo.status)" size="40" color="white"></up-icon>
        </view>
        <view class="status-info">
          <text class="status-text">{{ getStatusText(orderInfo.status) }}</text>
          <text class="status-desc">{{ getStatusDesc(orderInfo.status) }}</text>
        </view>
      </view>

      <!-- 出酒中提示卡片 -->
      <view v-if="orderInfo.status === OrderStatus.DISPENSING" class="dispensing-tip-card">
        <view class="tip-header">
          <up-icon name="info-circle" size="20" color="#007aff"></up-icon>
          <text class="tip-title">出酒提示</text>
        </view>
        <view class="tip-content">
          <text class="tip-text">• 设备已开始出酒，请耐心等待</text>
          <text class="tip-text">• 出酒量：{{ formatWineAmount(orderInfo.amount) }}</text>
          <text class="tip-text">• 如设备未出酒，请点击"重新出酒"按钮</text>
          <text class="tip-text">• 取酒完成后请点击"确认取酒"按钮</text>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="order-info-card">
        <view class="card-header">
          <up-icon name="file-text" size="20" color="#007aff"></up-icon>
          <text class="card-title">订单信息</text>
        </view>
        <view class="order-details">
          <view class="detail-row">
            <text class="detail-label">订单号：</text>
            <text class="detail-value">{{ orderInfo.orderNo }}</text>
            <button class="copy-btn" @click="copyOrderNo">复制</button>
          </view>
          <view class="detail-row">
            <text class="detail-label">下单时间：</text>
            <text class="detail-value">{{ formatTime(orderInfo.createTime) }}</text>
          </view>
          <view class="detail-row" v-if="orderInfo.payTime">
            <text class="detail-label">支付时间：</text>
            <text class="detail-value">{{ formatTime(orderInfo.payTime) }}</text>
          </view>
          <view class="detail-row" v-if="orderInfo.dispenseStartTime">
            <text class="detail-label">出酒时间：</text>
            <text class="detail-value">{{ formatTime(orderInfo.dispenseStartTime) }}</text>
          </view>
          <view class="detail-row" v-if="orderInfo.dispenseEndTime">
            <text class="detail-label">完成时间：</text>
            <text class="detail-value">{{ formatTime(orderInfo.dispenseEndTime) }}</text>
          </view>
          <view class="detail-row" v-if="orderInfo.cancelTime">
            <text class="detail-label">取消时间：</text>
            <text class="detail-value">{{ formatTime(orderInfo.cancelTime) }}</text>
          </view>
          <view class="detail-row" v-if="orderInfo.cancelReason">
            <text class="detail-label">取消原因：</text>
            <text class="detail-value">{{ orderInfo.cancelReason }}</text>
          </view>
          <view class="detail-row" v-if="orderInfo.refundTime">
            <text class="detail-label">退款时间：</text>
            <text class="detail-value">{{ formatTime(orderInfo.refundTime) }}</text>
          </view>
          <view class="detail-row" v-if="orderInfo.refundAmount">
            <text class="detail-label">退款金额：</text>
            <text class="detail-value refund-amount">¥{{ orderInfo.refundAmount.toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <!-- 商品信息 -->
      <view class="product-info-card">
        <view class="card-header">
          <up-icon name="gift" size="20" color="#007aff"></up-icon>
          <text class="card-title">商品信息</text>
        </view>
        <view class="product-details">
          <view class="product-item">
            <image 
              :src="getWineImageUrl(orderInfo.wineImage)" 
              class="product-image" 
              mode="aspectFill"
              @error="onImageError"
            />
            <view class="product-info">
              <text class="product-name">{{ orderInfo.wineName }}</text>
              <text class="product-spec">{{ formatWineAmount(orderInfo.amount) }}</text>
              <view class="product-price-info">
                <text class="unit-price">单价：¥{{ orderInfo.unitPrice.toFixed(3) }}/ml</text>
                <text class="total-amount">总额：¥{{ orderInfo.totalAmount.toFixed(2) }}</text>
              </view>
              <view class="service-fee" v-if="orderInfo.serviceFee">
                <text>服务费：¥{{ orderInfo.serviceFee.toFixed(2) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 设备信息 -->
      <view class="device-info-card" v-if="orderInfo.deviceName">
        <view class="card-header">
          <up-icon name="home" size="20" color="#007aff"></up-icon>
          <text class="card-title">设备信息</text>
        </view>
        <view class="device-details">
          <view class="detail-row">
            <text class="detail-label">设备名称：</text>
            <text class="detail-value">{{ orderInfo.deviceName }}</text>
          </view>
          <view class="detail-row" v-if="orderInfo.deviceCode">
            <text class="detail-label">设备编码：</text>
            <text class="detail-value">{{ orderInfo.deviceCode }}</text>
          </view>
        </view>
      </view>

      <!-- 备注信息 -->
      <view class="remark-card" v-if="orderInfo.remark">
        <view class="card-header">
          <up-icon name="edit" size="20" color="#007aff"></up-icon>
          <text class="card-title">备注信息</text>
        </view>
        <view class="remark-content">
          <text>{{ orderInfo.remark }}</text>
        </view>
      </view>

      <!-- 底部操作按钮 -->
      <view class="bottom-actions" v-if="hasActions">
        <button 
          v-if="canCancel" 
          class="action-btn secondary" 
          @click="cancelOrder"
          :disabled="actionLoading"
        >
          {{ actionLoading ? '处理中...' : '取消订单' }}
        </button>
        <button 
          v-if="canPay" 
          class="action-btn primary" 
          @click="payOrder"
          :disabled="actionLoading"
        >
          {{ actionLoading ? '处理中...' : '立即支付' }}
        </button>
        <button 
          v-if="orderInfo.status === OrderStatus.DISPENSING" 
          class="action-btn secondary" 
          @click="handleDeviceControl"
          :disabled="actionLoading"
        >
          {{ actionLoading ? '控制中...' : '重新出酒' }}
        </button>
        <button 
          v-if="canConfirm" 
          class="action-btn primary" 
          @click="confirmOrder"
          :disabled="actionLoading"
        >
          {{ actionLoading ? '处理中...' : '确认取酒' }}
        </button>
        <button 
          v-if="canRefund" 
          class="action-btn secondary" 
          @click="refundOrder"
          :disabled="actionLoading"
        >
          {{ actionLoading ? '处理中...' : '申请退款' }}
        </button>
        
        <!-- 刷新订单状态按钮 -->
        <button 
          class="action-btn refresh" 
          @click="refreshOrderStatus"
          :disabled="actionLoading || loading"
        >
          {{ loading ? '刷新中...' : '刷新状态' }}
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { 
  OrderApi, 
  OrderDetail, 
  OrderStatus,
  getOrderStatusText,
  canCancelOrder,
  canPayOrder,
  canRefundOrder,
  formatWineAmount
} from '@/api/order'
import { getWineImageUrl, handleImageError } from '@/utils/image'
import { paymentApi } from '@/api/payment'
import { WechatPayUtil } from '@/utils/wechatPay'
import { useAuthStore } from '@/store/modules/auth'
import { BluetoothDeviceController } from '@/api/deviceControl'
import { deviceControlApi } from '@/api/deviceControl'

// 响应式数据
const orderId = ref('')
const orderInfo = ref<OrderDetail>({} as OrderDetail)
const loading = ref(false)
const actionLoading = ref(false)
const error = ref('')

// 使用认证store
const authStore = useAuthStore()

// 计算属性
const canCancel = computed(() => canCancelOrder(orderInfo.value.status))
const canPay = computed(() => canPayOrder(orderInfo.value.status))
const canConfirm = computed(() => orderInfo.value.status === OrderStatus.DISPENSING)
const canRefund = computed(() => canRefundOrder(orderInfo.value.status))
const hasActions = computed(() => canCancel.value || canPay.value || canConfirm.value || canRefund.value || orderInfo.value.status === OrderStatus.COMPLETED || orderInfo.value.id)

// 页面加载
onLoad((options) => {
  // 支持多种参数名：orderId、id、orderNo
  const orderIdParam = options?.orderId || options?.id
  const orderNoParam = options?.orderNo
  
  if (orderIdParam) {
    orderId.value = orderIdParam
    loadOrderDetail(orderIdParam)
  } else if (orderNoParam) {
    loadOrderByOrderNo(orderNoParam)
  } else {
    error.value = '缺少订单参数'
  }
})

onMounted(() => {
  uni.setNavigationBarTitle({
    title: '订单详情'
  })
})

// 页面显示时刷新订单状态
const onShow = () => {
  console.log('📱 页面重新显示，刷新订单状态')
  if (orderId.value) {
    loadOrderDetail(orderId.value)
  }
}

// 监听页面显示事件
uni.$on('onShow', onShow)

// 下拉刷新处理
const onPullDownRefresh = async () => {
  try {
    await loadOrderDetail(orderId.value)
    uni.showToast({
      title: '刷新成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('下拉刷新失败:', error)
  } finally {
    uni.stopPullDownRefresh()
  }
}

// 监听下拉刷新事件
uni.$on('onPullDownRefresh', onPullDownRefresh)

// 方法函数
const loadOrderDetail = async (id: string) => {
  if (!id) {
    error.value = '订单ID不能为空'
    return
  }

  try {
    loading.value = true
    error.value = ''
    
    const result = await OrderApi.getOrderDetail(id)
    orderInfo.value = result
    
    // 临时调试：检查酒品图片信息
    console.log('🍷 酒品图片信息检查:')
    console.log('- wineId:', result.wineId)
    console.log('- wineName:', result.wineName)
    console.log('- wineImage:', result.wineImage)
    console.log('- wineSpec:', result.wineSpec)
    console.log('- alcoholDegree:', result.alcoholDegree)
    
    // 设置状态文本
    orderInfo.value.statusText = getOrderStatusText(result.status)
    
  } catch (err: any) {
    console.error('加载订单详情失败:', err)
    error.value = err.message || '加载订单详情失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const loadOrderByOrderNo = async (orderNo: string) => {
  if (!orderNo) {
    error.value = '订单号不能为空'
    return
  }

  try {
    loading.value = true
    error.value = ''
    
    const result = await OrderApi.getOrderByOrderNo(orderNo)
    orderInfo.value = result
    orderId.value = result.id
    
    // 设置状态文本
    orderInfo.value.statusText = getOrderStatusText(result.status)
    
  } catch (err: any) {
    console.error('通过订单号加载订单详情失败:', err)
    error.value = err.message || '加载订单详情失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const getStatusIcon = (status: OrderStatus) => {
  const iconMap: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'clock',
    [OrderStatus.DISPENSING]: 'play-circle',
    [OrderStatus.COMPLETED]: 'checkmark-circle'
  }
  return iconMap[status] || 'help-circle'
}

const getStatusText = (status: OrderStatus) => {
  return getOrderStatusText(status)
}

const getStatusDesc = (status: OrderStatus) => {
  const descMap: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: '请尽快完成支付',
    [OrderStatus.DISPENSING]: '支付成功，设备正在出酒，请及时取酒',
    [OrderStatus.COMPLETED]: '订单已完成，感谢您的使用'
  }
  return descMap[status] || ''
}

const formatTime = (timeStr?: string) => {
  if (!timeStr) return ''
  
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    return timeStr
  }
}

const copyOrderNo = () => {
  uni.setClipboardData({
    data: orderInfo.value.orderNo,
    success: () => {
      uni.showToast({
        title: '订单号已复制',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'error'
      })
    }
  })
}

const cancelOrder = () => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          actionLoading.value = true
          
          await OrderApi.cancelOrder({
            orderId: orderInfo.value.id,
            cancelReason: '用户主动取消'
          })
          
          uni.showToast({
            title: '订单已取消',
            icon: 'success'
          })
          
          // 重新加载订单详情
          await loadOrderDetail(orderInfo.value.id)
          
          // 通知列表页面刷新数据（取消订单后返回列表页）
          uni.navigateBack({
            success: () => {
              uni.$emit('orderStatusChanged', {
                orderId: orderInfo.value.id,
                newStatus: 'CANCELLED'
              })
            }
          })
          
        } catch (err: any) {
          console.error('取消订单失败:', err)
          uni.showToast({
            title: err.message || '取消失败',
            icon: 'error'
          })
        } finally {
          actionLoading.value = false
        }
      }
    }
  })
}

const payOrder = async () => {
  try {
    actionLoading.value = true
    
    // 1. 检查用户登录状态
    if (!authStore.isLoggedIn) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    // 2. 检查订单状态
    if (!canPay.value) {
      uni.showToast({
        title: '订单状态不允许支付',
        icon: 'none'
      })
      return
    }

    // 3. 获取用户openid - 增加详细调试
    console.log('🔍 用户信息调试:', {
      userInfo: authStore.userInfo,
      account: authStore.userInfo?.account,
      id: authStore.userInfo?.id,
      name: authStore.userInfo?.name
    })

    // 尝试多种方式获取openid
    let openid = authStore.userInfo?.wechatOpenid || authStore.userInfo?.account
    
    // 如果wechatOpenid和account都为空，尝试从本地存储获取
    if (!openid) {
      openid = uni.getStorageSync('USER_OPENID')
      console.log('📱 从本地存储获取openid:', openid)
    }
    
    // 如果仍然没有openid，尝试重新获取用户信息
    if (!openid) {
      console.log('⚠️ 未找到openid，尝试刷新用户信息...')
      try {
        await authStore.refreshUserInfo()
        openid = authStore.userInfo?.account
        console.log('🔄 刷新后的openid:', openid)
      } catch (refreshError) {
        console.error('刷新用户信息失败:', refreshError)
      }
    }

    // 最终验证openid
    if (!openid) {
      console.error('❌ 无法获取用户openid')
      uni.showModal({
        title: '支付失败',
        content: '获取用户信息失败，请重新登录后重试',
        showCancel: true,
        cancelText: '取消',
        confirmText: '重新登录',
        success: (res) => {
          if (res.confirm) {
            // 清除登录状态并跳转到登录页面
            authStore.logout()
            uni.reLaunch({
              url: '/pages/user/user'
            })
          }
        }
      })
      return
    }

    console.log('✅ 最终使用的openid:', openid)

    // 4. 构建支付订单数据
    const payOrderData = {
      orderNo: orderInfo.value.orderNo,
      amount: orderInfo.value.totalAmount,
      description: `共享售酒机-${orderInfo.value.wineName}`,
      attach: JSON.stringify({
        orderId: orderInfo.value.id,
        deviceId: orderInfo.value.deviceId,
        wineId: orderInfo.value.wineId
      })
    }

    console.log('💰 开始支付订单:', payOrderData)

    // 5. 调用修复后的微信支付工具类
    const payResult = await WechatPayUtil.miniProgramPay(payOrderData)
    
    if (!payResult.success) {
      throw new Error(payResult.message)
    }

    // 6. 支付成功后立即更新页面状态
    console.log('✅ 微信支付成功，开始处理后续逻辑')
    
    // 立即更新本地订单状态为支付中，避免用户继续点击支付按钮
    orderInfo.value = {
      ...orderInfo.value,
      status: OrderStatus.DISPENSING,
      payTime: new Date().toISOString()
    }
    
    await uni.showToast({
      title: '支付成功，正在控制设备...',
      icon: 'success',
      duration: 2000
    })

    // 7. 异步查询支付结果并更新订单状态
    await handlePaymentSuccess()

  } catch (err: any) {
    console.error('支付失败:', err)
    
    // 根据错误类型显示不同提示
    if (err.message?.includes('cancel')) {
      await uni.showToast({
        title: '支付已取消',
        icon: 'none'
      })
    } else if (err.message?.includes('无效的openid')) {
      uni.showModal({
        title: '支付失败',
        content: 'openid无效，请重新登录后重试',
        showCancel: true,
        cancelText: '取消',
        confirmText: '重新登录',
        success: (res) => {
          if (res.confirm) {
            authStore.logout()
            uni.reLaunch({
              url: '/pages/user/user'
            })
          }
        }
      })
    } else if (err.message?.includes('创建支付订单失败')) {
      uni.showToast({
        title: '创建支付订单失败',
        icon: 'error'
      })
    } else {
      uni.showToast({
        title: err.message || '支付失败',
        icon: 'error'
      })
    }
  } finally {
    actionLoading.value = false
  }
}

const handlePaymentSuccess = async () => {
  try {
    console.log('🔍 开始验证支付结果...')
    
    // 使用更积极的轮询策略：更多次数，更短间隔
    const payResultQuery = await paymentApi.pollPaymentResult(orderInfo.value.orderNo, 10, 1000)
    
    if (payResultQuery.tradeState === 'SUCCESS') {
      console.log('✅ 支付结果验证成功')
      
      // 重新加载订单详情以获取最新状态
      await loadOrderDetail(orderInfo.value.id)
      
      // 通知列表页面刷新数据
      uni.$emit('orderStatusChanged', {
        orderId: orderInfo.value.id,
        newStatus: 'PAID'
      })
      
      // 支付成功后自动控制设备出酒
      await handleDeviceControl()
      
    } else {
      console.warn('⚠️ 支付结果查询异常:', payResultQuery)
      
      // 支付结果异常时，重新加载订单详情
      await loadOrderDetail(orderInfo.value.id)
      
      // 启动备用轮询检查
      startBackupPaymentCheck()
    }
    
  } catch (error) {
    console.error('❌ 查询支付结果失败:', error)
    
    // 查询失败时也重新加载订单详情
    await loadOrderDetail(orderInfo.value.id)
    
    // 启动备用轮询检查
    startBackupPaymentCheck()
  }
}

// 备用支付状态检查
const startBackupPaymentCheck = () => {
  let checkCount = 0
  const maxChecks = 6 // 最多检查6次
  
  const checkInterval = setInterval(async () => {
    checkCount++
    
    try {
      console.log(`🔄 备用支付检查 ${checkCount}/${maxChecks}`)
      
      // 重新加载订单详情
      await loadOrderDetail(orderInfo.value.id)
      
      // 如果订单状态已更新为DISPENSING，说明支付成功
      if (orderInfo.value.status === OrderStatus.DISPENSING) {
        console.log('✅ 备用检查发现支付成功')
        clearInterval(checkInterval)
        
        uni.showToast({
          title: '支付状态已更新',
          icon: 'success'
        })
        
        // 自动控制设备出酒
        await handleDeviceControl()
        return
      }
      
      // 达到最大检查次数
      if (checkCount >= maxChecks) {
        clearInterval(checkInterval)
        console.log('⚠️ 备用支付检查达到最大次数')
        
        uni.showModal({
          title: '支付状态确认',
          content: '支付状态确认中，如果已经支付成功，请稍等片刻或手动刷新订单状态',
          showCancel: true,
          cancelText: '稍后确认',
          confirmText: '刷新状态',
          success: async (res) => {
            if (res.confirm) {
              await loadOrderDetail(orderInfo.value.id)
            }
          }
        })
      }
      
    } catch (error) {
      console.error(`❌ 备用支付检查失败 ${checkCount}:`, error)
      
      if (checkCount >= maxChecks) {
        clearInterval(checkInterval)
      }
    }
  }, 3000) // 每3秒检查一次
}

const handleDeviceControl = async () => {
  try {
    console.log('🔄 开始重新出酒流程')
    actionLoading.value = true
    
    // 1. 检查订单状态是否允许控制设备
    if (orderInfo.value.status !== OrderStatus.DISPENSING) {
      console.log('❌ 订单状态不允许控制设备:', orderInfo.value.status)
      uni.showToast({
        title: '订单状态异常，无法控制设备',
        icon: 'error'
      })
      return
    }
    
    // 2. 检查蓝牙状态
    console.log('📱 检查蓝牙权限和状态...')
    uni.showLoading({
      title: '检查蓝牙状态...',
      mask: true
    })
    
    try {
      const { checkBluetooth } = await import('@/utils/ble')
      const bluetoothAvailable = await checkBluetooth()
      
      if (!bluetoothAvailable) {
        uni.hideLoading()
        uni.showModal({
          title: '蓝牙未开启',
          content: '设备控制需要蓝牙功能，请开启蓝牙后重试',
          showCancel: true,
          cancelText: '取消',
          confirmText: '重试',
          success: (res) => {
            if (res.confirm) {
              // 重新尝试
              handleDeviceControl()
            }
          }
        })
        return
      }
    } catch (bleError: any) {
      console.error('❌ 蓝牙检查失败:', bleError)
      uni.hideLoading()
      uni.showToast({
        title: '蓝牙检查失败，请稍后重试',
        icon: 'error'
      })
      return
    }
    
    // 3. 检查设备是否在线
    console.log('🔍 检查设备在线状态...')
    uni.showLoading({
      title: '检查设备状态...',
      mask: true
    })
    
    try {
      const { checkDeviceOnline } = await import('@/utils/ble')
      const deviceOnline = await checkDeviceOnline(parseInt(orderInfo.value.deviceId))
      
      if (!deviceOnline) {
        uni.hideLoading()
        uni.showModal({
          title: '设备离线',
          content: '设备当前不在线，请确保设备正常工作并靠近设备后重试',
          showCancel: true,
          cancelText: '取消',
          confirmText: '重试',
          success: (res) => {
            if (res.confirm) {
              // 重新尝试
              handleDeviceControl()
            }
          }
        })
        return
      }
    } catch (deviceCheckError: any) {
      console.error('❌ 设备在线检查失败:', deviceCheckError)
      // 设备检查失败时继续执行，可能是网络问题
      console.log('⚠️ 设备在线检查失败，继续执行控制流程')
    }
    
    // 4. 获取设备控制数据
    console.log('📡 获取设备控制指令...')
    uni.showLoading({
      title: '获取控制指令...',
      mask: true
    })
    
    // 构建设备控制参数
    const controlParam = {
      deviceId: orderInfo.value.deviceId,
      chargeId: orderInfo.value.id, // 使用订单ID作为chargeId
      minute: Math.floor(orderInfo.value.amount / 100), // 按照出酒量计算时间（约100ml/分钟）
      second: Math.floor((orderInfo.value.amount % 100) * 0.6), // 剩余量按秒计算
      userId: authStore.userId,
      // 添加订单相关信息
      quantity: orderInfo.value.amount, // 出酒量
      nowTime: Date.now(), // 当前时间戳
      startTime: new Date(orderInfo.value.payTime || orderInfo.value.createTime).getTime(), // 订单开始时间
      validSecond: 300, // 5分钟有效期
      overlap: 1 // 允许覆盖
    }
    
    console.log('📊 设备控制参数:', controlParam)
    
    try {
      // 调用设备控制API获取控制指令
      const controlResult = await deviceControlApi.getControlCommand(controlParam)
      
      if (!controlResult.success || !controlResult.cmd) {
        throw new Error(controlResult.message || '获取控制指令失败')
      }
      
      console.log('✅ 获取控制指令成功:', {
        orderId: controlResult.orderId,
        deviceId: controlResult.deviceId,
        hasCommand: !!controlResult.cmd
      })
      
      // 5. 通过蓝牙发送控制指令
      console.log('📡 发送蓝牙控制指令...')
      uni.showLoading({
        title: '控制设备中...',
        mask: true
      })
      
      const { writeChargeData } = await import('@/utils/ble')
      await writeChargeData(parseInt(orderInfo.value.deviceId), controlResult.cmd)
      
      // 6. 更新控制结果
      await deviceControlApi.updateControlResult({
        orderId: orderInfo.value.id,
        deviceId: orderInfo.value.deviceId,
        success: true,
        message: '设备控制成功'
      })
      
      uni.hideLoading()
      
      uni.showToast({
        title: '设备控制成功，请取酒',
        icon: 'success',
        duration: 3000
      })
      
      // 重新加载订单详情以更新状态
      setTimeout(() => {
        loadOrderDetail(orderInfo.value.id)
      }, 2000)
      
    } catch (controlError: any) {
      console.error('❌ 设备控制失败:', controlError)
      
      // 更新失败结果
      try {
        await deviceControlApi.updateControlResult({
          orderId: orderInfo.value.id,
          deviceId: orderInfo.value.deviceId,
          success: false,
          message: controlError.message || '设备控制失败'
        })
      } catch (updateError) {
        console.error('❌ 更新控制结果失败:', updateError)
      }
      
      uni.hideLoading()
      
      // 根据错误类型显示不同的处理方案
      if (controlError.message?.includes('权限') || controlError.message?.includes('permission')) {
        uni.showModal({
          title: '权限不足',
          content: '无权限控制该设备，请联系客服处理',
          showCancel: false,
          confirmText: '联系客服',
          success: () => {
            uni.showToast({
              title: '客服电话：400-xxx-xxxx',
              icon: 'none',
              duration: 3000
            })
          }
        })
      } else if (controlError.message?.includes('蓝牙') || controlError.message?.includes('bluetooth')) {
        uni.showModal({
          title: '蓝牙连接失败',
          content: '蓝牙连接设备失败，请确保靠近设备并重试',
          showCancel: true,
          cancelText: '联系客服',
          confirmText: '重试',
          success: (res) => {
            if (res.confirm) {
              handleDeviceControl()
            } else {
              uni.showToast({
                title: '客服电话：400-xxx-xxxx',
                icon: 'none',
                duration: 3000
              })
            }
          }
        })
      } else {
        uni.showModal({
          title: '设备控制失败',
          content: controlError.message || '设备控制失败，请重试或联系客服',
          showCancel: true,
          cancelText: '联系客服',
          confirmText: '重试',
          success: (res) => {
            if (res.confirm) {
              handleDeviceControl()
            } else {
              uni.showToast({
                title: '客服电话：400-xxx-xxxx',
                icon: 'none',
                duration: 3000
              })
            }
          }
        })
      }
    }
    
  } catch (error: any) {
    console.error('❌ 重新出酒流程异常:', error)
    uni.hideLoading()
    
    uni.showModal({
      title: '系统异常',
      content: '系统异常，请稍后重试或联系客服',
      showCancel: true,
      cancelText: '联系客服',
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          handleDeviceControl()
        } else {
          uni.showToast({
            title: '客服电话：400-xxx-xxxx',
            icon: 'none',
            duration: 3000
          })
        }
      }
    })
  } finally {
    actionLoading.value = false
  }
}

const confirmOrder = async () => {
  try {
    actionLoading.value = true
    
    await OrderApi.confirmOrder(orderInfo.value.id)
    
    uni.showToast({
      title: '取酒成功',
      icon: 'success'
    })
    
    // 重新加载订单详情
    await loadOrderDetail(orderInfo.value.id)
    
    // 通知列表页面刷新数据
    uni.$emit('orderStatusChanged', {
      orderId: orderInfo.value.id,
      newStatus: 'COMPLETED'
    })
    
    // 延迟显示评价提示
    setTimeout(() => {
      uni.showModal({
        title: '订单完成',
        content: '感谢您的使用！您可以对本次服务进行评价',
        showCancel: true,
        cancelText: '稍后评价',
        confirmText: '立即评价',
        success: (res) => {
          if (res.confirm) {
            // TODO: 跳转到评价页面
            uni.showToast({
              title: '评价功能开发中',
              icon: 'none'
            })
          }
        }
      })
    }, 2000)
    
  } catch (err: any) {
    console.error('确认订单失败:', err)
    uni.showToast({
      title: err.message || '确认失败',
      icon: 'error'
    })
  } finally {
    actionLoading.value = false
  }
}

const refundOrder = () => {
  uni.showModal({
    title: '申请退款',
    content: '确定要申请退款吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          actionLoading.value = true
          
          await OrderApi.refundOrder(orderInfo.value.id, '用户申请退款')
          
          uni.showToast({
            title: '退款申请已提交',
            icon: 'success'
          })
          
          // 重新加载订单详情
          await loadOrderDetail(orderInfo.value.id)
          
          // 通知列表页面刷新数据（退款后返回列表页）
          uni.navigateBack({
            success: () => {
              uni.$emit('orderStatusChanged', {
                orderId: orderInfo.value.id,
                newStatus: 'REFUNDED'
              })
            }
          })
          
        } catch (err: any) {
          console.error('申请退款失败:', err)
          uni.showToast({
            title: err.message || '申请失败',
            icon: 'error'
          })
        } finally {
          actionLoading.value = false
        }
      }
    }
  })
}

const reorder = async () => {
  try {
    actionLoading.value = true
    
    const newOrderId = await OrderApi.reorder(orderInfo.value.id)
    
    uni.showToast({
      title: '订单已创建',
      icon: 'success'
    })
    
    // 跳转到新订单详情页
    setTimeout(() => {
      uni.navigateTo({
        url: `/pages/order/detail?orderId=${newOrderId}`
      })
    }, 1500)
    
  } catch (err: any) {
    console.error('重新下单失败:', err)
    uni.showToast({
      title: err.message || '下单失败',
      icon: 'error'
    })
  } finally {
    actionLoading.value = false
  }
}

const refreshOrderStatus = async () => {
  try {
    console.log('🔄 手动刷新订单状态')
    
    uni.showToast({
      title: '正在刷新...',
      icon: 'loading'
    })
    
    // 重新加载订单详情
    await loadOrderDetail(orderInfo.value.id)
    
    uni.showToast({
      title: '刷新成功',
      icon: 'success'
    })
    
  } catch (err: any) {
    console.error('刷新订单状态失败:', err)
    uni.showToast({
      title: err.message || '刷新失败',
      icon: 'error'
    })
  }
}

const onImageError = (event: any) => {
  handleImageError(event, '/static/images/wine_default.png')
}
</script>

<style lang="scss" scoped>
.order-detail-page {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 120rpx;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
  
  .loading-text,
  .error-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #666;
  }
  
  .retry-btn {
    margin-top: 30rpx;
    padding: 16rpx 40rpx;
    background: #007aff;
    color: white;
    border: none;
    border-radius: 20rpx;
    font-size: 26rpx;
  }
}

.status-card {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
  
  .status-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.PENDING {
      background: #faad14;
    }
    
    &.PAID,
    &.DISPENSING,
    &.COMPLETED {
      background: #52c41a;
    }
    
    &.CANCELLED,
    &.REFUNDED {
      background: #ff4d4f;
    }
  }
  
  .status-info {
    flex: 1;
    
    .status-text {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .status-desc {
      font-size: 26rpx;
      color: #666;
    }
  }
}

.dispensing-tip-card {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
  border-left: 8rpx solid #007aff;
  
  .tip-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 30rpx 30rpx 20rpx;
    background: #f8fafe;
    
    .tip-title {
      font-size: 30rpx;
      font-weight: bold;
      color: #007aff;
    }
  }
  
  .tip-content {
    padding: 20rpx 30rpx 30rpx;
    
    .tip-text {
      display: block;
      font-size: 26rpx;
      color: #666;
      line-height: 1.6;
      margin-bottom: 12rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.order-info-card,
.product-info-card,
.device-info-card,
.remark-card {
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

.order-details,
.device-details {
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
      
      &.refund-amount {
        color: #ff4757;
        font-weight: bold;
      }
    }
    
    .copy-btn {
      padding: 8rpx 16rpx;
      background: #f0f0f0;
      color: #666;
      border: none;
      border-radius: 20rpx;
      font-size: 24rpx;
      margin-left: 16rpx;
    }
  }
}

.product-details {
  padding: 30rpx;
  
  .product-item {
    display: flex;
    gap: 20rpx;
    
    .product-image {
      width: 120rpx;
      height: 120rpx;
      border-radius: 12rpx;
      flex-shrink: 0;
    }
    
    .product-info {
      flex: 1;
      
      .product-name {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .product-spec {
        font-size: 26rpx;
        color: #666;
        display: block;
        margin-bottom: 12rpx;
      }
      
      .product-price-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8rpx;
        
        .unit-price {
          font-size: 24rpx;
          color: #999;
        }
        
        .total-amount {
          font-size: 32rpx;
          font-weight: bold;
          color: #ff4757;
        }
      }
      
      .service-fee {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

.remark-content {
  padding: 30rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
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
    
    &.refresh {
      background: #28a745;
      color: white;
      border: 1rpx solid #28a745;
      
      &:disabled {
        background: #cccccc;
        border-color: #cccccc;
      }
    }
  }
}
</style>