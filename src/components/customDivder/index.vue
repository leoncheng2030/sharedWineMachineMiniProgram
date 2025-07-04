<template>
    <view class="divder my-20">
        <up-divider :text="text"></up-divider>
    </view>
</template>

<script setup lang="ts" name="CustomDivider">
import { ref, toRefs } from "vue";
interface Props {
    text?: string;
}
const props = withDefaults(defineProps<Props>(), { text: "我可是有底线的～" });
const { text } = toRefs(props);
</script>
<style scoped lang="scss"></style>
