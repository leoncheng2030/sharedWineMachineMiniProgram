<template>
    <!-- 使用原生样式的弹窗，不依赖uView -->
    <view v-if="internalShow && !isSilentLogin" class="auth-modal-overlay" @click="handleOverlayClick">
        <view class="auth-modal-container" @click.stop>
            <view class="auth-modal" :class="{ 'returning-user': isReturningUser }">
                <view class="modal-content">

                    
                    <!-- 头部标题 -->
                    <view class="header">
                        <view class="title">{{ modalTitle }}</view>
                        <view class="subtitle">{{ modalSubtitle }}</view>
                    </view>

                    <!-- 用户信息展示区 - 仅新用户显示 -->
                    <view class="user-info-section" v-if="currentStep === 'profile' && !isReturningUser">
                        <view class="avatar-section">
                            <button 
                                class="avatar-btn" 
                                open-type="chooseAvatar" 
                                @chooseavatar="handleChooseAvatar"
                            >
                                <image 
                                    :src="userProfile.avatarUrl || '/static/images/default-avatar.png'" 
                                    class="avatar-img"
                                    mode="aspectFill"
                                />
                                <view class="avatar-tip">{{ userProfile.avatarUrl ? '点击更换头像' : '点击选择头像' }}</view>
                                <view class="avatar-overlay">
                                    <text class="camera-icon">📷</text>
                                </view>
                            </button>
                        </view>

                        <view class="nickname-section">
                            <view class="nickname-label">昵称</view>
                            <input 
                                v-model="userProfile.nickName"
                                type="nickname"
                                class="nickname-input"
                                placeholder="请输入您的昵称"
                                :maxlength="20"
                            />
                        </view>
                    </view>

                    <!-- 手机号授权区 -->
                    <view class="phone-section" v-if="currentStep === 'phone'">
                        <!-- 新用户提示 -->
                        <view class="phone-tip" v-if="!isReturningUser">
                            <text>需要获取您的手机号以完成账户绑定</text>
                        </view>
                        <!-- 老用户提示 -->
                        <view class="phone-tip returning-user-tip" v-else>
                            <view class="welcome-back-icon">👋</view>
                            <text>欢迎回来！</text>
                            <text class="auto-login-text">正在为您快速登录...</text>
                        </view>
                        
                        <!-- 新用户：显示手机号授权按钮 -->
                        <view v-if="!isReturningUser">
                            <!-- 主要授权按钮：支持新版本快速验证 -->
                            <button 
                                class="phone-btn primary" 
                                :open-type="'getRealtimePhoneNumber' as any" 
                                @getrealtimephonenumber="handleGetPhoneNumber"
                                :disabled="isLoggingIn"
                            >
                                <text v-if="isLoggingIn">登录中...</text>
                                <text v-else>{{ phoneButtonText }}</text>
                            </button>
                            
                            <!-- 备用授权按钮：传统方式 -->
                            <button 
                                class="phone-btn secondary" 
                                open-type="getPhoneNumber" 
                                @getphonenumber="handleGetPhoneNumber"
                                :disabled="isLoggingIn"
                                style="margin-top: 20rpx; font-size: 28rpx;"
                            >
                                <text v-if="isLoggingIn">登录中...</text>
                                <text v-else>传统方式获取手机号</text>
                            </button>
                            
                            <view class="phone-tips" style="margin-top: 20rpx; font-size: 24rpx; color: #999;">
                                <text>• 优先使用上方按钮（快速验证）</text>
                                <text>• 如果不支持，请使用下方按钮</text>
                            </view>
                        </view>
                        
                        <!-- 老用户：显示快速登录界面 -->
                        <view v-else class="returning-user-login">
                            <view class="loading-indicator" v-if="isLoggingIn">
                                <view class="loading-spinner"></view>
                                <text>登录中...</text>
                            </view>
                            
                            <view v-else class="quick-login-options">

                                
                                <button 
                                    class="phone-btn primary quick-login" 
                                    @click="handleQuickLogin"
                                >
                                    <view class="quick-login-content">
                                        <text class="quick-login-icon">⚡</text>
                                        <text>一键快速登录</text>
                                    </view>
                                </button>
                            </view>
                        </view>
                    </view>

                    <!-- 按钮区域 - 仅新用户显示 -->
                    <view class="button-section" v-if="!isReturningUser">
                        <button 
                            v-if="currentStep === 'profile'" 
                            class="action-btn primary" 
                            @click="proceedToPhone"
                            :disabled="!canProceed"
                        >
                            下一步
                        </button>
                        
                        <button 
                            v-if="currentStep === 'phone'" 
                            class="action-btn secondary" 
                            @click="skipPhoneAuth"
                            :disabled="isLoggingIn"
                        >
                            暂时跳过
                        </button>
                    </view>

                    <!-- 隐私协议 -->
                    <view class="agreement-section" :class="{ 'returning-user-agreement': isReturningUser }">
                        <view class="checkbox-wrapper" @click="toggleAgree">
                            <view class="custom-checkbox" :class="{ checked: isAgree }">
                                <text v-if="isAgree">✓</text>
                            </view>
                            <text class="agreement-text">
                                {{ isReturningUser ? '继续使用即表示同意' : '已阅读并同意' }}
                                <text class="link" @click.stop="openAgreement('service')">《服务协议》</text>
                                和
                                <text class="link" @click.stop="openAgreement('privacy')">《隐私政策》</text>
                            </text>
                        </view>
                    </view>

                    <!-- 错误提示 -->
                    <view v-if="loginError" class="error-tip">
                        <text>{{ loginError }}</text>
                    </view>

                    <!-- 关闭按钮 -->
                    <view class="close-btn" @click="handleClose">
                        <text>×</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { handleAvatarChoose, handleWechatPhoneAuth } from '@/utils/wechat';

