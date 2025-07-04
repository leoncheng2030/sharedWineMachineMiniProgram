<template>
  <view class="order-list-page">
    <!-- 状态筛选标签 -->
    <view class="tabs-container">
      <!-- 自定义tabs -->
      <view class="custom-tabs">
        <view 
          class="tab-item" 
          :class="{ active: currentTabIndex === index }"
          v-for="(tab, index) in tabList" 
          :key="tab.key"
          @click="handleTabChange(index)"
        >
          <text class="tab-name">{{ tab.name }}</text>
          <text class="tab-count" v-if="tab.count > 0">({{ tab.count }})</text>
        </view>
      </view>
      
      <!-- 备用：uView tabs -->
      <view style="display: none;">
        <up-tabs 
          :list="tabList" 
          :current="currentTabIndex" 
          @change="onTabChange"
          @click="onTabChange"
          :scrollable="false"
          lineColor="#007aff"
          lineHeight="2"
          lineWidth="40"
          activeColor="#007aff"
          inactiveColor="#666"
          gutter="40"
          height="88"
          fontSize="28"
          :itemStyle="{ padding: '0 20rpx', height: '88rpx', margin: 0 }"
          :style="{ margin: 0, padding: 0 }"
        ></up-tabs>
      </view>
      
      <!-- 调试：显示当前状态 -->
      <view class="debug-info" v-if="false">
        <text>当前标签: {{ currentTabIndex }} ({{ activeTab }})</text>
        <text>订单数量: {{ orderList.length }}</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="order-list">
      <!-- 使用uView Plus的空状态组件 -->
      <up-empty 
        v-if="orderList.length === 0 && !loading" 
        mode="order"
        text="暂无订单数据"
        :textSize="24"
        :iconSize="100"
        :width="100"
        :height="100"
        textColor="#999"
        iconColor="#ddd"
        :marginTop="60"
      />
      
      <view v-else>
        <view 
          class="order-item" 
          v-for="order in orderList" 
          :key="order.id"
          @click="goToOrderDetail(order.id)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <view class="order-info">
              <text class="order-no">订单号：{{ order.orderNo }}</text>
              <text class="order-time">{{ formatTime(order.createTime) }}</text>
            </view>
            <view class="order-status" :class="getStatusClass(order.status)">
              {{ order.statusText || getStatusText(order.status) }}
            </view>
          </view>

          <!-- 设备信息 -->
          <view class="device-info">
            <view class="device-header">
              <u-icon name="home" size="16" color="#666"></u-icon>
              <text class="device-name">{{ order.deviceName || '共享售酒机设备' }}</text>
            </view>
            <view class="device-details">
              <view class="device-detail-item" v-if="order.deviceId">
                <text class="detail-label">设备ID：</text>
                <text class="detail-value">{{ order.deviceId }}</text>
              </view>
              <view class="device-detail-item" v-if="order.deviceCode">
                <text class="detail-label">设备编号：</text>
                <text class="detail-value">{{ order.deviceCode }}</text>
              </view>
              <view class="device-detail-item" v-if="order.deviceLocation">
                <u-icon name="map" size="12" color="#999"></u-icon>
                <text class="detail-value location">{{ order.deviceLocation }}</text>
              </view>
            </view>
          </view>

          <!-- 酒品信息 -->
          <view class="product-list">
            <view class="product-item">
              <image :src="getWineImageUrl(order.wineImage)" class="product-image" mode="aspectFill" />
              <view class="product-details">
                <text class="product-name">{{ order.wineName }}</text>
                <text class="product-spec">{{ formatWineAmount(order.amount) }}</text>
                <view class="product-price-qty">
                  <text class="product-price">{{ formatOrderAmount(order.totalAmount) }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 订单总价 -->
          <view class="order-total">
            <text class="total-label">实付金额：</text>
            <text class="total-price">{{ formatOrderAmount(order.totalAmount) }}</text>
          </view>

          <!-- 操作按钮 -->
          <view class="order-actions">
            <!-- 待支付：可以取消订单、立即支付 -->
            <button 
              v-if="order.status === 'PENDING'" 
              class="action-btn secondary" 
              @click.stop="cancelOrder(order.id)"
            >
              取消订单
            </button>
            <button 
              v-if="order.status === 'PENDING'" 
              class="action-btn primary" 
              @click.stop="payOrder(order.id)"
            >
              立即支付
            </button>
            
            <!-- 待取酒：可以申请退款、确认取酒 -->
            <button 
              v-if="order.status === 'DISPENSING'" 
              class="action-btn refund" 
              @click.stop="refundOrder(order.id)"
            >
              申请退款
            </button>
            <button 
              v-if="order.status === 'DISPENSING'" 
              class="action-btn primary" 
              @click.stop="confirmOrder(order.id)"
            >
              确认取酒
            </button>
            
            <!-- 已完成：无操作按钮 -->
          </view>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view v-if="hasMore && orderList.length > 0" class="load-more" @click="loadMore">
      <text>{{ loading ? '加载中...' : '加载更多' }}</text>
    </view>
    
    <!-- 加载中状态 -->
    <view v-if="loading && orderList.length === 0" class="loading-state">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { 
  OrderApi, 
  OrderStatus, 
  OrderSimple, 
  OrderPageParam, 
  OrderPageResult,
  getOrderStatusText,
  canCancelOrder,
  canPayOrder,
  canRefundOrder,
  formatOrderAmount,
  formatWineAmount
} from '@/api/order'
import { getWineImageUrl } from '@/utils/image'

// 页面参数
const pageParams = ref<{ status?: string }>({})

// 状态数据
const activeTab = ref('all')
const orderList = ref<OrderSimple[]>([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const currentTabIndex = ref(0)

// 标签列表
const tabList = ref([
  { name: '全部', key: 'all', count: 0 },
  { name: '待支付', key: 'PENDING', count: 0 },
  { name: '待取酒', key: 'DISPENSING', count: 0 },
  { name: '已完成', key: 'COMPLETED', count: 0 }
])

// 页面加载
onLoad((options) => {
  console.log('订单列表页面加载，参数:', options)
  if (options?.status) {
    pageParams.value.status = options.status
    activeTab.value = options.status
    console.log('设置活动标签为:', options.status)
  }
  
  // 设置当前标签索引
  const index = tabList.value.findIndex(item => item.key === activeTab.value)
  if (index !== -1) {
    currentTabIndex.value = index
    console.log('设置当前标签索引:', index, '对应状态:', activeTab.value)
  } else {
    console.warn('未找到匹配的标签:', activeTab.value)
    // 如果没找到匹配的标签，默认设置为全部
    activeTab.value = 'all'
    currentTabIndex.value = 0
  }
  
  loadOrderList()
  loadOrderStatistics()
})

onMounted(() => {
  // 设置导航栏标题
  uni.setNavigationBarTitle({
    title: '我的订单'
  })
  
  // 监听订单状态变化事件
  uni.$on('orderStatusChanged', handleOrderStatusChanged)
})

// 页面卸载时移除事件监听
onUnmounted(() => {
  uni.$off('orderStatusChanged', handleOrderStatusChanged)
})

/**
 * 加载订单列表
 */
const loadOrderList = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    const params: OrderPageParam = {
      pageNum: page.value,
      pageSize: 10
    }
    
    console.log('加载订单列表，当前状态:', activeTab.value, '页码:', page.value)
    
    // 根据当前标签设置状态筛选
    if (activeTab.value !== 'all') {
      console.log('加载指定状态订单:', activeTab.value)
      params.status = activeTab.value as OrderStatus
      const result = await OrderApi.getOrderPage(params)
      
      if (page.value === 1) {
        orderList.value = result.records
      } else {
        orderList.value.push(...result.records)
      }
      
      hasMore.value = page.value < result.pages
      console.log('指定状态订单加载完成，数量:', result.records.length)
    } else {
      console.log('加载全部订单')
      // 全部订单
      const result = await OrderApi.getOrderPage(params)
      
      if (page.value === 1) {
        orderList.value = result.records
      } else {
        orderList.value.push(...result.records)
      }
      
      hasMore.value = page.value < result.pages
      console.log('全部订单加载完成，数量:', result.records.length)
    }
    
    console.log('订单列表加载成功:', orderList.value.length, '条数据')
    
  } catch (error) {
    console.error('加载订单列表失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 加载订单统计信息
 */
const loadOrderStatistics = async () => {
  try {
    const statistics = await OrderApi.getOrderStatistics()
    
    // 更新标签计数
    tabList.value.forEach(tab => {
      switch (tab.key) {
        case 'all':
          tab.count = statistics.totalCount
          break
        case 'PENDING':
          tab.count = statistics.pendingPaymentCount
          break
        case 'DISPENSING':
          tab.count = statistics.processingCount
          break
        case 'COMPLETED':
          tab.count = statistics.completedCount
          break
      }
    })
    
  } catch (error) {
    console.error('加载订单统计失败:', error)
  }
}

/**
 * 更新本地订单状态
 */
const updateLocalOrderStatus = (orderId: string, newStatus: string) => {
  const orderIndex = orderList.value.findIndex(order => order.id === orderId)
  if (orderIndex !== -1) {
    orderList.value[orderIndex].status = newStatus as OrderStatus
    orderList.value[orderIndex].statusText = getOrderStatusText(newStatus as OrderStatus)
    
    // 更新操作权限
    const order = orderList.value[orderIndex]
    order.canCancel = canCancelOrder(newStatus as OrderStatus)
    order.canPay = canPayOrder(newStatus as OrderStatus)
    order.canRefund = canRefundOrder(newStatus as OrderStatus)
    
    console.log('本地订单状态已更新:', orderId, newStatus)
  }
}

/**
 * 刷新当前页面数据
 */
const refreshCurrentPageData = async () => {
  try {
    page.value = 1
    hasMore.value = true
    await loadOrderList()
    console.log('当前页面数据已刷新')
  } catch (error) {
    console.error('刷新页面数据失败:', error)
  }
}

/**
 * 处理订单状态变化事件
 */
const handleOrderStatusChanged = (eventData: { orderId: string; newStatus: string }) => {
  console.log('接收到订单状态变化事件:', eventData)
  
  // 立即更新本地数据
  updateLocalOrderStatus(eventData.orderId, eventData.newStatus)
  
  // 重新加载统计数据
  loadOrderStatistics()
}

/**
 * 处理标签页切换 - uView组件事件处理
 */
const onTabChange = (data: any) => {
  console.log('uView tabs change事件:', data)
  
  let index: number
  if (typeof data === 'number') {
    index = data
  } else if (data && typeof data.index === 'number') {
    index = data.index
  } else if (data && typeof data.current === 'number') {
    index = data.current
  } else {
    console.error('无法解析tabs事件数据:', data)
    return
  }
  
  handleTabChange(index)
}

/**
 * 处理标签页切换
 */
const handleTabChange = (index: number) => {
  try {
    console.log('订单列表标签切换:', index, tabList.value[index])
    if (index >= 0 && index < tabList.value.length) {
      const tabKey = tabList.value[index].key
      console.log('切换到状态:', tabKey, '当前状态:', activeTab.value)
      
      // 如果是同一个标签，不需要重新加载
      if (activeTab.value === tabKey) {
        console.log('相同标签，跳过重新加载')
        return
      }
      
      currentTabIndex.value = index
      activeTab.value = tabKey
      page.value = 1
      hasMore.value = true
      orderList.value = [] // 清空当前列表
      
      console.log('开始加载新状态的数据:', tabKey)
      loadOrderList()
    }
  } catch (error) {
    console.error('标签页切换错误:', error)
  }
}

/**
 * 切换标签
 */
const switchTab = (tabKey: string) => {
  if (activeTab.value === tabKey) return
  
  activeTab.value = tabKey
  const index = tabList.value.findIndex(item => item.key === tabKey)
  if (index !== -1) {
    currentTabIndex.value = index
  }
  page.value = 1
  hasMore.value = true
  loadOrderList()
}

/**
 * 加载更多
 */
const loadMore = () => {
  if (loading.value || !hasMore.value) return
  
  page.value++
  loadOrderList()
}

/**
 * 格式化时间
 */
const formatTime = (timeStr: string): string => {
  try {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) { // 1天内
      return Math.floor(diff / 3600000) + '小时前'
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  } catch {
    return timeStr
  }
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string): string => {
  return getOrderStatusText(status as OrderStatus)
}

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string): string => {
  const classMap: Record<string, string> = {
    PENDING: 'status-pending',
    DISPENSING: 'status-dispensing',
    COMPLETED: 'status-completed'
  }
  return classMap[status] || ''
}

/**
 * 跳转订单详情
 */
const goToOrderDetail = (orderId: string) => {
  uni.navigateTo({
    url: `/pages/order/detail?id=${orderId}`,
    fail: () => {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    }
  })
}

/**
 * 支付订单
 */
const payOrder = async (orderId: string) => {
  uni.showModal({
    title: '确认支付',
    content: '确定要支付此订单吗？',
    success: async (res) => {
      if (res.confirm) {
        // 显示加载状态
        uni.showLoading({
          title: '支付中...'
        })
        
        try {
          // TODO: 实现真实的支付逻辑
          // await OrderApi.payOrder(orderId)
          
          // 模拟支付成功
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // 立即更新本地数据
          updateLocalOrderStatus(orderId, 'DISPENSING')
          
          uni.hideLoading()
          uni.showToast({
            title: '支付成功',
            icon: 'success'
          })
          
          // 刷新列表和统计数据
          await Promise.all([
            refreshCurrentPageData(),
            loadOrderStatistics()
          ])
          
        } catch (error) {
          uni.hideLoading()
          console.error('支付失败:', error)
          uni.showToast({
            title: '支付失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

/**
 * 取消订单
 */
const cancelOrder = async (orderId: string) => {
  uni.showModal({
    title: '取消订单',
    content: '确定要取消此订单吗？',
    confirmColor: '#ff4757',
    success: async (res) => {
      if (res.confirm) {
        // 显示加载状态
        uni.showLoading({
          title: '取消中...'
        })
        
        try {
          await OrderApi.cancelOrder({ 
            orderId, 
            cancelReason: '用户主动取消' 
          })
          
          // 取消订单后从列表中移除
          const orderIndex = orderList.value.findIndex(order => order.id === orderId)
          if (orderIndex !== -1) {
            orderList.value.splice(orderIndex, 1)
          }
          
          uni.hideLoading()
          uni.showToast({
            title: '订单已取消',
            icon: 'success'
          })
          
          // 刷新列表和统计数据
          await Promise.all([
            refreshCurrentPageData(),
            loadOrderStatistics()
          ])
          
        } catch (error) {
          uni.hideLoading()
          console.error('取消订单失败:', error)
          uni.showToast({
            title: '取消失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

/**
 * 确认取酒
 */
const confirmOrder = async (orderId: string) => {
  uni.showModal({
    title: '确认取酒',
    content: '确认已取到酒品了吗？',
    success: async (res) => {
      if (res.confirm) {
        // 显示加载状态
        uni.showLoading({
          title: '确认中...'
        })
        
        try {
          await OrderApi.confirmOrder(orderId)
          
          // 立即更新本地数据
          updateLocalOrderStatus(orderId, 'COMPLETED')
          
          uni.hideLoading()
          uni.showToast({
            title: '取酒成功',
            icon: 'success'
          })
          
          // 刷新列表和统计数据
          await Promise.all([
            refreshCurrentPageData(),
            loadOrderStatistics()
          ])
          
        } catch (error) {
          uni.hideLoading()
          console.error('确认订单失败:', error)
          uni.showToast({
            title: '确认失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

/**
 * 申请退款
 */
const refundOrder = async (orderId: string) => {
  uni.showModal({
    title: '申请退款',
    content: '确定要申请退款吗？退款将在1-3个工作日内到账。',
    confirmColor: '#ff4757',
    success: async (res) => {
      if (res.confirm) {
        // 显示加载状态
        uni.showLoading({
          title: '申请中...'
        })
        
        try {
          await OrderApi.refundOrder(orderId, '用户申请退款')
          
          // 退款后从列表中移除
          const orderIndex = orderList.value.findIndex(order => order.id === orderId)
          if (orderIndex !== -1) {
            orderList.value.splice(orderIndex, 1)
          }
          
          uni.hideLoading()
          uni.showToast({
            title: '退款申请已提交',
            icon: 'success'
          })
          
          // 刷新列表和统计数据
          await Promise.all([
            refreshCurrentPageData(),
            loadOrderStatistics()
          ])
          
        } catch (error) {
          uni.hideLoading()
          console.error('申请退款失败:', error)
          uni.showToast({
            title: '申请失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

/**
 * 再次购买
 */
const reorderOrder = async (orderId: string) => {
  try {
    const newOrderId = await OrderApi.reorder(orderId)
    
    uni.showToast({
      title: '已添加到购物车',
      icon: 'success'
    })
    
    // 可以跳转到支付页面或购物车
    // uni.navigateTo({
    //   url: `/pages/order/detail?id=${newOrderId}`
    // })
    
  } catch (error) {
    console.error('再次购买失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.order-list-page {
  min-height: 100vh;
  background: #f5f5f5;
  margin: 0;
  padding: 0;
}

.tabs-container {
  background: white;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
  margin: 0;
  padding: 0;
}

.custom-tabs {
  display: flex;
  height: 88rpx;
  align-items: center;
  
  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
    
    .tab-name {
      font-size: 28rpx;
      color: #666;
      font-weight: normal;
      transition: all 0.3s ease;
    }
    
    .tab-count {
      font-size: 24rpx;
      color: #999;
      margin-left: 8rpx;
    }
    
    &.active {
      .tab-name {
        color: #007aff;
        font-weight: 600;
      }
      
      .tab-count {
        color: #007aff;
      }
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 4rpx;
        background: #007aff;
        border-radius: 2rpx;
      }
    }
    
    &:active {
      opacity: 0.7;
    }
  }
}

.debug-info {
  padding: 20rpx;
  background: #f8f9fa;
  font-size: 24rpx;
  color: #666;
  
  text {
    display: block;
    margin-bottom: 10rpx;
  }
}

.order-list {
  padding: 20rpx;
}

// 空状态样式已移除，使用uView Plus的up-empty组件

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 120rpx 40rpx;
  font-size: 28rpx;
  color: #999;
}

.order-item {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
  
  .order-info {
    flex: 1;
    
    .order-no {
      display: block;
      font-size: 28rpx;
      color: #333;
      font-weight: bold;
      margin-bottom: 8rpx;
    }
    
    .order-time {
      display: block;
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .order-status {
    font-size: 26rpx;
    font-weight: bold;
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    
    &.status-pending {
      color: #ff9500;
      background: #fff3e0;
    }
    
    &.status-dispensing {
      color: #007aff;
      background: #e3f2fd;
    }
    
    &.status-completed {
      color: #52c41a;
      background: #f6ffed;
    }
  }
}

.device-info {
  padding: 16rpx 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  
  .device-header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 12rpx;
    
    .device-name {
      font-size: 26rpx;
      color: #333;
      font-weight: 500;
    }
  }
  
  .device-details {
    padding-left: 24rpx;
    
    .device-detail-item {
      display: flex;
      align-items: center;
      margin-bottom: 8rpx;
      gap: 6rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .detail-label {
        font-size: 22rpx;
        color: #666;
        min-width: 120rpx;
      }
      
      .detail-value {
        font-size: 22rpx;
        color: #333;
        
        &.location {
          color: #007aff;
          margin-left: 4rpx;
        }
      }
    }
  }
}

.product-list {
  margin-bottom: 20rpx;
}

.product-item {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .product-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    flex-shrink: 0;
  }
  
  .product-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    
    .product-name {
      font-size: 28rpx;
      color: #333;
      font-weight: 500;
      line-height: 1.4;
    }
    
    .product-spec {
      font-size: 24rpx;
      color: #999;
      margin: 8rpx 0;
    }
    
    .product-price-qty {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .product-price {
        font-size: 30rpx;
        color: #ff4757;
        font-weight: bold;
      }
    }
  }
}

.order-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 20rpx 0;
  border-top: 1rpx solid #f0f0f0;
  margin-bottom: 20rpx;
  
  .total-label {
    font-size: 28rpx;
    color: #333;
  }
  
  .total-price {
    font-size: 32rpx;
    color: #ff4757;
    font-weight: bold;
    margin-left: 10rpx;
  }
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  
  .action-btn {
    padding: 16rpx 32rpx;
    border-radius: 30rpx;
    font-size: 26rpx;
    border: none;
    
    &.primary {
      background: #007aff;
      color: white;
    }
    
    &.secondary {
      background: #f8f9fa;
      color: #666;
      border: 1rpx solid #e9ecef;
    }
    
    &.refund {
      background: #ff4757;
      color: white;
    }
    
    &:active {
      opacity: 0.8;
    }
  }
}

.load-more {
  text-align: center;
  padding: 40rpx;
  font-size: 28rpx;
  color: #666;
}
</style> 