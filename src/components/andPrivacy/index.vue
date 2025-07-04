<template>
    <u-popup :show="showPrivacyPopup" mode="bottom" zIndex="9999" :round="10" :closeOnClickOverlay="false" safeAreaInsetBottom>
        <view class="privacy-containter" v-if="config">
            <view class="privacy-containter-tital">{{ config.name || "" }}隐私政策</view>
            <view class="privacy-containter-tip">欢迎你使用{{ config.name || "" }}！请仔细阅读以下内容，并作出适当的选择：</view>
            <view class="privacy-containter-outline">隐私政策概要</view>
            <view class="">主要说明：我们所处理的信息种类、方式和目的；你所享有的权益；第三方插件信息等。</view>
            <view class="primary mt-15" @click="handleOpen">点击阅读《隐私政策（小程序）》完整版 ></view>

            <button class="btn-comfirm" open-type="agreePrivacyAuthorization" @agreeprivacyauthorization="handleAgreePrivacyAuthorization">同意并继续</button>
            <button class="btn-cancel" @click="handlecancel">取消</button>
        </view>
    </u-popup>
</template>

<script setup lang="ts" name="andPrivacy">
import { useConfigStore } from "@/store";
import { onLoad } from "@dcloudio/uni-app";
import { storeToRefs } from "pinia";
import { ref } from "vue";
const configStore = useConfigStore();
const { config } = storeToRefs(configStore);
const emit = defineEmits(["submit"]);
const showPrivacyPopup = ref(false);
onLoad(() => {
    // #ifdef MP-WEIXIN
    if (wx.getPrivacySetting) {
        wx.getPrivacySetting({
            success: (res) => {
                if (res.needAuthorization) {
                    // 需要弹出隐私协议
                    uni.hideTabBar();
                    showPrivacyPopup.value = true;
                } else {
                    uni.showTabBar();
                }
            },
            fail: (err) => {
                uni.showTabBar();
            },
        });
    } else {
        uni.showTabBar();
    }
    // #endif
});
const handleOpen = () => {
    wx.openPrivacyContract({
        success: (res) => {
            console.log(res);
        },
        fail: (err) => {
            console.log(err);
        },
    });
};
const handleAgreePrivacyAuthorization = () => {
    showPrivacyPopup.value = false;
    uni.showTabBar();
    emit("submit");
};
const handlecancel = () => {
    // 符合隐私规范：用户拒绝后不应强制同意，应允许退出
    uni.showModal({
        title: '提示',
        content: '您可以选择不同意隐私政策，但可能无法使用部分功能。是否确定退出？',
        confirmText: '确定退出',
        cancelText: '重新考虑',
        success: (res) => {
            if (res.confirm) {
                // 用户确定退出，关闭小程序
                // 注意：小程序无法直接关闭，只能返回上一页或显示提示
                uni.showToast({
                    title: '您已退出，可重新进入小程序',
                    icon: 'none',
                    duration: 2000
                });
                // 可以跳转到一个说明页面或最小化功能页面
            } else {
                // 用户重新考虑，保持当前状态
                uni.showToast({
                    title: '请仔细阅读隐私政策',
                    icon: 'none'
                });
            }
        }
    });
};
</script>
<style lang="scss">
.privacy-containter {
    background-color: white;
    height: 750rpx;
    padding: 42rpx;
    &-tital {
        text-align: center;
        font-weight: 500;
        font-size: 36rpx;
    }
    &-tip {
        margin: 50rpx 0;
    }
    &-outline {
        font-weight: 500;
        margin-bottom: 15rpx;
    }
    &-read {
        margin-top: 15rpx;
    }
    .btn-comfirm {
        background-color: $-color-primary;
        color: white;
        height: 80rpx;
        line-height: 80rpx;
        margin-top: 50rpx;
    }
    .btn-cancel {
        background-color: #f7f7f7;
        height: 80rpx;
        line-height: 80rpx;
        margin-top: 30rpx;
    }
    .primary {
        color: $u-type-primary;
    }
}
</style>
