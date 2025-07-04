<template>
    <view class="wrap p-10">
        <u-parse :content="content" v-if="content" />
    </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { useShareAppMessage } from "@/hooks/user";

useShareAppMessage();
const content = ref("");

const typeObj = [
    { 
        type: "0", 
        name: "服务协议", 
        content: `
            <h2>服务协议</h2>
            <p>欢迎使用本小程序！</p>
            <h3>1. 服务条款</h3>
            <p>通过访问和使用本小程序，您同意遵守以下服务条款。</p>
            <h3>2. 用户责任</h3>
            <p>用户应当合法使用本小程序，不得进行任何违法活动。</p>
            <h3>3. 免责声明</h3>
            <p>本小程序按"现状"提供，不提供任何明示或暗示的保证。</p>
            <h3>4. 联系我们</h3>
            <p>如有任何问题，请联系我们的客服团队。</p>
        `
    },
    { 
        type: "1", 
        name: "隐私政策", 
        content: `
            <h2>隐私政策</h2>
            <p>我们重视您的隐私权，本政策说明我们如何收集、使用和保护您的个人信息。</p>
            <h3>1. 信息收集</h3>
            <p>我们可能收集您在使用小程序时提供的信息，包括但不限于：</p>
            <ul>
                <li>基本个人信息（昵称、头像等）</li>
                <li>设备信息</li>
                <li>使用数据</li>
            </ul>
            <h3>2. 信息使用</h3>
            <p>我们使用收集的信息来：</p>
            <ul>
                <li>提供和改进服务</li>
                <li>个性化用户体验</li>
                <li>确保服务安全</li>
            </ul>
            <h3>3. 信息保护</h3>
            <p>我们采取适当的安全措施来保护您的个人信息。</p>
            <h3>4. 联系我们</h3>
            <p>如对隐私政策有疑问，请联系我们。</p>
        `
    },
    { 
        type: "2", 
        name: "售后保障", 
        content: `
            <h2>售后保障</h2>
            <p>我们致力于为用户提供优质的售后服务。</p>
            <h3>1. 服务承诺</h3>
            <p>我们承诺为用户提供及时、专业的技术支持。</p>
            <h3>2. 问题反馈</h3>
            <p>如遇到问题，您可以通过以下方式联系我们：</p>
            <ul>
                <li>在线客服</li>
                <li>邮件反馈</li>
                <li>电话咨询</li>
            </ul>
            <h3>3. 处理时效</h3>
            <p>我们将在收到反馈后24小时内回复，并尽快解决问题。</p>
        `
    },
];

onLoad(async (options: any) => {
    const { type } = options;
    const find = typeObj.find((f) => f.type == type);
    
    if (!find) return;
    
    content.value = find.content;
    uni.setNavigationBarTitle({
        title: find.name,
    });
});
</script>

<style></style>
