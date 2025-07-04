<template>
    <view :style="{ height: statusBarHeight + 'px', display: 'block' }" />
</template>

<script setup lang="ts" name="statusBar">
import { ref, onMounted } from "vue";

const statusBarHeight = ref(0);

onMounted(() => {
  try {
    const sysinfo = uni.getSystemInfoSync();
    statusBarHeight.value = sysinfo.statusBarHeight || 44;
  } catch (error) {
    console.warn('获取状态栏高度失败，使用默认值', error);
    statusBarHeight.value = 44;
  }
});
</script>
<style scoped lang="less"></style>
