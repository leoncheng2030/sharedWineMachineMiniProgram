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

// 响应式数据
const orderId = ref('')
const orderInfo = ref<OrderDetail>({} as OrderDetail)
const loading = ref(false)
const actionLoading = ref(false)
const error = ref('')

// 计算属性
const canCancel = computed(() => canCancelOrder(orderInfo.value.status))
const canPay = computed(() => canPayOrder(orderInfo.value.status))
const canConfirm = computed(() => orderInfo.value.status === OrderStatus.DISPENSING)
const canRefund = computed(() => canRefundOrder(orderInfo.value.status))
const hasActions = computed(() => canCancel.value || canPay.value || canConfirm.value || canRefund.value || orderInfo.value.status === OrderStatus.COMPLETED)

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
    [OrderStatus.DISPENSING]: '请及时取酒',
    [OrderStatus.COMPLETED]: '订单已完成'
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

const payOrder = () => {
  // TODO: 跳转到支付页面或调用支付接口
  uni.showToast({
    title: '跳转支付',
    icon: 'none'
  })
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
  }
}
</style>