interface Props {
    show: boolean;
    redirectUrl?: string;
}

interface Emits {
    (e: 'update:show', value: boolean): void;
    (e: 'loginSuccess'): void;
}

const props = withDefaults(defineProps<Props>(), {
    show: false,
    redirectUrl: ''
});

const emit = defineEmits<Emits>();

// Store
const authStore = useAuthStore();

// 内部显示状态
const internalShow = ref(props.show);

// AuthModal组件初始化

// 状态
const currentStep = ref<'profile' | 'phone'>('profile');
const isAgree = ref(false);
const isSilentLogin = ref(false); // 添加静默登录状态
const isReturningUser = ref(false); // 是否为老用户
const userProfile = ref({
    avatarUrl: '',
    nickName: ''
});
const phoneData = ref<{
    encryptedData?: string;
    iv?: string;
    cloudID?: string;
}>({});

// 计算属性
const isLoggingIn = computed(() => authStore.isLoggingIn);
const loginError = computed(() => authStore.loginError);
const canProceed = computed(() => isAgree.value && userProfile.value.nickName.trim().length > 0);
const phoneButtonText = computed(() => {
    return isLoggingIn.value ? '登录中...' : '微信手机号登录';
});

// 动态标题和副标题
const modalTitle = computed(() => {
    if (isReturningUser.value) {
        return '欢迎回来';
    }
    return currentStep.value === 'profile' ? '完善个人信息' : '微信授权登录';
});

const modalSubtitle = computed(() => {
    if (isReturningUser.value) {
        return '快速登录，继续您的酒品之旅';
    }
    return currentStep.value === 'profile' 
        ? '请完善您的个人信息，享受个性化服务' 
        : '为了给您提供更好的服务体验';
});

// 监听弹窗显示状态
watch(() => props.show, (newShow) => {
    internalShow.value = newShow;
    if (newShow) {
        resetModal();
    }
}, { immediate: true });

// 监听内部状态变化，同步到父组件
watch(internalShow, (newShow) => {
    if (newShow !== props.show) {
        emit('update:show', newShow);
    }
}, { immediate: true });

/**
 * 重置弹窗状态
 */
