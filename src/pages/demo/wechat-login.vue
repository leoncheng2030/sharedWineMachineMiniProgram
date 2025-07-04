<template>
    <view class="wechat-login-demo">
        <StatusBar />
        
        <view class="container">
            <!-- 页面标题 -->
            <view class="page-title">微信登录演示</view>
            
            <!-- 登录状态显示 -->
            <view class="status-section">
                <view class="status-card">
                    <view class="status-title">登录状态</view>
                    <view class="status-content">
                        <view class="status-item">
                            <text class="label">是否已登录：</text>
                            <text :class="['value', isLoggedIn ? 'success' : 'error']">
                                {{ isLoggedIn ? '是' : '否' }}
                            </text>
                        </view>
                        <view v-if="isLoggedIn && userInfo" class="user-info">
                            <view class="status-item">
                                <text class="label">用户ID：</text>
                                <text class="value">{{ userInfo.id }}</text>
                            </view>
                            <view class="status-item">
                                <text class="label">用户昵称：</text>
                                <text class="value">{{ userInfo.nickname || userInfo.name }}</text>
                            </view>
                            <view class="status-item">
                                <text class="label">手机号：</text>
                                <text class="value">{{ userInfo.phone || '未绑定' }}</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 操作按钮 -->
            <view class="action-section">
                <button 
                    class="action-btn login-btn" 
                    @click="showLogin"
                    :disabled="isLoggingIn"
                    v-if="!isLoggedIn"
                >
                    <u-loading-icon v-if="isLoggingIn" mode="flower" color="#fff" size="20"></u-loading-icon>
                    <text v-else>微信登录</text>
                </button>

                <button 
                    class="action-btn refresh-btn" 
                    @click="handleRefreshUserInfo"
                    v-if="isLoggedIn"
                >
                    刷新用户信息
                </button>

                <button 
                    class="action-btn logout-btn" 
                    @click="handleLogout"
                    v-if="isLoggedIn"
                >
                    退出登录
                </button>

                <button 
                    class="action-btn test-btn" 
                    @click="testAuthAction"
                >
                    测试需要登录的操作
                </button>
            </view>

            <!-- API测试区域 -->
            <view class="test-section" v-if="isLoggedIn">
                <view class="test-title">API测试</view>
                <button class="test-item" @click="testGetUserInfo">
                    测试获取用户信息
                </button>
                <button class="test-item" @click="testCheckLoginStatus">
                    测试检查登录状态
                </button>
            </view>

            <!-- 开发信息 -->
            <view class="dev-info">
                <view class="dev-title">开发信息</view>
                <view class="dev-item">
                    <text class="label">环境：</text>
                    <text class="value">{{ envInfo.envVersion }}</text>
                </view>
                <view class="dev-item">
                    <text class="label">AppID：</text>
                    <text class="value">{{ envInfo.appId }}</text>
                </view>
            </view>
        </view>

        <!-- 微信登录弹窗 -->
        <AuthModal 
            v-model:show="showAuthModal" 
            @loginSuccess="handleLoginSuccess"
        />
    </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { StatusBar, AuthModal } from '@/components';
import { useAuth, useActionAuth } from '@/hooks';
import { getWechatEnvInfo } from '@/utils/wechat';

// 页面配置
defineOptions({
    name: 'WechatLoginDemo'
});

// Hooks
const {
    isLoggedIn,
    userInfo,
    isLoggingIn,
    showAuthModal,
    requireAuth,
    handleLoginSuccess,
    logout,
    refreshUserInfo
} = useAuth();

const { executeWithAuth } = useActionAuth();

// 获取环境信息
const envInfo = getWechatEnvInfo();

// 页面加载
onMounted(async () => {
    // 页面初始化
});

/**
 * 显示登录弹窗
 */
const showLogin = async () => {
    await requireAuth();
};

/**
 * 退出登录
 */
const handleLogout = async () => {
    uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: async (res) => {
            if (res.confirm) {
                await logout();
            }
        }
    });
};

