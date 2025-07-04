<template>
    <view class="auth-guard">
        <!-- 认证通过，显示内容 -->
        <view v-if="authState.isAuthenticated && !authState.isLoading" class="auth-content">
            <slot />
        </view>
        
        <!-- 认证检查中 -->
        <view v-else-if="authState.isLoading" class="auth-loading">
            <view class="loading-container">
                <view class="loading-spinner"></view>
                <text class="loading-text">{{ loadingText }}</text>
            </view>
        </view>
        
        <!-- 认证失败 -->
        <view v-else class="auth-failed">
            <view class="failed-container">
                <view class="failed-icon">🔒</view>
                <text class="failed-title">{{ failedTitle }}</text>
                <text class="failed-message">{{ failedMessage }}</text>
                
                <view class="failed-actions">
                    <button 
                        class="retry-btn" 
                        @click="handleRetry"
                        :disabled="authState.isRetrying"
                    >
                        {{ authState.isRetrying ? '重试中...' : '重新验证' }}
                    </button>
                    
                    <button 
                        class="login-btn" 
                        @click="handleLogin"
                        v-if="!authState.isAuthenticated"
                    >
                        去登录
                    </button>
                </view>
            </view>
        </view>
        
        <!-- 权限不足 -->
        <view v-if="authState.isAuthenticated && !hasRequiredPermission" class="permission-denied">
            <view class="denied-container">
                <view class="denied-icon">⚠️</view>
                <text class="denied-title">权限不足</text>
                <text class="denied-message">您没有访问此页面的权限</text>
                
                <button class="back-btn" @click="handleGoBack">
                    返回上一页
                </button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuth } from '@/hooks/useAuth';
import { authGuard, permissionManager } from '@/utils/auth';

interface Props {
    /** 是否需要认证 */
    requireAuth?: boolean;
    /** 需要的权限代码列表 */
    permissions?: string[];
    /** 需要的角色代码列表 */
    roles?: string[];
    /** 认证失败时的标题 */
    failedTitle?: string;
    /** 认证失败时的消息 */
    failedMessage?: string;
    /** 加载时的文本 */
    loadingText?: string;
    /** 认证失败时的回调页面 */
    fallbackUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
    requireAuth: true,
    permissions: () => [],
    roles: () => [],
    failedTitle: '认证失败',
    failedMessage: '请先登录后再访问此页面',
    loadingText: '正在验证身份...',
    fallbackUrl: '/pages/user/user'
});

// Hooks
const { isLoggedIn, showAuthModal } = useAuth();

// 状态
const authState = ref({
    isAuthenticated: false,
    isLoading: true,
    isRetrying: false,
    checkCount: 0,
    lastCheckTime: 0
});

// 计算属性
const hasRequiredPermission = computed(() => {
    if (!props.requireAuth) return true;
    
    // 检查权限
    if (props.permissions.length > 0) {
        const hasPermission = permissionManager.hasAllPermissions(props.permissions);
        if (!hasPermission) return false;
    }
    
    // 检查角色
    if (props.roles.length > 0) {
        const hasRole = props.roles.some(role => permissionManager.hasRole(role));
        if (!hasRole) return false;
    }
    
    return true;
});

/**
 * 执行认证检查
 */
const performAuthCheck = async () => {
    if (!props.requireAuth) {
        authState.value.isAuthenticated = true;
        authState.value.isLoading = false;
        return;
    }

    try {
        authState.value.isLoading = true;
        authState.value.checkCount++;
        authState.value.lastCheckTime = Date.now();
        
        console.log('🔐 AuthGuard执行认证检查...');
        
        // 优先使用简单的登录状态检查，避免过于严格的验证
        let isValid = isLoggedIn.value;
        
        // 如果简单检查失败，再使用严格的认证守卫验证
        if (!isValid) {
            console.log('⚠️ 简单检查失败，使用严格验证...');
            isValid = await authGuard.validateAuthState();
        } else {
            console.log('✅ 简单检查通过，用户已登录');
        }
        
        authState.value.isAuthenticated = isValid;
        
        if (isValid) {
            console.log('✅ AuthGuard认证检查通过');
        } else {
            console.log('❌ AuthGuard认证检查失败');
        }
        
    } catch (error) {
        console.error('❌ AuthGuard认证检查异常:', error);
        authState.value.isAuthenticated = false;
    } finally {
        authState.value.isLoading = false;
        authState.value.isRetrying = false;
    }
};

/**
 * 重试认证
 */
const handleRetry = async () => {
    // 防止频繁重试
    const now = Date.now();
    if (now - authState.value.lastCheckTime < 3000) {
        uni.showToast({
            title: '请稍后再试',
            icon: 'none'
        });
        return;
    }
    
    authState.value.isRetrying = true;
    await performAuthCheck();
};

/**
 * 处理登录
 */
const handleLogin = () => {
    showAuthModal.value = true;
};

/**
 * 返回上一页
 */
const handleGoBack = () => {
    uni.navigateBack({
        fail: () => {
            // 如果无法返回，跳转到fallback页面
            uni.switchTab({
                url: props.fallbackUrl,
                fail: () => {
                    uni.navigateTo({ url: props.fallbackUrl });
                }
            });
        }
    });
};

// 监听登录状态变化
watch(isLoggedIn, (newValue) => {
    if (newValue && !authState.value.isAuthenticated) {
        // 登录成功后重新检查
        performAuthCheck();
    }
});

// 组件挂载时执行认证检查
onMounted(() => {
    performAuthCheck();
});
</script>

<style lang="scss" scoped>
.auth-guard {
    width: 100%;
    min-height: 100vh;
}

.auth-content {
    width: 100%;
}

.auth-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32rpx;
        
        .loading-spinner {
            width: 60rpx;
            height: 60rpx;
            border: 4rpx solid #f3f3f3;
            border-top: 4rpx solid #007aff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        .loading-text {
            font-size: 28rpx;
            color: #666;
        }
    }
}

.auth-failed,
.permission-denied {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 40rpx;
    
    .failed-container,
    .denied-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32rpx;
        text-align: center;
        
        .failed-icon,
        .denied-icon {
            font-size: 120rpx;
            opacity: 0.8;
        }
        
        .failed-title,
        .denied-title {
            font-size: 36rpx;
            font-weight: bold;
            color: #333;
        }
        
        .failed-message,
        .denied-message {
            font-size: 28rpx;
            color: #666;
            line-height: 1.5;
        }
        
        .failed-actions {
            display: flex;
            gap: 24rpx;
            margin-top: 20rpx;
        }
        
        .retry-btn,
        .login-btn,
        .back-btn {
            padding: 20rpx 40rpx;
            border-radius: 12rpx;
            font-size: 28rpx;
            border: none;
            
            &.retry-btn {
                background-color: #f8f8f8;
                color: #333;
                
                &:disabled {
                    opacity: 0.6;
                }
            }
            
            &.login-btn {
                background-color: #007aff;
                color: white;
            }
            
            &.back-btn {
                background-color: #666;
                color: white;
            }
            
            &:active {
                opacity: 0.8;
            }
        }
    }
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style> 