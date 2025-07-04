/**
 * 认证和授权工具类
 * 提供完整的用户认证、权限验证、安全控制功能
 */

import { ref, computed } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { USER_TOKEN, USER_INFO } from '@/constant';
import { getStorage, setStorage, removeStorage } from '@/utils';
import { checkWechatLoginStatus } from '@/utils/wechat';

/**
 * 权限类型定义
 */
export interface Permission {
    code: string;
    name: string;
    description?: string;
}

/**
 * 用户角色定义
 */
export interface UserRole {
    code: string;
    name: string;
    permissions: Permission[];
}

/**
 * 认证状态
 */
export interface AuthState {
    isAuthenticated: boolean;
    isTokenValid: boolean;
    isSessionValid: boolean;
    lastCheckTime: number;
    checkCount: number;
}

/**
 * 认证守卫类
 */
export class AuthGuard {
    private static instance: AuthGuard;
    private authState = ref<AuthState>({
        isAuthenticated: false,
        isTokenValid: false,
        isSessionValid: false,
        lastCheckTime: 0,
        checkCount: 0
    });

    private constructor() {
        this.initAuthGuard();
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): AuthGuard {
        if (!AuthGuard.instance) {
            AuthGuard.instance = new AuthGuard();
        }
        return AuthGuard.instance;
    }

    /**
     * 初始化认证守卫
     */
    private async initAuthGuard() {
        console.log('🔐 初始化认证守卫...');
        
        // 监听网络状态变化
        uni.onNetworkStatusChange((res) => {
            if (res.isConnected) {
                this.validateAuthState();
            }
        });

        // 监听应用前后台切换
        uni.onAppShow(() => {
            this.validateAuthState();
        });

        // 初始验证
        await this.validateAuthState();
    }

    /**
     * 验证认证状态
     */
    public async validateAuthState(): Promise<boolean> {
        try {
            console.log('🔍 开始验证认证状态...');
            
            const now = Date.now();
            const { lastCheckTime, checkCount } = this.authState.value;
            
            // 防止频繁检查（30秒内最多检查3次）
            if (now - lastCheckTime < 30000 && checkCount >= 3) {
                console.log('⏰ 认证检查过于频繁，跳过本次检查');
                return this.authState.value.isAuthenticated;
            }

            // 更新检查状态
            this.authState.value.lastCheckTime = now;
            this.authState.value.checkCount = now - lastCheckTime < 30000 ? checkCount + 1 : 1;

            // 1. 检查本地token
            const token = getStorage(USER_TOKEN);
            if (!token) {
                console.log('❌ 本地token不存在');
                this.updateAuthState(false, false, false);
                return false;
            }

            this.authState.value.isTokenValid = true;

            // 2. 检查微信session
            const isWechatValid = await checkWechatLoginStatus();
            if (!isWechatValid) {
                console.log('❌ 微信session已失效');
                this.updateAuthState(false, true, false);
                await this.clearAuthData();
                return false;
            }

            this.authState.value.isSessionValid = true;

            // 3. 验证用户信息
            const userInfo = getStorage(USER_INFO);
            if (!userInfo) {
                console.log('⚠️ 用户信息不存在，尝试重新获取');
                const authStore = useAuthStore();
                const newUserInfo = await authStore.fetchUserInfo();
                if (!newUserInfo) {
                    console.log('❌ 获取用户信息失败');
                    this.updateAuthState(false, true, true);
                    await this.clearAuthData();
                    return false;
                }
            }

            // 4. 所有验证通过
            console.log('✅ 认证状态验证通过');
            this.updateAuthState(true, true, true);
            return true;

        } catch (error) {
            console.error('❌ 认证状态验证失败:', error);
            this.updateAuthState(false, false, false);
            return false;
        }
    }

    /**
     * 更新认证状态
     */
    private updateAuthState(isAuthenticated: boolean, isTokenValid: boolean, isSessionValid: boolean) {
        this.authState.value.isAuthenticated = isAuthenticated;
        this.authState.value.isTokenValid = isTokenValid;
        this.authState.value.isSessionValid = isSessionValid;
    }

