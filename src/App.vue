<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { authGuard } from '@/utils/auth';
import { useAuthStore } from '@/store/modules/auth';

// 应用启动
onLaunch(async () => {
    // 检查本地存储的token，如果存在则尝试恢复登录状态
    const storedToken = uni.getStorageSync('USER_TOKEN');
    
    if (storedToken) {
        // 使用store来恢复认证状态
        try {
            const authStore = useAuthStore();
            
            // 设置token（这会触发响应式更新）
            authStore.setToken(storedToken);
            
            // 尝试获取用户信息来验证token有效性
            try {
                await authStore.fetchUserInfo();
            } catch (error) {
                authStore.setToken('');
                authStore.setUserInfo(null);
            }
        } catch (error) {
            console.error('使用store失败:', error);
        }
    }
});

onShow(() => {
    // 应用从后台回到前台时，验证认证状态
    authGuard.validateAuthState().catch(error => {
        console.error('应用Show认证检查失败:', error);
    });
});

onHide(() => {
    // 应用隐藏
});
</script>
<style lang="scss">
@import "uview-plus/index.scss";

uni-page-body,
html,
body {
    height: 100%;
}

page {
    width: 100%;
    min-height: 100%;
    font-size: 26rpx;
    font-family: PingFang SC, Arial, Hiragino Sans GB, Microsoft YaHei, sans-serif;

    color: #303133;
    /* padding-bottom: env(safe-area-inset-bottom); */
    background-color: #f6f6f6;
}
</style>
