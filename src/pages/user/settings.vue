<template>
  <view class="settings-page">
    <view class="settings-content">
      <!-- 账户设置 -->
      <view class="settings-section">
        <view class="section-title">账户设置</view>
        <view class="settings-list">
          <view class="settings-item" @click="goToPage('/pages/user/profile')">
            <view class="item-left">
              <u-icon name="account" size="20" color="#666"></u-icon>
              <text class="item-text">个人资料</text>
            </view>
            <view class="item-right">
              <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
            </view>
          </view>
          
          <view class="settings-item" @click="goToPage('/pages/user/security')">
            <view class="item-left">
              <u-icon name="lock" size="20" color="#666"></u-icon>
              <text class="item-text">账户安全</text>
            </view>
            <view class="item-right">
              <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
            </view>
          </view>
        </view>
      </view>

      <!-- 通用设置 -->
      <view class="settings-section">
        <view class="section-title">通用设置</view>
        <view class="settings-list">
          <view class="settings-item" @click="goToPage('/pages/user/notifications')">
            <view class="item-left">
              <u-icon name="bell" size="20" color="#666"></u-icon>
              <text class="item-text">消息通知</text>
            </view>
            <view class="item-right">
              <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
            </view>
          </view>
          
          <view class="settings-item" @click="goToPage('/pages/user/privacy')">
            <view class="item-left">
              <u-icon name="eye" size="20" color="#666"></u-icon>
              <text class="item-text">隐私设置</text>
            </view>
            <view class="item-right">
              <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
            </view>
          </view>
          
          <view class="settings-item" @click="goToPage('/pages/user/language')">
            <view class="item-left">
              <u-icon name="globe" size="20" color="#666"></u-icon>
              <text class="item-text">语言设置</text>
            </view>
            <view class="item-right">
              <text class="item-value">简体中文</text>
              <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
            </view>
          </view>
        </view>
      </view>

      <!-- 帮助与反馈 -->
      <view class="settings-section">
        <view class="section-title">帮助与反馈</view>
        <view class="settings-list">
          <view class="settings-item" @click="goToPage('/pages/help/feedback')">
            <view class="item-left">
              <u-icon name="chat" size="20" color="#666"></u-icon>
              <text class="item-text">意见反馈</text>
            </view>
            <view class="item-right">
              <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
            </view>
          </view>
          
          <view class="settings-item" @click="goToPage('/pages/help/about')">
            <view class="item-left">
              <u-icon name="info-circle" size="20" color="#666"></u-icon>
              <text class="item-text">关于我们</text>
            </view>
            <view class="item-right">
              <text class="item-value">v1.0.0</text>
              <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
            </view>
          </view>
        </view>
      </view>

      <!-- 开发者选项 -->
      <view class="settings-section" v-if="isDevelopment">
        <view class="section-title">开发者选项</view>
        <view class="settings-list">
          <view class="settings-item danger" @click="handleResetData">
            <view class="item-left">
              <u-icon name="trash" size="20" color="#ff4757"></u-icon>
              <text class="item-text danger-text">完全重置数据</text>
            </view>
            <view class="item-right">
              <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <view class="logout-btn" @click="handleLogout">
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '@/hooks'
import { useAuthStore } from '@/store/modules/auth'

// 使用认证store
const authStore = useAuthStore()

// 使用新的认证系统
const { logout } = useAuth()

/**
 * 是否为开发环境
 */
const isDevelopment = computed(() => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
})

/**
 * 页面跳转
 */
const goToPage = (url: string) => {
  // 对于不存在的页面，显示开发中提示
  const developingPages = [
    '/pages/user/profile',
    '/pages/user/security',
    '/pages/user/notifications',
    '/pages/user/privacy',
    '/pages/user/language',
    '/pages/help/feedback',
    '/pages/help/about'
  ]

  if (developingPages.includes(url)) {
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
 * 退出登录
 */
const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    confirmColor: '#ff4757',
    success: async (res) => {
      if (res.confirm) {
        await logout()
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        })
        // 退出登录后返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    }
  })
}

/**
 * 完全重置数据（开发者选项）
 */
const handleResetData = () => {
  uni.showModal({
    title: '⚠️ 危险操作',
    content: '这将完全清除所有用户数据，包括老用户标识。确定继续吗？',
    confirmColor: '#ff4757',
    confirmText: '确定重置',
    success: async (res) => {
      if (res.confirm) {
        try {
          await authStore.resetUserData()
          
          // 重置成功后，跳转到首页
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            })
          }, 1500)
        } catch (error) {
          console.error('重置数据失败:', error)
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.settings-header {
  background: white;
}

.settings-content {
  padding: 20rpx;
}

.settings-section {
  background: white;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;

  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    padding: 30rpx 30rpx 10rpx;
  }

  .settings-list {
    .settings-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx;
      border-bottom: 1rpx solid #f0f0f0;
      transition: background-color 0.2s;

      &:last-child {
        border-bottom: none;
      }

      &:active {
        background-color: #f8f9fa;
      }

      &.danger {
        &:active {
          background-color: #fff5f5;
        }
      }

      .item-left {
        display: flex;
        align-items: center;
        gap: 20rpx;
        flex: 1;

        .item-text {
          font-size: 30rpx;
          color: #333;

          &.danger-text {
            color: #ff4757;
          }
        }
      }

      .item-right {
        display: flex;
        align-items: center;
        gap: 10rpx;

        .item-value {
          font-size: 26rpx;
          color: #666;
        }
      }
    }
  }
}

.logout-section {
  padding: 40rpx;

  .logout-btn {
    background: #ff4757;
    color: white;
    text-align: center;
    padding: 30rpx;
    border-radius: 20rpx;
    box-shadow: 0 8rpx 20rpx rgba(255, 71, 87, 0.3);
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
      box-shadow: 0 4rpx 12rpx rgba(255, 71, 87, 0.4);
    }

    text {
      font-size: 32rpx;
      font-weight: 500;
    }
  }
}
</style> 