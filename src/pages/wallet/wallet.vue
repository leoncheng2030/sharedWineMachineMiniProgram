<template>
  <AuthGuard 
    :require-auth="true" 
    failed-title="访问受限"
    failed-message="请先登录后查看钱包信息"
    loading-text="正在加载钱包信息..."
  >
    <view class="wallet-page">
      <!-- 账户总览卡片 -->
    <view class="account-overview">
      <view class="account-header">
        <view class="account-title">
          <text class="title-icon">💰</text>
          <text class="title-text">我的钱包</text>
        </view>
        <view class="account-status" :class="getStatusClass(userInfo?.commissionAccountStatus)">
          {{ getStatusText(userInfo?.commissionAccountStatus) }}
        </view>
      </view>
      
      <view class="balance-section">
        <view class="main-balance">
          <view class="balance-label">总余额(元)</view>
          <view class="balance-amount">¥{{ formatMoney(userInfo?.commissionBalance) }}</view>
        </view>
        
        <view class="balance-breakdown">
          <view class="breakdown-item">
            <view class="breakdown-label">可用余额</view>
            <view class="breakdown-value">¥{{ formatMoney(userInfo?.availableBalance) }}</view>
          </view>
          <view class="breakdown-item">
            <view class="breakdown-label">冻结余额</view>
            <view class="breakdown-value frozen">¥{{ formatMoney(userInfo?.frozenBalance) }}</view>
          </view>
        </view>
      </view>
      
      <!-- 快捷操作按钮 -->
      <view class="action-buttons">
        <view class="action-btn primary" @click="goToWithdraw">
          <text class="btn-icon">💸</text>
          <text class="btn-text">提现</text>
        </view>
        <view class="action-btn secondary" @click="goToRecords">
          <text class="btn-icon">📊</text>
          <text class="btn-text">明细</text>
        </view>
        <view class="action-btn secondary" @click="goToIncome">
          <text class="btn-icon">💎</text>
          <text class="btn-text">收益</text>
        </view>
      </view>
    </view>

    <!-- 收益统计 -->
    <view class="income-stats">
      <view class="stats-header">
        <text class="stats-title">收益统计</text>
        <text class="stats-period" @click="showPeriodSelector">本月 ▼</text>
      </view>
      
      <view class="stats-grid">
        <view class="stats-item">
          <view class="stats-value">¥{{ formatMoney(userInfo?.totalCommissionIncome) }}</view>
          <view class="stats-label">累计佣金</view>
        </view>
        <view class="stats-item">
          <view class="stats-value">¥{{ formatMoney(userInfo?.totalWithdrawAmount) }}</view>
          <view class="stats-label">累计提现</view>
        </view>
        <view class="stats-item">
          <view class="stats-value">¥{{ formatMoney(monthlyIncome) }}</view>
          <view class="stats-label">本月收益</view>
        </view>
        <view class="stats-item">
          <view class="stats-value">{{ orderCount }}</view>
          <view class="stats-label">订单数量</view>
        </view>
      </view>
    </view>



    <!-- 底部安全提示 -->
    <view class="security-notice">
      <view class="notice-icon">🛡️</view>
      <view class="notice-text">
        <text>您的资金安全由平台保障，如有疑问请联系客服</text>
      </view>
    </view>
    </view>
  </AuthGuard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/hooks'
import { onLoad } from '@dcloudio/uni-app'
import { WalletApi, type AccountInfo } from '@/api/wallet'
import { OrderApi } from '@/api/order'

// 使用认证系统
const { isLoggedIn, userInfo, refreshUserInfo, requireAuth } = useAuth()

// 响应式数据
const monthlyIncome = ref(0)
const orderCount = ref(0)
const loading = ref(false)

// 页面加载
onLoad(async () => {
  console.log('💰 钱包页面加载，当前登录状态:', isLoggedIn.value)
  // AuthGuard组件已经处理了认证，这里不需要额外检查
})

// 页面显示时刷新数据
onMounted(async () => {
  if (isLoggedIn.value) {
    await loadWalletData()
  }
})

/**
 * 加载钱包数据
 */
const loadWalletData = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    uni.showLoading({ title: '加载中...' })
    
    // 刷新用户信息
    await refreshUserInfo()
    
    // 并行加载统计数据
    await Promise.all([
      loadFlowStatistics(),
      loadOrderStatistics()
    ])
    
    uni.hideLoading()
  } catch (error) {
    uni.hideLoading()
    console.error('加载钱包数据失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 加载流水统计数据
 */
const loadFlowStatistics = async () => {
  try {
    const statistics = await WalletApi.getFlowStatistics()
    // 使用本月收入作为月度收益
    monthlyIncome.value = statistics.monthIncome || 0
    console.log('📊 流水统计数据:', statistics)
  } catch (error) {
    console.error('加载流水统计失败:', error)
    // 失败时保持默认值
    monthlyIncome.value = 0
  }
}

/**
 * 加载订单统计数据
 */
const loadOrderStatistics = async () => {
  try {
    const statistics = await OrderApi.getOrderStatistics()
    // 使用总订单数
    orderCount.value = statistics.totalCount || 0
    console.log('📊 订单统计数据:', statistics)
  } catch (error) {
    console.error('加载订单统计失败:', error)
    // 失败时保持默认值
    orderCount.value = 0
  }
}

/**
 * 加载月度数据
 * @deprecated 已替换为loadFlowStatistics和loadOrderStatistics
 */
const loadMonthlyData = async () => {
  // 此方法已废弃，保留以避免破坏性更改
  console.warn('loadMonthlyData方法已废弃，请使用loadFlowStatistics和loadOrderStatistics')
}

/**
 * 格式化金额
 */
const formatMoney = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '0.00'
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) {
    return '0.00'
  }
  return num.toFixed(2)
}