const resetModal = () => {
    // 检查是否为老用户
    const returningUserStatus = checkIsReturningUser();
    isReturningUser.value = returningUserStatus;
    
    console.log('🔄 AuthModal重置状态:', { 
        isReturningUser: returningUserStatus,
        timestamp: new Date().toLocaleTimeString()
    });
    
    if (returningUserStatus) {
        // 老用户：直接进入手机号授权步骤，显示快速登录选项
        currentStep.value = 'phone';
        userProfile.value = {
            avatarUrl: '',
            nickName: ''
        };
        isAgree.value = true; // 老用户默认已同意协议
        console.log('🔄 老用户流程：显示快速登录选项');
        
        // 移除自动登录，让用户主动选择
        // setTimeout(() => {
        //     attemptAutoLogin();
        // }, 1000);
    } else {
        // 新用户：需要收集个人信息
        currentStep.value = 'profile';
        userProfile.value = {
            avatarUrl: '',
            nickName: ''
        };
        isAgree.value = false;
        console.log('🆕 新用户流程：需要收集个人信息');
    }
    
    phoneData.value = {};
    isSilentLogin.value = false;
};

/**
 * 处理快速登录（老用户主动选择）
 */
const handleQuickLogin = async () => {
    console.log('🚀 老用户选择快速登录...');
    await attemptAutoLogin();
};

/**
 * 老用户自动登录尝试
 */
const attemptAutoLogin = async () => {
    if (!isReturningUser.value) {
        return;
    }
    
    console.log('🚀 开始老用户自动登录尝试...');
    
    try {
        // 设置静默登录状态
        isSilentLogin.value = true;
        
        // 显示自动登录提示
        const loadingToast = uni.showLoading({
            title: '自动登录中...',
            mask: true
        });
        
        // 尝试使用存储的信息进行静默登录
        const autoLoginSuccess = await authStore.attemptAutoLogin();
        
        uni.hideLoading();
        
        if (autoLoginSuccess) {
            console.log('✅ 老用户自动登录成功');
            
            // 自动登录成功，直接关闭弹窗
            uni.showToast({
                title: '欢迎回来！',
                icon: 'success',
                duration: 1500
            });
            
            setTimeout(() => {
                handleLoginSuccess();
            }, 1500);
        } else {
            console.log('⚠️ 老用户自动登录失败，需要手动验证');
            
            // 自动登录失败，显示手动登录选项
            isSilentLogin.value = false;
            
            uni.showToast({
                title: '需要重新验证身份',
                icon: 'none',
                duration: 2000
            });
        }
    } catch (error) {
        console.error('❌ 老用户自动登录出错:', error);
        
        uni.hideLoading();
        isSilentLogin.value = false;
        
        uni.showToast({
            title: '自动登录失败，请手动登录',
            icon: 'none',
            duration: 2000
        });
    }
};

/**
 * 检查是否为老用户 - 增强版本
 */
const checkIsReturningUser = (): boolean => {
    try {
        // 检查多个维度的用户历史记录
        const userId = uni.getStorageSync('USER_ID');
        const userOpenid = uni.getStorageSync('USER_OPENID');
        const hasLoginHistory = uni.getStorageSync('HAS_LOGIN_HISTORY');
        const lastLoginTime = uni.getStorageSync('LAST_LOGIN_TIME');
        const historyNickname = uni.getStorageSync('HISTORY_NICKNAME');
        const authToken = uni.getStorageSync('AUTH_TOKEN');
        
        // 检查是否有任何历史登录记录
        const hasAnyHistory = !!(
            userId || 
            userOpenid || 
            hasLoginHistory || 
            lastLoginTime || 
            historyNickname || 
            authToken
        );
        
        // 检查登录时间是否在合理范围内（30天内）
        const isRecentLogin = lastLoginTime && 
            (Date.now() - lastLoginTime < 30 * 24 * 60 * 60 * 1000);
        
        const result = hasAnyHistory;
        
        console.log('🔍 AuthModal老用户检查详情:', { 
            userId: !!userId,
            userOpenid: !!userOpenid,
            hasLoginHistory: !!hasLoginHistory,
            lastLoginTime: lastLoginTime ? new Date(lastLoginTime).toLocaleString() : null,
            historyNickname: !!historyNickname,
            authToken: !!authToken,
            isRecentLogin,
            finalResult: result
        });
        
        return result;
    } catch (error) {
        console.error('❌ 检查老用户状态时出错:', error);
        return false;
    }
};



/**
 * 检查是否有历史用户信息（保留用于其他用途）
 */