/**
 * 刷新用户信息
 */
const handleRefreshUserInfo = async () => {
    try {
        uni.showLoading({ title: '刷新中...' });
        await refreshUserInfo();
        uni.hideLoading();
        uni.showToast({
            title: '刷新成功',
            icon: 'success'
        });
    } catch (error: any) {
        uni.hideLoading();
        uni.showToast({
            title: '刷新失败',
            icon: 'none'
        });
    }
};

/**
 * 测试需要登录的操作
 */
const testAuthAction = async () => {
    await executeWithAuth(async () => {
        uni.showModal({
            title: '操作成功',
            content: '这是一个需要登录才能执行的操作',
            showCancel: false
        });
    });
};

/**
 * 测试获取用户信息
 */
const testGetUserInfo = async () => {
    try {
        uni.showLoading({ title: '获取中...' });
        await refreshUserInfo();
        uni.hideLoading();
        
        uni.showModal({
            title: '用户信息',
            content: JSON.stringify(userInfo.value, null, 2),
            showCancel: false
        });
    } catch (error: any) {
        uni.hideLoading();
        uni.showToast({
            title: '获取失败',
            icon: 'none'
        });
    }
};

/**
 * 测试检查登录状态
 */
const testCheckLoginStatus = async () => {
    try {
        uni.showLoading({ title: '检查中...' });
        const isValid = await requireAuth();
        uni.hideLoading();
        
        uni.showModal({
            title: '登录状态检查',
            content: `登录状态: ${isValid ? '有效' : '无效'}`,
            showCancel: false
        });
    } catch (error: any) {
        uni.hideLoading();
        uni.showToast({
            title: '检查失败',
            icon: 'none'
        });
    }
};
</script>

<style lang="scss" scoped>
.wechat-login-demo {
    min-height: 100vh;
    background: #f8f8f8;
}

.container {
    padding: 20rpx;
}

.page-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    text-align: center;
    margin-bottom: 40rpx;
}

.status-section {
    margin-bottom: 40rpx;
}

.status-card {
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.status-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
}

.status-content {
    .status-item {
        display: flex;
        align-items: center;
        margin-bottom: 16rpx;
        
        .label {
            font-size: 28rpx;
            color: #666;
            min-width: 160rpx;
        }
        
        .value {
            font-size: 28rpx;
            color: #333;
            
            &.success {
                color: #52c41a;
            }
            
            &.error {
                color: #ff4d4f;
            }
        }
    }
    
    .user-info {
        margin-top: 20rpx;
        padding-top: 20rpx;
        border-top: 2rpx solid #f0f0f0;
    }
}

.action-section {
    margin-bottom: 40rpx;
}

.action-btn {
    width: 100%;
    height: 88rpx;
    border-radius: 44rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: 500;
    margin-bottom: 20rpx;
    
    &.login-btn {
        background: linear-gradient(135deg, #007aff 0%, #5ac8fa 100%);
        color: #fff;
        box-shadow: 0 8rpx 20rpx rgba(0, 122, 255, 0.3);
        
        &:disabled {
            opacity: 0.6;
        }
    }
    
    &.refresh-btn {
        background: #52c41a;
        color: #fff;
    }
    
    &.logout-btn {
        background: #ff4d4f;
        color: #fff;
    }
    
    &.test-btn {
        background: #faad14;
        color: #fff;
    }
}

.test-section {
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 40rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.test-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
}

.test-item {
    width: 100%;
    height: 72rpx;
    background: #f8f8f8;
    border: 2rpx solid #e0e0e0;
    border-radius: 12rpx;
    color: #333;
    font-size: 28rpx;
    margin-bottom: 16rpx;
    
    &:last-child {
        margin-bottom: 0;
    }
}

.dev-info {
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.dev-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
}

.dev-item {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    
    .label {
        font-size: 28rpx;
        color: #666;
        min-width: 120rpx;
    }
    
    .value {
        font-size: 28rpx;
        color: #333;
        word-break: break-all;
    }
}
</style> 