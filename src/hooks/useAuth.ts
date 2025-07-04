import { ref, computed } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { authGuard, permissionManager, pageAccessControl } from '@/utils/auth';

/**
 * 认证相关hooks
 */
export const useAuth = () => {
    const authStore = useAuthStore();
    const redirectUrl = ref('');

    // 计算属性
    const isLoggedIn = computed(() => authStore.isLoggedIn);
    const userInfo = computed(() => authStore.userInfo);
    const isLoggingIn = computed(() => authStore.isLoggingIn);
    const showAuthModal = computed({
        get: () => authStore.showAuthModal,
        set: (value: boolean) => { authStore.showAuthModal = value; }
    });

    /**
     * 检查登录状态，未登录则显示登录弹窗
     * @param redirect 登录成功后的跳转地址
     * @returns 是否已登录
     */
    const requireAuth = async (redirect?: string): Promise<boolean> => {
        console.log('🔐 useAuth.requireAuth 开始检查...');
        
        // 使用增强的认证守卫进行检查
        const isValid = await authGuard.validateAuthState();
        
        if (isValid) {
            console.log('✅ 认证检查通过');
            return true;
        }

        console.log('❌ 认证检查失败，显示登录弹窗');
        
        // 未登录，显示登录弹窗
        if (redirect) {
            redirectUrl.value = redirect;
        }
        showAuthModal.value = true;
        return false;
    };

    /**
     * 登录成功回调
     */
    const handleLoginSuccess = () => {
        showAuthModal.value = false;
        
        // 执行登录成功后的回调
        console.log('登录成功，用户信息:', authStore.userInfo);
        
        // 如果有重定向地址，则跳转
        if (redirectUrl.value) {
            uni.navigateTo({
                url: redirectUrl.value,
                fail: () => {
                    uni.switchTab({ url: redirectUrl.value });
                }
            });
            redirectUrl.value = '';
        }
    };

    /**
     * 退出登录
     */
    const logout = async () => {
        await authStore.logout();
    };

    /**
     * 刷新用户信息
     */
    const refreshUserInfo = async () => {
        await authStore.refreshUserInfo();
    };

    /**
     * 检查用户权限
     * @param permissionCode 权限代码
     * @returns 是否有权限
     */
    const hasPermission = (permissionCode: string): boolean => {
        return permissionManager.hasPermission(permissionCode);
    };

    /**
     * 检查用户角色
     * @param roleCode 角色代码
     * @returns 是否有角色
     */
    const hasRole = (roleCode: string): boolean => {
        return permissionManager.hasRole(roleCode);
    };

    /**
     * 检查页面访问权限
     * @param url 页面路径
     * @returns 访问权限检查结果
     */
    const checkPageAccess = async (url: string) => {
        return await pageAccessControl.checkPageAccess(url);
    };

    /**
     * 需要权限的操作执行器
     * @param permissionCode 需要的权限代码
     * @param action 需要执行的操作
     * @param errorMessage 权限不足时的提示信息
     */
    const executeWithPermission = async <T>(
        permissionCode: string,
        action: () => Promise<T> | T,
        errorMessage: string = '权限不足'
    ): Promise<T | null> => {
        // 先检查登录状态
        const isAuth = await requireAuth();
        if (!isAuth) {
            return null;
        }

        // 检查权限
        if (!hasPermission(permissionCode)) {
            uni.showToast({
                title: errorMessage,
                icon: 'none'
            });
            return null;
        }

        try {
            return await action();
        } catch (error) {
            console.error('执行权限操作失败:', error);
            throw error;
        }
    };

    return {
        // 状态
        isLoggedIn,
        userInfo,
        isLoggingIn,
        showAuthModal,
        redirectUrl,
        
        // 方法
        requireAuth,
        handleLoginSuccess,
        logout,
        refreshUserInfo,
        
        // 权限相关
        hasPermission,
        hasRole,
        checkPageAccess,
        executeWithPermission
    };
};

/**
 * 页面级别的登录检查hooks
 */
export const usePageAuth = () => {
    const { requireAuth, isLoggedIn } = useAuth();

    /**
     * 页面加载时检查登录状态
     */
    const checkAuthOnLoad = async (redirectOnFail = true) => {
        const isValid = await requireAuth();
        
        if (!isValid && redirectOnFail) {
            // 可以在这里添加页面级别的处理逻辑
            console.log('页面需要登录，已显示登录弹窗');
        }
        
        return isValid;
    };

    return {
        isLoggedIn,
        checkAuthOnLoad,
        requireAuth
    };
};

/**
 * 操作级别的登录检查hooks
 */
export const useActionAuth = () => {
    const { requireAuth } = useAuth();

    /**
     * 执行需要登录的操作
     * @param action 需要执行的操作
     * @param redirectUrl 登录成功后的跳转地址
     */
    const executeWithAuth = async <T>(
        action: () => Promise<T> | T,
        redirectUrl?: string
    ): Promise<T | null> => {
        const isLoggedIn = await requireAuth(redirectUrl);
        
        if (!isLoggedIn) {
            return null;
        }

        try {
            return await action();
        } catch (error) {
            console.error('执行操作失败:', error);
            throw error;
        }
    };

    /**
     * 检查并执行操作（同步版本）
     */
    const checkAndExecute = (action: () => void, redirectUrl?: string) => {
        executeWithAuth(action, redirectUrl);
    };

    return {
        executeWithAuth,
        checkAndExecute
    };
}; 