const checkHistoryUserInfo = (): boolean => {
    const historyNickname = uni.getStorageSync('HISTORY_NICKNAME');
    const historyAvatar = uni.getStorageSync('HISTORY_AVATAR');
    
    if (historyNickname && historyAvatar) {
        userProfile.value = {
            nickName: historyNickname,
            avatarUrl: historyAvatar
        };
        console.log('✅ 发现历史用户信息');
        return true;
    }
    
    return false;
};

/**
 * 显示手机号授权界面
 */
const showPhoneAuthUI = () => {
    // 显示提示信息
    uni.showToast({
        title: '需要重新验证身份',
        icon: 'none',
        duration: 2000
    });
};

/**
 * 切换协议同意状态
 */
const toggleAgree = () => {
    isAgree.value = !isAgree.value;
};

/**
 * 处理头像选择
 */
const handleChooseAvatar = async (event: any) => {
    try {
        const avatarUrl = await handleAvatarChoose(event);
        userProfile.value.avatarUrl = avatarUrl;
        
        // 提示用户头像选择成功
        uni.showToast({
            title: '头像选择成功',
            icon: 'success',
            duration: 1500
        });
    } catch (error: any) {
        console.error('头像选择失败:', error);
        
        // 检查是否是开发者工具的文件系统错误
        if (error.message && error.message.includes('ENOENT')) {
            // 在开发者工具中使用默认头像URL
            userProfile.value.avatarUrl = '/static/images/default-avatar.png';
            
            uni.showToast({
                title: '开发者工具中头像选择有限制，真机测试正常',
                icon: 'none',
                duration: 3000
            });
        } else {
            uni.showToast({
                title: '头像选择失败，可跳过此步骤',
                icon: 'none',
                duration: 2000
            });
        }
    }
};

/**
 * 进入手机号授权步骤
 */
const proceedToPhone = () => {
    if (!canProceed.value) {
        uni.showToast({
            title: '请先完善个人信息并同意协议',
            icon: 'none'
        });
        return;
    }
    currentStep.value = 'phone';
};

/**
 * 处理手机号授权
 */
const handleGetPhoneNumber = async (event: any) => {
    try {
        if (!isAgree.value) {
            uni.showToast({
                title: '请先同意服务协议',
                icon: 'none'
            });
            return;
        }

        console.log('=== 手机号授权事件详情 ===');
        console.log('完整事件对象:', JSON.stringify(event, null, 2));
        console.log('event.detail:', JSON.stringify(event.detail, null, 2));
        console.log('用户类型:', isReturningUser.value ? '老用户' : '新用户');
        
        let phoneNumber = '';
        let phoneAuthData: any = {};
        
        // 检查各种可能的手机号获取方式
        if (event.detail) {
            const detail = event.detail;
            
            // 方式1：新版本直接返回手机号
            if (detail.phoneNumber) {
                phoneNumber = detail.phoneNumber;
                console.log('✅ 方式1：直接获取到手机号:', phoneNumber);
            }
            // 方式2：新版本返回code，传递给后端解析
            else if (detail.code) {
                console.log('✅ 方式2：获取到手机号授权码:', detail.code);
                phoneAuthData.phoneAuthCode = detail.code;
                
                // 如果同时有加密数据，也一起传递
                if (detail.encryptedData && detail.iv) {
                    phoneAuthData.encryptedData = detail.encryptedData;
                    phoneAuthData.iv = detail.iv;
                }
                
                // 如果有cloudID，也传递
                if (detail.cloudID) {
                    phoneAuthData.cloudID = detail.cloudID;
                }
                
                console.log('📦 手机号授权数据:', phoneAuthData);
            }
            // 方式3：传统方式，返回加密数据
            else if (detail.encryptedData && detail.iv) {
                console.log('✅ 方式3：获取到加密数据');
                phoneAuthData.encryptedData = detail.encryptedData;
                phoneAuthData.iv = detail.iv;
                
                if (detail.cloudID) {
                    phoneAuthData.cloudID = detail.cloudID;
                }
                
                console.log('📦 加密手机号数据:', phoneAuthData);
            }
            // 方式4：用户拒绝授权
            else if (detail.errMsg && detail.errMsg.includes('deny')) {
                console.log('❌ 用户拒绝了手机号授权');
                uni.showToast({
                    title: '需要手机号授权才能完成登录',
                    icon: 'none'
                });
                return;
            }
            // 方式5：其他错误情况
            else {
                console.log('⚠️ 未知的授权结果:', detail);
            }
        }

        // 构造登录参数
        const loginParams: any = {
            ...phoneAuthData,  // 展开手机号授权数据
            isReturningUser: isReturningUser.value // 标记用户类型
        };

        // 只有新用户或者有个人信息时才添加个人信息
        if (!isReturningUser.value && userProfile.value.nickName) {
            loginParams.nickName = userProfile.value.nickName;
        }
        if (!isReturningUser.value && userProfile.value.avatarUrl) {
            loginParams.avatarUrl = userProfile.value.avatarUrl;
        }

        // 如果直接获取到手机号，也添加进去
        if (phoneNumber) {
            loginParams.phone = phoneNumber;
            console.log('🚀 直接获取的手机号:', phoneNumber);
        }

        console.log('=== 最终登录参数 ===');
        console.log(JSON.stringify(loginParams, null, 2));

        // 执行微信登录
        const success = await authStore.wechatLogin(loginParams);

        if (success) {
            handleLoginSuccess();
        }
    } catch (error: any) {
        console.error('❌ 手机号授权失败:', error);
        if (error.message && error.message.includes('用户拒绝')) {
            uni.showToast({
                title: '需要手机号授权才能完成登录',
                icon: 'none'
            });
        } else {
            uni.showToast({
                title: error.message || '登录失败',
                icon: 'none'
            });
        }
    }
};

