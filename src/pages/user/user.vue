<template>
  <view class="user-page">
    
    <view class="user-header">
      <!-- 未登录状态 -->
      <view v-if="!isLoggedIn" class="login-section">
        <view class="login-prompt">
          <image src="/static/images/icon_user.png" class="avatar" mode="aspectFill" />
          <view class="login-info">
            <view class="login-title">欢迎使用共享售酒机</view>
            <view class="login-subtitle">登录后享受更多服务</view>
          </view>
          <button class="login-btn" @click="showLogin">
            <text>立即登录</text>
          </button>
        </view>
      </view>
      
      <!-- 已登录状态 - 用户信息区域 -->
      <view v-else class="user-info">
        <image :src="userInfo?.avatar || '/static/images/icon_user.png'" class="avatar" mode="aspectFill" />
        <view class="user-details">
          <view class="phone-number">{{ userInfo?.nickname || '186****2001' }}</view>
          <view class="user-id">{{ userInfo?.phone || '' }}</view>
        </view>

        <!-- 头部图标 -->
        <view class="header-icons">
          <view class="icon-item">
            <up-icon name="scan" size="18" color="#666"></up-icon>
          </view>
          <view class="icon-item" @click="goToSettings">
            <up-icon name="setting" size="18" color="#666"></up-icon>
          </view>
          <view class="icon-item" @click="goToMessageCenter">
            <up-icon name="chat" size="18" color="#666"></up-icon>
          </view>
        </view>

        <!-- 会员码标签 -->
        <view class="member-code">
          <text>会员码</text>
        </view>
      </view>
    </view>

    <!-- 统计数据区域 - 仅登录后显示 -->
    <view v-if="isLoggedIn" class="stats-section">
      <view class="stats-item" @click="goToWallet">
        <view class="stats-value">{{ formatMoney(userInfo?.commissionBalance || 0) }}</view>
        <view class="stats-label">余额</view>
      </view>
      <view class="stats-item" @click="goToWallet">
        <view class="stats-value">{{ formatMoney(userInfo?.totalCommissionIncome || 0) }}</view>
        <view class="stats-label">累计佣金</view>
      </view>
      <view class="stats-item" @click="goToWallet">
        <view class="stats-value">{{ formatMoney(userInfo?.availableBalance || 0) }}</view>
        <view class="stats-label">可用余额</view>
      </view>
      <view class="stats-item" @click="goToWallet">
        <view class="stats-value">{{ formatMoney(userInfo?.frozenBalance || 0) }}</view>
        <view class="stats-label">冻结余额</view>
      </view>
    </view>
    
    <!-- 未登录状态的提示区域 -->
    <view v-else class="guest-stats-section">
      <view class="guest-prompt">
        <view class="guest-icon">🔒</view>
        <view class="guest-text">登录后查看您的数据统计</view>
      </view>
    </view>


    <!-- 订单中心 -->
    <view class="order-center">
      <view class="section-header">
        <text class="section-title">订单中心</text>
      </view>
      <u-grid :col="4" :border="false">
        <u-grid-item @click="goToOrderList('all')">
          <view class="order-item-content">
            <up-icon name="chat-fill" size="60px" color="#666" label="全部" label-pos="bottom" label-size="25rpx" label-color="#333"></up-icon>
          </view>
        </u-grid-item>
        <u-grid-item @click="goToOrderList('PENDING')">
          <view class="order-item-content">
            <up-icon name="account" size="60px" color="#666" label="待支付" label-pos="bottom" label-size="25rpx" label-color="#333"></up-icon>
          </view>
        </u-grid-item>
        <u-grid-item @click="goToOrderList('processing')">
          <view class="order-item-content">
            <up-icon name="bag" size="60px" color="#666" label="待取酒" label-pos="bottom" label-size="25rpx" label-color="#333"></up-icon>
          </view>
        </u-grid-item>
        <u-grid-item @click="goToOrderList('COMPLETED')">
          <view class="order-item-content">
            <up-icon name="car" size="60px" color="#666" label="已完成" label-pos="bottom" label-size="25rpx" label-color="#333"></up-icon>
          </view>
        </u-grid-item>
      </u-grid>
    </view>

    <!-- 我的服务 -->
    <view class="my-services">
      <view class="section-title">我的服务</view>
      <u-grid :col="4" :border="false">
        <u-grid-item @click="goToMyDevices" v-if="isLoggedIn">
          <view class="grid-item-content">
            <up-icon name="setting" size="60px" color="#666" label="我的设备" label-pos="bottom" label-size="25rpx" label-color="#333"></up-icon>
          </view>
        </u-grid-item>
      </u-grid>
    </view>



    <!-- 登录弹窗 -->
    <AuthModal :show="authStore.showAuthModal" @update:show="(value) => authStore.showAuthModal = value"
      @loginSuccess="handleLoginSuccess" />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '@/hooks'