    /**
     * 清除认证数据
     */
    private async clearAuthData() {
        removeStorage(USER_TOKEN);
        removeStorage(USER_INFO);
        const authStore = useAuthStore();
        await authStore.logout();
    }

    /**
     * 获取认证状态
     */
    public getAuthState() {
        return computed(() => this.authState.value);
    }

    /**
     * 检查是否已认证
     */
    public isAuthenticated(): boolean {
        return this.authState.value.isAuthenticated;
    }
}

/**
 * 权限管理类
 */
export class PermissionManager {
    private static instance: PermissionManager;
    private userPermissions = ref<Permission[]>([]);
    private userRoles = ref<UserRole[]>([]);

    private constructor() {}

    public static getInstance(): PermissionManager {
        if (!PermissionManager.instance) {
            PermissionManager.instance = new PermissionManager();
        }
        return PermissionManager.instance;
    }

    /**
     * 设置用户权限
     */
    public setUserPermissions(permissions: Permission[]) {
        this.userPermissions.value = permissions;
    }

    /**
     * 设置用户角色
     */
    public setUserRoles(roles: UserRole[]) {
        this.userRoles.value = roles;
        // 从角色中提取权限
        const allPermissions = roles.flatMap(role => role.permissions);
        this.setUserPermissions(allPermissions);
    }

    /**
     * 检查权限
     */
    public hasPermission(permissionCode: string): boolean {
        return this.userPermissions.value.some(p => p.code === permissionCode);
    }

    /**
     * 检查多个权限（AND关系）
     */
    public hasAllPermissions(permissionCodes: string[]): boolean {
        return permissionCodes.every(code => this.hasPermission(code));
    }

    /**
     * 检查多个权限（OR关系）
     */
    public hasAnyPermission(permissionCodes: string[]): boolean {
        return permissionCodes.some(code => this.hasPermission(code));
    }

    /**
     * 检查角色
     */
    public hasRole(roleCode: string): boolean {
        return this.userRoles.value.some(r => r.code === roleCode);
    }

    /**
     * 获取用户权限列表
     */
    public getUserPermissions() {
        return computed(() => this.userPermissions.value);
    }

    /**
     * 获取用户角色列表
     */
    public getUserRoles() {
        return computed(() => this.userRoles.value);
    }
}

/**
 * 页面访问控制
 */
export class PageAccessControl {
    private static instance: PageAccessControl;
    private authGuard: AuthGuard;
    private permissionManager: PermissionManager;

    // 页面权限配置
    private pagePermissions: Record<string, {
        requireAuth: boolean;
        permissions?: string[];
        roles?: string[];
        fallbackUrl?: string;
    }> = {
        '/pages/wallet/wallet': {
            requireAuth: true,
            fallbackUrl: '/pages/user/user'
        },
        '/pages/wallet/withdraw': {
            requireAuth: true,
            permissions: ['wallet:withdraw'],
            fallbackUrl: '/pages/wallet/wallet'
        },
        '/pages/wallet/records': {
            requireAuth: true,
            permissions: ['wallet:view'],
            fallbackUrl: '/pages/wallet/wallet'
        },
        '/pages/order/list': {
            requireAuth: true,
            fallbackUrl: '/pages/index/index'
        },
        '/pages/user/profile': {
            requireAuth: true,
            fallbackUrl: '/pages/user/user'
        }
    };

    private constructor() {
        this.authGuard = AuthGuard.getInstance();
        this.permissionManager = PermissionManager.getInstance();
    }

    public static getInstance(): PageAccessControl {
        if (!PageAccessControl.instance) {
            PageAccessControl.instance = new PageAccessControl();
        }
        return PageAccessControl.instance;
    }