/**
 * 处理传统方式的手机号授权（回退方案）
 */
const handleGetPhoneNumberFallback = async (event: any) => {
    try {
        if (!isAgree.value) {
            uni.showToast({
                title: '请先同意服务协议',
                icon: 'none'
            });
            return;
        }

        // 获取手机号授权数据
        const phoneAuthData = await handleWechatPhoneAuth(event);
        phoneData.value = phoneAuthData;

        console.log('传统方式获取到加密的手机号数据:', phoneAuthData);

        // 构造登录参数（不包含手机号，因为需要后端解密）
        const loginParams: any = {
            isReturningUser: isReturningUser.value
        };
        
        // 只有新用户才添加个人信息
        if (!isReturningUser.value) {
            loginParams.nickName = userProfile.value.nickName;
            loginParams.avatarUrl = userProfile.value.avatarUrl;
        }

        // 执行微信登录
        const success = await authStore.wechatLogin(loginParams);

        if (success) {
            handleLoginSuccess();
        }
    } catch (error: any) {
        console.error('传统手机号授权失败:', error);
        uni.showToast({
            title: error.message || '登录失败',
            icon: 'none'
        });
    }
};

/**
 * 跳过手机号授权
 */
const skipPhoneAuth = async () => {
    try {
        if (!isAgree.value) {
            uni.showToast({
                title: '请先同意服务协议',
                icon: 'none'
            });
            return;
        }

        // 构造登录参数（不带手机号）
        const loginParams: any = {
            isReturningUser: isReturningUser.value
        };
        
        // 只有新用户且有个人信息时才添加
        if (!isReturningUser.value) {
            if (userProfile.value.nickName) {
                loginParams.nickName = userProfile.value.nickName;
            }
            if (userProfile.value.avatarUrl) {
                loginParams.avatarUrl = userProfile.value.avatarUrl;
            }
        }

        // 执行微信登录
        const success = await authStore.wechatLogin(loginParams);

        if (success) {
            handleLoginSuccess();
        }
    } catch (error: any) {
        console.error('登录失败:', error);
    }
};

/**
 * 登录成功处理
 */