import { useAuthStore } from '@/store/modules/auth'
import { useShareAppMessage } from '@/hooks/user'
import { onLoad } from '@dcloudio/uni-app'
import AuthModal from '@/components/authModal/index.vue'

// 微信分享
useShareAppMessage()

// 使用认证store
const authStore = useAuthStore()

// 使用新的认证系统
const {
  isLoggedIn,
  userInfo,
  showAuthModal,
  requireAuth,
  handleLoginSuccess: onLoginSuccess,
  logout,
  refreshUserInfo
} = useAuth()

// 页面加载时检查登录状态
onLoad(async () => {
  console.log('🏠 用户页面加载，检查登录状态...')
  
  // 给应用启动时的token恢复逻辑一些时间
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 使用简单的本地状态检查
  const isValid = authStore.isLoggedIn
  
  console.log('🔐 登录状态检查结果:', {
    isLoggedIn: isValid,
    hasToken: !!authStore.token,
    hasUserInfo: !!authStore.userInfo
  })
  
  // 如果已经登录，尝试刷新用户信息
  if (isValid) {
    try {
      await authStore.refreshUserInfo()
      console.log('✅ 用户信息刷新成功')
    } catch (error) {
      console.warn('⚠️ 用户信息刷新失败，可能需要重新登录:', error)
      // 刷新失败时不立即显示登录弹窗，让用户主动触发
    }
  }
  // 未登录状态下不自动弹出登录框，让用户主动触发
})



// 页面显示时刷新用户信息
onMounted(async () => {
  if (isLoggedIn.value) {
    await refreshUserInfo()
  }
})



/**
 * 跳转到钱包页面
 */
