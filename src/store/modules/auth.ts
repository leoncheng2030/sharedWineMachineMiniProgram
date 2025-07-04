import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { authApi, type WechatLoginParams, type UserInfo } from '@/api/auth';
import { getWechatCode, checkWechatLoginStatus, getWechatEnvInfo } from '@/utils/wechat';
import { USER_TOKEN, USER_INFO } from '@/constant';
import { setStorage, getStorage, removeStorage } from '@/utils';
import { authGuard, permissionManager, SecurityUtils } from '@/utils/auth';

/**
 * 认证状态管理
 */
export const useAuthStore = defineStore('auth', () => {
    // 状态
    const token = ref<string>(getStorage(USER_TOKEN) || '');
    const userInfo = ref<UserInfo | null>(getStorage(USER_INFO) || null);
    const isLoggingIn = ref(false);
    const loginError = ref<string>('');
    const showAuthModal = ref(false);

    // 计算属性
    const isLoggedIn = computed(() => !!token.value && !!userInfo.value);
    const userId = computed(() => userInfo.value?.id || '');
    const userName = computed(() => userInfo.value?.name || userInfo.value?.nickname || '');
    const userAvatar = computed(() => userInfo.value?.avatar || '');
    const userPhone = computed(() => userInfo.value?.phone || '');

    /**
     * 设置token
     */
    const setToken = (newToken: string) => {
        token.value = newToken;
        if (newToken) {
            // 验证token格式
            if (!SecurityUtils.validateTokenFormat(newToken)) {
                console.warn('⚠️ Token格式可能无效:', newToken.substring(0, 10) + '...');
            }
            
            // 加密存储token（可选）
            const encryptedToken = SecurityUtils.encryptToken(newToken);
            setStorage(USER_TOKEN, newToken); // 暂时直接存储，后续可改为加密存储
            
            // 生成设备指纹用于安全验证
            const deviceFingerprint = SecurityUtils.generateDeviceFingerprint();
            setStorage('DEVICE_FINGERPRINT', deviceFingerprint);
            
            console.log('✅ Token已安全存储');
        } else {
            removeStorage(USER_TOKEN);
            removeStorage('DEVICE_FINGERPRINT');
        }
    };

    /**
     * 设置用户信息
     */
    const setUserInfo = (info: UserInfo | null) => {
        userInfo.value = info;
        if (info) {
            setStorage(USER_INFO, info);
            
            // 设置用户权限（如果用户信息中包含权限数据）
            if (info.permissions) {
                permissionManager.setUserPermissions(info.permissions);
            }
            
            // 设置用户角色（如果用户信息中包含角色数据）
            if (info.roles) {
                permissionManager.setUserRoles(info.roles);
            }
            
            console.log('✅ 用户信息已设置，权限已同步');
        } else {
            removeStorage(USER_INFO);
            // 清除权限信息
            permissionManager.setUserPermissions([]);
            permissionManager.setUserRoles([]);
        }
    };

    /**
     * 微信登录
     */
    const wechatLogin = async (params?: Partial<WechatLoginParams>): Promise<boolean> => {
        try {
            isLoggingIn.value = true;
            loginError.value = '';

            console.log('=== Store wechatLogin 开始 ===');
            console.log('传入参数:', JSON.stringify(params, null, 2));

            // 1. 获取微信授权码
            const code = await getWechatCode();
            console.log('获取到微信授权码:', code);

            // 2. 检查是否为老用户（简化登录）
            const isReturningUser = checkIsReturningUser();
            console.log('🔍 用户类型检查:', isReturningUser ? '老用户（简化登录）' : '新用户（完整授权）');

            // 3. 构造登录参数
            const loginParams: WechatLoginParams = {
                code,
                device: 'MINI'
            };

            // 如果是新用户或者明确要求完整授权，才添加个人信息
            if (!isReturningUser || params?.nickName || params?.avatarUrl) {
                if (params?.nickName) loginParams.nickName = params.nickName;
                if (params?.avatarUrl) loginParams.avatarUrl = params.avatarUrl;
                if (params?.phone) loginParams.phone = params.phone;
                if (params?.phoneCode) loginParams.phoneCode = params.phoneCode;
                if (params?.phoneAuthCode) loginParams.phoneAuthCode = params.phoneAuthCode;
                if (params?.encryptedData) loginParams.encryptedData = params.encryptedData;
                if (params?.iv) loginParams.iv = params.iv;
                if (params?.cloudID) loginParams.cloudID = params.cloudID;
                
                console.log('📝 添加个人信息到登录参数');
            }

            console.log('=== 最终发送到后端的登录参数 ===');
            console.log(JSON.stringify(loginParams, null, 2));

            // 4. 调用登录接口
            console.log('开始调用后端登录接口...');
            const loginToken = await authApi.wechatLogin(loginParams);
            console.log('后端返回token:', loginToken ? '已获取' : '未获取');

            // 5. 保存token
            setToken(loginToken);

            // 6. 获取用户信息
            const userInfo = await fetchUserInfo();

            // 7. 标记为老用户（保存用户标识）
            if (userInfo) {
                markAsReturningUser(userInfo);
            }

            console.log('=== Store wechatLogin 成功完成 ===');
            return true;

        } catch (error: any) {
            console.error('❌ Store wechatLogin 失败:', error);
            loginError.value = error.message || '登录失败';
            
            uni.showToast({
                title: loginError.value,
                icon: 'none',
                duration: 3000
            });
            
            return false;
        } finally {
            isLoggingIn.value = false;
        }
    };

    /**
     * 检查是否为老用户
     */
    const checkIsReturningUser = (): boolean => {
        const userId = uni.getStorageSync('USER_ID');
        const userOpenid = uni.getStorageSync('USER_OPENID');
        const hasLoginHistory = uni.getStorageSync('HAS_LOGIN_HISTORY');
        
        const isReturning = !!(userId || userOpenid || hasLoginHistory);
        console.log('🔍 老用户检查结果:', { userId, userOpenid, hasLoginHistory, isReturning });
        
        return isReturning;
    };

    /**
     * 标记为老用户
     */
    const markAsReturningUser = (userInfo: UserInfo): void => {
        if (userInfo.id) {
            uni.setStorageSync('USER_ID', userInfo.id);
        }
        
        // 可以保存openid（如果后端返回的话）
        if (userInfo.account) {
            uni.setStorageSync('USER_OPENID', userInfo.account);
        }
        
        // 设置登录历史标记
        uni.setStorageSync('HAS_LOGIN_HISTORY', true);
        uni.setStorageSync('LAST_LOGIN_TIME', Date.now());
        
        console.log('✅ 已标记为老用户:', {
            userId: userInfo.id,
            account: userInfo.account
        });
    };

    /**
     * 带手机号的微信登录
     */
    const wechatLoginWithPhone = async (params: {
        phone: string;
        phoneCode: string;
        nickName?: string;
        avatarUrl?: string;
    }): Promise<boolean> => {
        return await wechatLogin(params);
    };

    /**
     * 获取用户信息
     */
    const fetchUserInfo = async (): Promise<UserInfo | null> => {
        try {
            if (!token.value) {
                throw new Error('未登录');
            }

            const info = await authApi.getLoginUser();
            setUserInfo(info);
            return info;
        } catch (error: any) {
            console.error('获取用户信息失败:', error);
            
            // 如果是token过期，清除登录状态
            if (error.message?.includes('登录已过期') || error.message?.includes('401')) {
                await logout();
            }
            
            return null;
        }
    };

    /**
     * 退出登录
     */
    const logout = async (): Promise<void> => {
        try {
            // 调用后端退出接口
            if (token.value) {
                await authApi.logout();
            }
        } catch (error) {
            console.error('退出登录接口调用失败:', error);
        } finally {
            // 清除当前会话相关的数据
            setToken('');
            setUserInfo(null);
            loginError.value = '';
            
            // 保留老用户标识，只清除敏感的历史信息
            // 保留：USER_ID, USER_OPENID, HAS_LOGIN_HISTORY, LAST_LOGIN_TIME (这些用于判断老用户)
            // 清除：可能包含敏感信息的历史数据
            uni.removeStorageSync('HISTORY_NICKNAME');
            uni.removeStorageSync('HISTORY_AVATAR');
            
            // 注意：不清除 USER_ID, USER_OPENID, HAS_LOGIN_HISTORY, LAST_LOGIN_TIME
            // 这些用于识别老用户，退出登录后用户依然是老用户
            
            console.log('🗑️ 已清除当前会话数据，保留老用户标识');
            
            // 提示用户
            uni.showToast({
                title: '已退出登录',
                icon: 'success'
            });
        }
    };

    /**
     * 检查登录状态
     */
    const checkLoginStatus = async (): Promise<boolean> => {
        try {
            console.log('🔍 Store检查登录状态...');
            
            // 使用增强的认证守卫进行验证
            const isValid = await authGuard.validateAuthState();
            
            if (!isValid) {
                console.log('❌ 认证守卫验证失败');
                return false;
            }
            
            // 额外的本地验证
            if (!token.value || !userInfo.value) {
                console.log('❌ 本地token或用户信息缺失');
                return false;
            }
            
            console.log('✅ Store登录状态检查通过');
            return true;
        } catch (error) {
            console.error('❌ Store检查登录状态失败:', error);
            return false;
        }
    };

    /**
     * 更新用户资料
     */
    const updateUserProfile = async (profile: Partial<UserInfo>): Promise<boolean> => {
        try {
            if (!userInfo.value) {
                throw new Error('用户未登录');
            }

            // 更新本地用户信息
            const updatedInfo = { ...userInfo.value, ...profile };
            setUserInfo(updatedInfo);

            return true;
        } catch (error: any) {
            console.error('更新用户资料失败:', error);
            uni.showToast({
                title: error.message || '更新失败',
                icon: 'none'
            });
            return false;
        }
    };

    /**
     * 刷新用户信息
     */
    const refreshUserInfo = async (): Promise<void> => {
        if (!token.value) {
            console.warn('⚠️ 没有token，无法刷新用户信息');
            return;
        }

        try {
            console.log('🔄 开始刷新用户信息...');
            const info = await fetchUserInfo();
            
            if (info) {
                console.log('✅ 用户信息刷新成功');
            } else {
                console.warn('⚠️ 用户信息刷新失败，可能需要重新登录');
                // 可以选择清除无效的token
                // await logout();
            }
        } catch (error) {
            console.error('❌ 刷新用户信息失败:', error);
            throw error;
        }
    };

    /**
     * 老用户自动登录尝试
     */
    const attemptAutoLogin = async (): Promise<boolean> => {
        try {
            console.log('🔄 尝试老用户自动登录...');
            
            // 检查是否有有效的token
            if (token.value) {
                console.log('✅ 发现存储的token，验证有效性...');
                
                // 尝试获取用户信息来验证token是否有效
                const info = await fetchUserInfo();
                
                if (info) {
                    console.log('✅ Token有效，自动登录成功');
                    return true;
                } else {
                    console.log('❌ Token无效，需要重新登录');
                    // 清除无效token
                    setToken('');
                    setUserInfo(null);
                }
            }
            
            // 如果没有token或token无效，尝试静默微信登录
            console.log('🔄 尝试静默微信登录...');
            
            const code = await getWechatCode();
            console.log('获取到微信授权码:', code);
            
            // 使用最简参数进行登录（老用户不需要额外信息）
            const loginParams: WechatLoginParams = {
                code,
                device: 'MINI',
                isReturningUser: true // 标记为老用户
            };
            
            const loginToken = await authApi.wechatLogin(loginParams);
            
            if (loginToken) {
                setToken(loginToken);
                const userInfo = await fetchUserInfo();
                
                if (userInfo) {
                    console.log('✅ 静默登录成功');
                    return true;
                }
            }
            
            console.log('❌ 静默登录失败');
            return false;
            
        } catch (error) {
            console.error('❌ 自动登录失败:', error);
            return false;
        }
    };

    /**
     * 完全重置用户数据（包括老用户标识）
     * 注意：这会让用户重新变成"新用户"
     */
    const resetUserData = async (): Promise<void> => {
        try {
            // 先执行正常的退出登录
            await logout();
            
            // 然后清除所有用户相关数据，包括老用户标识
            uni.removeStorageSync('USER_ID');
            uni.removeStorageSync('USER_OPENID');
            uni.removeStorageSync('HAS_LOGIN_HISTORY');
            uni.removeStorageSync('LAST_LOGIN_TIME');
            uni.removeStorageSync('DEVICE_FINGERPRINT');
            
            console.log('🗑️ 已完全重置用户数据，用户将被视为新用户');
            
            uni.showToast({
                title: '数据已完全清除',
                icon: 'success'
            });
        } catch (error) {
            console.error('❌ 重置用户数据失败:', error);
            uni.showToast({
                title: '重置失败',
                icon: 'none'
            });
        }
    };

    return {
        // 状态
        token: readonly(token),
        userInfo: readonly(userInfo),
        isLoggingIn: readonly(isLoggingIn),
        loginError: readonly(loginError),
        showAuthModal,
        
        // 计算属性
        isLoggedIn,
        userId,
        userName,
        userAvatar,
        userPhone,
        
        // 方法
        wechatLogin,
        wechatLoginWithPhone,
        logout,
        resetUserData,
        checkLoginStatus,
        updateUserProfile,
        refreshUserInfo,
        attemptAutoLogin,
        
        // 内部方法（可选暴露）
        setToken,
        setUserInfo,
        fetchUserInfo
    };
}); 