const handleLoginSuccess = () => {
    // 保存用户信息到本地存储，用于下次静默登录
    if (userProfile.value.nickName) {
        uni.setStorageSync('HISTORY_NICKNAME', userProfile.value.nickName);
        console.log('✅ 已保存历史昵称:', userProfile.value.nickName);
    }
    
    if (userProfile.value.avatarUrl) {
        uni.setStorageSync('HISTORY_AVATAR', userProfile.value.avatarUrl);
        console.log('✅ 已保存历史头像');
    }
    
    // 保存登录时间和历史记录标记
    uni.setStorageSync('LAST_LOGIN_TIME', Date.now());
    uni.setStorageSync('HAS_LOGIN_HISTORY', true);
    
    // 记录是否为静默登录
    const wasSilentLogin = isSilentLogin.value;
    
    // 重置静默登录状态
    isSilentLogin.value = false;
    
    // 根据用户类型显示不同的成功提示
    if (!wasSilentLogin) {
        const successMessage = isReturningUser.value ? '欢迎回来！' : '登录成功';
        uni.showToast({
            title: successMessage,
            icon: 'success'
        });
    }

    // 关闭弹窗
    internalShow.value = false;

    // 延迟执行回调和跳转
    setTimeout(() => {
        emit('loginSuccess');
        
        if (props.redirectUrl) {
            uni.navigateTo({
                url: props.redirectUrl,
                fail: () => {
                    uni.switchTab({ url: props.redirectUrl });
                }
            });
        }
    }, wasSilentLogin ? 0 : 1000); // 静默登录无需延迟
};

/**
 * 处理遮罩层点击
 */
const handleOverlayClick = () => {
    // 可以选择是否允许点击遮罩关闭
    // internalShow.value = false;
};

/**
 * 关闭弹窗
 */
const handleClose = () => {
    internalShow.value = false;
};

/**
 * 打开协议页面
 */
const openAgreement = (type: 'service' | 'privacy') => {
    const typeMap = {
        service: '0',
        privacy: '1'
    };
    
    uni.navigateTo({
        url: `/bundle/pages/server_explan/server_explan?type=${typeMap[type]}`
    });
};
</script>

