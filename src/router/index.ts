import { USER_TOKEN } from "@/constant";
import { getStorage } from "@/utils";
import { pageAccessControl } from "@/utils/auth";

// 白名单页面（不需要认证的页面）
const whitelist = [
    "/",
    "/pages/index/index",
    "/pages/user/user",
    "/bundle/pages/server_explan/server_explan",
    "/pages/webview/webview",
];

// 需要拦截的导航方法
const navigationMethods = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];

/**
 * 检查页面是否在白名单中
 */
function isInWhitelist(url: string): boolean {
    return whitelist.some(item => url.includes(item));
}

/**
 * 显示认证提示并跳转
 */
function showAuthTipAndRedirect(message: string = "请先登录", redirectUrl: string = "/pages/user/user") {
    uni.showToast({ 
        title: message, 
        icon: "none",
        duration: 2000
    });
    
    setTimeout(() => {
        // 优先尝试switchTab，失败则使用navigateTo
        uni.switchTab({
            url: redirectUrl,
            fail: () => {
                uni.navigateTo({
                    url: redirectUrl,
                    fail: () => {
                        console.error('页面跳转失败:', redirectUrl);
                    }
                });
            }
        });
    }, 1000);
}

/**
 * 高级路由守卫
 */
async function advancedRouteGuard(options: UniApp.NavigateToOptions | UniApp.RedirectToOptions | UniApp.ReLaunchOptions | UniApp.SwitchTabOptions): Promise<boolean> {
    const url = options.url as string;
    console.log('🛡️ 路由守卫检查:', url);

    // 白名单页面直接通过
    if (isInWhitelist(url)) {
        console.log('✅ 白名单页面，直接通过');
        return true;
    }

    try {
        // 使用新的权限控制系统
        const accessResult = await pageAccessControl.checkPageAccess(url);
        
        if (accessResult.allowed) {
            console.log('✅ 页面访问权限验证通过');
            return true;
        } else {
            console.log('❌ 页面访问被拒绝:', accessResult.reason);
            showAuthTipAndRedirect(accessResult.reason || "访问被拒绝", accessResult.fallbackUrl);
            return false;
        }
    } catch (error) {
        console.error('❌ 路由守卫检查失败:', error);
        
        // 降级到基础token检查
        const token = getStorage(USER_TOKEN);
        if (!token) {
            showAuthTipAndRedirect("请先登录", "/pages/user/user");
            return false;
        }
        
        return true;
    }
}

/**
 * 基础路由守卫（兼容模式）
 */
function basicRouteGuard(url: string): boolean {
    console.log('🔰 基础路由守卫检查:', url);
    
    if (isInWhitelist(url)) {
        return true;
    }
    
    const token = getStorage(USER_TOKEN);
    if (!token) {
        showAuthTipAndRedirect("请先登录", "/pages/user/user");
        return false;
    }
    
    return true;
}

// 为每个导航方法添加拦截器
navigationMethods.forEach((method) => {
    uni.addInterceptor(method, {
                 // 页面跳转前进行拦截
         invoke: async (options) => {
             console.log(`🚀 拦截${method}:`, options.url);
             
             try {
                 // 尝试使用高级路由守卫
                 const allowed = await advancedRouteGuard(options);
                 return allowed;
             } catch (error) {
                 console.warn('⚠️ 高级路由守卫失败，降级到基础守卫:', error);
                 // 降级到基础路由守卫
                 return basicRouteGuard(options.url as string);
             }
         },
        
        // 跳转成功后的回调
        success: (result) => {
            console.log(`✅ ${method}成功:`, result);
        },
        
        // 跳转失败后的回调
        fail: (error) => {
            console.error(`❌ ${method}失败:`, error);
            
            // 如果是因为页面不存在，给出友好提示
            if (error.errMsg && error.errMsg.includes('page not found')) {
                uni.showToast({
                    title: '页面不存在',
                    icon: 'none'
                });
            }
        }
    });
});

/**
 * 导出路由守卫工具函数
 */
export const routeGuard = {
    /**
     * 手动检查页面访问权限
     */
    async checkAccess(url: string): Promise<boolean> {
        try {
            const result = await pageAccessControl.checkPageAccess(url);
            return result.allowed;
        } catch (error) {
            console.error('检查页面访问权限失败:', error);
            return basicRouteGuard(url);
        }
    },
    
    /**
     * 安全导航（带权限检查）
     */
    async safeNavigateTo(url: string, options?: Partial<UniApp.NavigateToOptions>): Promise<boolean> {
        const hasAccess = await this.checkAccess(url);
        if (hasAccess) {
            uni.navigateTo({
                url,
                ...options
            });
            return true;
        }
        return false;
    },
    
    /**
     * 安全切换Tab（带权限检查）
     */
    async safeSwitchTab(url: string, options?: Partial<UniApp.SwitchTabOptions>): Promise<boolean> {
        const hasAccess = await this.checkAccess(url);
        if (hasAccess) {
            uni.switchTab({
                url,
                ...options
            });
            return true;
        }
        return false;
    },
    
    /**
     * 添加页面到白名单
     */
    addToWhitelist(url: string) {
        if (!whitelist.includes(url)) {
            whitelist.push(url);
            console.log('✅ 页面已添加到白名单:', url);
        }
    },
    
    /**
     * 从白名单移除页面
     */
    removeFromWhitelist(url: string) {
        const index = whitelist.indexOf(url);
        if (index > -1) {
            whitelist.splice(index, 1);
            console.log('✅ 页面已从白名单移除:', url);
        }
    }
};

// 导出白名单供其他模块使用
export { whitelist };

console.log('��️ 增强路由守卫系统已初始化');
