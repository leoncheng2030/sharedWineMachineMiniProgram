<template>
    <view class="screen-full">
        <web-view :src="url" v-if="url"></web-view>
    </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
const url = ref("");
onLoad((options: any) => {
    const urls = options.url;
    url.value = urls;
});
</script>
<style scoped lang="scss"></style>