<style lang="scss" scoped>
.auth-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.auth-modal-container {
    width: 100%;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

.auth-modal {
    width: 100%;
    background: #fff;
    border-radius: 20rpx 20rpx 0 0;
    overflow: hidden;
    position: relative;
    
    // 老用户样式
    &.returning-user {
        .modal-content {
            background: #fff;
            color: #333;
            
            .header {
                .title {
                    color: #333;
                    font-size: 40rpx;
                }
                
                .subtitle {
                    color: #666;
                }
            }
            
            .phone-section {
                .returning-user-tip {
                    background: #f8f9fa;
                    border: 1rpx solid #e9ecef;
                    border-radius: 16rpx;
                    padding: 30rpx;
                    margin-bottom: 30rpx;
                    text-align: center;
                    
                    .welcome-back-icon {
                        font-size: 40rpx;
                        margin-bottom: 16rpx;
                    }
                    
                    .auto-login-text {
                        font-size: 24rpx;
                        color: #666;
                        margin-top: 8rpx;
                    }
                }
                
                .quick-login {
                    background: linear-gradient(135deg, #007aff 0%, #5ac8fa 100%);
                    box-shadow: 0 8rpx 20rpx rgba(0, 122, 255, 0.3);
                    padding: 32rpx;
                    font-size: 32rpx;
                    font-weight: bold;
                    
                    .quick-login-content {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12rpx;
                        
                        .quick-login-icon {
                            font-size: 32rpx;
                        }
                    }
                }
            }
            
            .agreement-section.returning-user-agreement {
                .agreement-text {
                    color: #666;
                }
                
                .custom-checkbox {
                    border-color: #ddd;
                    
                    &.checked {
                        background: #007aff;
                        border-color: #007aff;
                        color: white;
                    }
                }
            }
            
            .close-btn {
                color: #999;
            }
        }
    }
}

.modal-content {
    padding: 40rpx;
    display: flex;
    flex-direction: column;
    min-height: 600rpx;
    transition: all 0.3s ease;
}

.close-btn {
    position: absolute;
    top: 20rpx;
    right: 30rpx;
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 40rpx;
    font-weight: bold;
}

.header {
    text-align: center;
    margin-bottom: 40rpx;
    
    .title {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 16rpx;
        transition: all 0.3s ease;
    }
    
    .subtitle {
        font-size: 26rpx;
        color: #666;
        line-height: 1.4;
        transition: all 0.3s ease;
    }
}

.user-info-section {
    margin-bottom: 40rpx;
}

.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40rpx;
    
    .avatar-btn {
        background: none;
        border: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .avatar-img {
            width: 120rpx;
            height: 120rpx;
            border-radius: 60rpx;
            border: 4rpx solid #f0f0f0;
            transition: all 0.3s ease;
            
            &:active {
                transform: scale(0.95);
            }
        }
        
        .avatar-tip {
            font-size: 24rpx;
            color: #666;
            margin-top: 16rpx;
        }
    }
}

.nickname-section {
    .nickname-label {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 16rpx;
    }
    
    .nickname-input {
        width: 100%;
        height: 80rpx;
        border: 2rpx solid #e0e0e0;
        border-radius: 12rpx;
        padding: 0 20rpx;
        font-size: 28rpx;
        box-sizing: border-box;
        
        &:focus {
            border-color: #007aff;
        }
    }
}

.phone-section {
    margin-bottom: 40rpx;
    text-align: center;
    
    .phone-tip {
        font-size: 26rpx;
        color: #666;
        margin-bottom: 30rpx;
        line-height: 1.5;
    }
    
    .phone-btn {
        width: 100%;
        height: 88rpx;
        background: linear-gradient(135deg, #007aff 0%, #5ac8fa 100%);
        border-radius: 44rpx;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 20rpx rgba(0, 122, 255, 0.3);
        color: #fff;
        font-size: 32rpx;
        font-weight: 500;
        margin-bottom: 20rpx;
        transition: all 0.3s ease;
        
        &:disabled {
            opacity: 0.6;
        }
        
        &.secondary {
            background: #f8f8f8;
            color: #666;
            border: 2rpx solid #e0e0e0;
            box-shadow: none;
        }
    }
    
    .returning-user-login {
        .quick-login-options {
            display: flex;
            flex-direction: column;
            gap: 20rpx;
            padding-top: 40rpx;
            
            .login-tips {
                padding: 20rpx;
                background: #f8f9fa;
                border-radius: 12rpx;
                margin-top: 10rpx;
                border: 1rpx solid #e9ecef;
                
                text {
                    display: block;
                    font-size: 24rpx;
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 8rpx;
                    
                    &:last-child {
                        margin-bottom: 0;
                    }
                }
            }
        }
    }
}

.button-section {
    margin-bottom: 30rpx;
    
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
        
        &.primary {
            background: linear-gradient(135deg, #007aff 0%, #5ac8fa 100%);
            color: #fff;
            box-shadow: 0 8rpx 20rpx rgba(0, 122, 255, 0.3);
            
            &:disabled {
                background: #f0f0f0;
                color: #999;
                box-shadow: none;
            }
        }
        
        &.secondary {
            background: #f8f8f8;
            color: #666;
            border: 2rpx solid #e0e0e0;
            
            &:disabled {
                opacity: 0.6;
            }
        }
    }
}

.agreement-section {
    margin-bottom: 20rpx;
    
    .checkbox-wrapper {
        display: flex;
        align-items: flex-start;
        gap: 16rpx;
        
        .custom-checkbox {
            width: 32rpx;
            height: 32rpx;
            border: 2rpx solid #ddd;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20rpx;
            color: #fff;
            transition: all 0.3s ease;
            
            &.checked {
                background: #007aff;
                border-color: #007aff;
            }
        }
        
        .agreement-text {
            font-size: 24rpx;
            color: #666;
            line-height: 1.5;
            flex: 1;
            transition: all 0.3s ease;
        }
        
        .link {
            color: #007aff;
            text-decoration: none;
            
            &:active {
                opacity: 0.7;
            }
        }
    }
}

.error-tip {
    background: #fff2f0;
    border: 2rpx solid #ffccc7;
    border-radius: 8rpx;
    padding: 20rpx;
    text-align: center;
    
    text {
        color: #ff4d4f;
        font-size: 26rpx;
    }
}

.loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rpx 20rpx;
    
    .loading-spinner {
        width: 60rpx;
        height: 60rpx;
        border: 4rpx solid #f0f0f0;
        border-top: 0rpx solid #fff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20rpx;
    }
    
    text {
        font-size: 28rpx;
        color: #666;
    }
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style> 