    /**
     * 检查页面访问权限
     */
    public async checkPageAccess(url: string): Promise<{
        allowed: boolean;
        reason?: string;
        fallbackUrl?: string;
    }> {
        const config = this.pagePermissions[url];
        
        // 页面不需要权限控制
        if (!config) {
            return { allowed: true };
        }

        // 检查认证状态
        if (config.requireAuth) {
            const isAuth = await this.authGuard.validateAuthState();
            if (!isAuth) {
                return {
                    allowed: false,
                    reason: '需要登录',
                    fallbackUrl: config.fallbackUrl || '/pages/user/user'
                };
            }
        }

        // 检查权限
        if (config.permissions && config.permissions.length > 0) {
            const hasPermission = this.permissionManager.hasAllPermissions(config.permissions);
            if (!hasPermission) {
                return {
                    allowed: false,
                    reason: '权限不足',
                    fallbackUrl: config.fallbackUrl || '/pages/index/index'
                };
            }
        }

        // 检查角色
        if (config.roles && config.roles.length > 0) {
            const hasRole = config.roles.some(role => this.permissionManager.hasRole(role));
            if (!hasRole) {
                return {
                    allowed: false,
                    reason: '角色权限不足',
                    fallbackUrl: config.fallbackUrl || '/pages/index/index'
                };
            }
        }

        return { allowed: true };
    }

    /**
     * 添加页面权限配置
     */
    public addPagePermission(url: string, config: {
        requireAuth: boolean;
        permissions?: string[];
        roles?: string[];
        fallbackUrl?: string;
    }) {
        this.pagePermissions[url] = config;
    }
}

/**
 * 安全工具类
 */
export class SecurityUtils {
    /**
     * Base64编码（兼容小程序环境）
     */
    private static base64Encode(str: string): string {
        // 在小程序环境中使用uni.arrayBufferToBase64
        try {
            const buffer = new ArrayBuffer(str.length);
            const uint8Array = new Uint8Array(buffer);
            for (let i = 0; i < str.length; i++) {
                uint8Array[i] = str.charCodeAt(i);
            }
            return uni.arrayBufferToBase64(buffer);
        } catch (error) {
            console.warn('Base64编码失败，使用原始字符串:', error);
            return str;
        }
    }

    /**
     * Base64解码（兼容小程序环境）
     */
    private static base64Decode(encodedStr: string): string {
        try {
            const buffer = uni.base64ToArrayBuffer(encodedStr);
            const uint8Array = new Uint8Array(buffer);
            let str = '';
            for (let i = 0; i < uint8Array.length; i++) {
                str += String.fromCharCode(uint8Array[i]);
            }
            return str;
        } catch (error) {
            console.warn('Base64解码失败，返回原始字符串:', error);
            return encodedStr;
        }
    }

    /**
     * 加密存储token
     */
    public static encryptToken(token: string): string {
        // 简单的Base64编码（实际项目中应使用更强的加密）
        return this.base64Encode(token);
    }

    /**
     * 解密token
     */
    public static decryptToken(encryptedToken: string): string {
        try {
            return this.base64Decode(encryptedToken);
        } catch {
            return '';
        }
    }

    /**
     * 验证token格式
     */
    public static validateTokenFormat(token: string): boolean {
        // 检查token格式（示例：JWT格式）
        if (!token || typeof token !== 'string') {
            return false;
        }
        const parts = token.split('.');
        return parts.length === 3;
    }

    /**
     * 生成设备指纹
     */
    public static generateDeviceFingerprint(): string {
        const systemInfo = uni.getSystemInfoSync();
        const fingerprint = `${systemInfo.model}-${systemInfo.system}-${systemInfo.platform}-${systemInfo.brand}`;
        return this.base64Encode(fingerprint);
    }
}

// 导出单例实例
export const authGuard = AuthGuard.getInstance();
export const permissionManager = PermissionManager.getInstance();
export const pageAccessControl = PageAccessControl.getInstance();

/**
 * 认证装饰器函数
 */
export function requireAuth(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
        const isAuth = await authGuard.validateAuthState();
        if (!isAuth) {
            uni.showToast({
                title: '请先登录',
                icon: 'none'
            });
            return null;
        }
        return originalMethod.apply(this, args);
    };
    
    return descriptor;
}

/**
 * 权限装饰器函数
 */
export function requirePermission(permissionCode: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = async function (...args: any[]) {
            const hasPermission = permissionManager.hasPermission(permissionCode);
            if (!hasPermission) {
                uni.showToast({
                    title: '权限不足',
                    icon: 'none'
                });
                return null;
            }
            return originalMethod.apply(this, args);
        };
        
        return descriptor;
    };
} 