/**
 * 格式化日期
 */
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) {
    return '--'
  }
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return '--'
    }
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return '--'
  }
}



/**
 * 获取状态文本
 */
const getStatusText = (status: string | null | undefined): string => {
  if (!status) return '未知'
  
  switch (status.toUpperCase()) {
    case 'NORMAL':
      return '正常'
    case 'FROZEN':
      return '冻结'
    case 'DISABLED':
      return '禁用'
    case 'INACTIVE':
      return '未激活'
    default:
      return status
  }
}

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string | null | undefined): string => {
  if (!status) return 'status-unknown'
  
  switch (status.toUpperCase()) {
    case 'NORMAL':
      return 'status-normal'
    case 'FROZEN':
      return 'status-frozen'
    case 'DISABLED':
      return 'status-disabled'
    case 'INACTIVE':
      return 'status-inactive'
    default:
      return 'status-unknown'
  }
}



/**
 * 跳转到提现页面
 */
const goToWithdraw = () => {
  if (!userInfo.value?.commissionAccountStatus || userInfo.value.commissionAccountStatus !== 'NORMAL') {
    uni.showToast({
      title: '账户状态异常，无法提现',
      icon: 'none'
    })
    return
  }
  
  if (!userInfo.value?.availableBalance || userInfo.value.availableBalance <= 0) {
    uni.showToast({
      title: '可用余额不足',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: '/pages/wallet/withdraw'
  })
}

/**
 * 跳转到交易记录页面
 */
const goToRecords = () => {
  uni.navigateTo({
    url: '/pages/wallet/records'
  })
}

/**
 * 跳转到收益页面
 */
const goToIncome = () => {
  uni.navigateTo({
    url: '/pages/wallet/income'
  })
}

/**
 * 显示时间段选择器
 */
const showPeriodSelector = () => {
  uni.showActionSheet({
    itemList: ['本月', '上月', '最近3个月', '最近6个月'],
    success: (res) => {
      console.log('选择时间段:', res.tapIndex)
      // TODO: 根据选择的时间段重新加载数据
    }
  })
}


</script>

<style lang="scss" scoped>
.wallet-page {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 40rpx;
}

.account-overview {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  margin: 20rpx;
  border-radius: 24rpx;
  padding: 40rpx;
  color: white;
  box-shadow: 0 8rpx 32rpx rgba(82, 196, 26, 0.3);
  
  .account-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40rpx;
    
    .account-title {
      display: flex;
      align-items: center;
      
      .title-icon {
        font-size: 36rpx;
        margin-right: 16rpx;
      }
      
      .title-text {
        font-size: 36rpx;
        font-weight: bold;
      }
    }
    
    .account-status {
      padding: 8rpx 20rpx;
      border-radius: 20rpx;
      font-size: 24rpx;
      background: rgba(255, 255, 255, 0.2);
      
      &.status-normal {
        background: rgba(82, 196, 26, 0.8);
      }
      
      &.status-frozen {
        background: rgba(250, 173, 20, 0.8);
      }
      
      &.status-disabled {
        background: rgba(255, 77, 79, 0.8);
      }
    }
  }
  
  .balance-section {
    margin-bottom: 40rpx;
    
    .main-balance {
      text-align: center;
      margin-bottom: 30rpx;
      
      .balance-label {
        font-size: 28rpx;
        opacity: 0.9;
        margin-bottom: 12rpx;
      }
      
      .balance-amount {
        font-size: 72rpx;
        font-weight: bold;
        text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
      }
    }
    
    .balance-breakdown {
      display: flex;
      justify-content: space-around;
      padding: 30rpx 0;
      border-top: 1rpx solid rgba(255, 255, 255, 0.2);
      
      .breakdown-item {
        text-align: center;
        
        .breakdown-label {
          font-size: 24rpx;
          opacity: 0.8;
          margin-bottom: 8rpx;
        }
        
        .breakdown-value {
          font-size: 32rpx;
          font-weight: 600;
          
          &.frozen {
            color: #ffa940;
          }
        }
      }
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 20rpx;
    
    .action-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24rpx 20rpx;
      border-radius: 16rpx;
      transition: all 0.3s ease;
      
      &.primary {
        background: rgba(255, 255, 255, 0.9);
        color: #52c41a;
      }
      
      &.secondary {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      .btn-icon {
        font-size: 32rpx;
        margin-bottom: 8rpx;
      }
      
      .btn-text {
        font-size: 24rpx;
        font-weight: 500;
      }
    }
  }
}

.income-stats {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .stats-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .stats-period {
      font-size: 28rpx;
      color: #52c41a;
      padding: 8rpx 16rpx;
      border-radius: 12rpx;
      background: #f6ffed;
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30rpx;
    
    .stats-item {
      text-align: center;
      
      .stats-value {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .stats-label {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
}



.security-notice {
  display: flex;
  align-items: center;
  background: #f6ffed;
  margin: 20rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  border: 1rpx solid #b7eb8f;
  
  .notice-icon {
    font-size: 32rpx;
    margin-right: 16rpx;
  }
  
  .notice-text {
    flex: 1;
    
    text {
      font-size: 24rpx;
      color: #52c41a;
      line-height: 1.4;
    }
  }
}
</style> 