const goToWallet = () => {
  if (!isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  uni.navigateTo({
    url: '/pages/wallet/wallet',
    fail: (err) => {
      console.error('跳转钱包页面失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 显示登录弹窗
 */
const showLogin = async () => {
  authStore.showAuthModal = true
}

/**
 * 页面跳转
 */
const goToPage = (url: string) => {
  // 对于不存在的页面，显示开发中提示
  const developingPages = [
    '/pages/newbie/exclusive',
    '/pages/lottery/records',
    '/pages/coupon/center',
    '/pages/points/exchange',
    '/pages/user/level',
    '/pages/contact/service',
    '/pages/user/favorites',
    '/pages/coupon/list',
    '/pages/member/vip',
    '/pages/points/center',
    '/pages/distribution/apply',
    '/pages/checkin/center',
    '/pages/order/refund'
  ]

  const pageUrl = url.split('?')[0]
  if (developingPages.includes(pageUrl)) {
    uni.showToast({
      title: '功能开发中',
      icon: 'none'
    })
    return
  }

  uni.navigateTo({
    url,
    fail: (err) => {
      console.error('页面跳转失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}



/**
 * 跳转到设置页面
 */
const goToSettings = () => {
  uni.navigateTo({
    url: '/pages/user/settings',
    fail: (err) => {
      console.error('跳转设置页面失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 跳转到消息中心
 */
const goToMessageCenter = () => {
  uni.navigateTo({
    url: '/pages/message/center',
    fail: (err) => {
      console.error('跳转消息中心失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 跳转到订单列表
 */
const goToOrderList = (status: string) => {
  const url = status === 'all' ? '/pages/order/list' : `/pages/order/list?status=${status}`
  uni.navigateTo({
    url,
    fail: (err) => {
      console.error('跳转订单列表失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 跳转到设备列表
 */
const goToDeviceList = () => {
  uni.navigateTo({
    url: '/pages/device/list',
    fail: (err) => {
      console.error('跳转设备列表失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 跳转到我的设备
 */
const goToMyDevices = () => {
  if (!isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: '/pages/device/my-devices',
    fail: (err) => {
      console.error('跳转我的设备失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 登录成功回调
 */
const handleLoginSuccess = () => {
  uni.showToast({
    title: '登录成功',
    icon: 'success'
  })
  // 登录成功后刷新用户信息
  setTimeout(() => {
    refreshUserInfo()
  }, 1000)
}

/**
 * 刷新用户信息
 */
const handleRefreshUserInfo = async () => {
  if (!isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  try {
    uni.showLoading({ title: '刷新中...' })
    await refreshUserInfo()
    uni.hideLoading()
    uni.showToast({
      title: '刷新成功',
      icon: 'success'
    })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '刷新失败',
      icon: 'none'
    })
  }
}

/**
 * 格式化金额
 */
const formatMoney = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '0'
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) {
    return '0'
  }
  return Math.floor(num).toString()
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


</script>

<style lang="scss" scoped>
.bg {
  background-size: cover;
  background-repeat: no-repeat;
  background-color: #fff;
}

.user-page {
  min-height: 100vh;
  background: #f5f5f5;
}



.user-header {
  background: white;
  padding: 0rpx 40rpx;

  .login-section {
    padding: 40rpx 0;
    
    .login-prompt {
      display: flex;
      align-items: center;
      gap: 24rpx;
      
      .avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 60rpx;
        flex-shrink: 0;
        opacity: 0.6;
      }
      
      .login-info {
        flex: 1;
        
        .login-title {
          font-size: 36rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .login-subtitle {
          font-size: 28rpx;
          color: #666;
        }
      }
      
      .login-btn {
        background: linear-gradient(135deg, #007aff, #5ac8fa);
        color: white;
        border: none;
        border-radius: 50rpx;
        padding: 20rpx 40rpx;
        font-size: 28rpx;
        font-weight: bold;
        
        &:active {
          opacity: 0.8;
        }
      }
    }
  }

  .user-info {
    display: flex;
    align-items: flex-start;
    position: relative;
    padding-top: 0rpx;

    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      margin-right: 30rpx;
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 120rpx;

      .phone-number {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
      }

      .user-id {
        font-size: 28rpx;
        color: #666;
      }
    }

    .header-icons {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      gap: 20rpx;

          .icon-item {
      width: 40rpx;
      height: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 20rpx;
      transition: all 0.2s ease;
      
      &:active {
        background: rgba(0, 0, 0, 0.1);
        transform: scale(0.95);
      }
    }
    }

    .member-code {
      position: absolute;
      bottom: 0;
      right: 0;
      background: #fff3cd;
      border: 1rpx solid #ffeaa7;
      border-radius: 30rpx;
      padding: 8rpx 16rpx;

      text {
        font-size: 22rpx;
        color: #856404;
      }
    }
  }
}

.stats-section {
  background: white;
  padding: 30rpx 40rpx;
  display: flex;
  justify-content: space-between;
  border-bottom: 1rpx solid #f0f0f0;

  .stats-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
    cursor: pointer;
    transition: opacity 0.2s;

    &:active {
      opacity: 0.7;
    }

    .stats-value {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 8rpx;
    }

    .stats-label {
      font-size: 24rpx;
      color: #666;
    }

    &:not(:last-child)::after {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 1rpx;
      height: 40rpx;
      background: #f0f0f0;
    }
  }
}

.guest-stats-section {
  background: white;
  margin: 20rpx 40rpx;
  border-radius: 20rpx;
  padding: 40rpx;
  
  .guest-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16rpx;
    
    .guest-icon {
      font-size: 60rpx;
      opacity: 0.5;
    }
    
    .guest-text {
      font-size: 26rpx;
      color: #999;
    }
  }
}

.member-privilege {
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
  margin: 20rpx 40rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  color: white;

  .member-info {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 20rpx;

    .member-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8rpx;

      .member-level {
        font-size: 32rpx;
        font-weight: bold;
      }

      .member-benefit {
        font-size: 24rpx;
        opacity: 0.9;
      }
    }
  }

  .privilege-actions {
    display: flex;
    gap: 40rpx;
    margin-bottom: 20rpx;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;

      .action-text {
        font-size: 22rpx;
      }
    }
  }

  .upgrade-tip {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 40rpx;
    padding: 16rpx 24rpx;

    .tip-icons {
      display: flex;
      gap: 8rpx;
      margin-right: 16rpx;


    }

    .tip-text {
      flex: 1;
      font-size: 24rpx;
    }

    .get-btn {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 30rpx;
      padding: 8rpx 20rpx;
      font-size: 22rpx;
    }
  }
}

.order-center {
  background: white;
  margin-top: 20rpx;
  padding: 30rpx 40rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .view-all {
      font-size: 28rpx;
      color: #999;
    }
  }

  .order-item-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 0;
  }
}

.my-services {
  background: white;
  margin-top: 20rpx;
  padding: 30rpx 40rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 30rpx;
  }

  .grid-item-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 0;
  }
}


</style>