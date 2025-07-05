import { createSSRApp } from "vue";
import App from "./App.vue";
import uviewPlus,{setConfig} from "uview-plus";
import "uno.css";
import "@unocss-applet/reset/uni-app/tailwind.css";
import "./uni.scss";
import "@/static/css/index.scss";
import "uview-plus/index.scss";
import { createPinia } from "pinia";
import StatusBar from "@/components/statusBar/index.vue";
import CustomDivider from "@/components/customDivder/index.vue";
import AndPrivacy from "@/components/andPrivacy/index.vue";
import AuthModal from "@/components/authModal/index.vue";
import EmptyState from "@/components/EmptyState/index.vue";
setConfig( {
    config: {
        // 修改默认单位为rpx，相当于执行 uni.$u.config.unit = 'rpx'
        // 组件的很多单位仍然为px并非配置不生效，而是rpx配置目前无法做到修改Vue单文件组件中的Css/Sass中写死的px单位。
        // 这个配置主要用于prop传参时的单位修改，比如<up-image width="80"></up-image>中的80会是rpx单位。
        // 如果需要全局组件样式变为rpx，可以尝试使用postcss等第三方插件转换。
        unit: 'px'
    },
})
export function createApp() {
    const app = createSSRApp(App);
    app.use(uviewPlus);
    app.use(createPinia());
    app.component("StatusBar", StatusBar);
    app.component("CustomDivider", CustomDivider);
    app.component("AndPrivacy", AndPrivacy);
    app.component("AuthModal", AuthModal);
    app.component("EmptyState", EmptyState);
    return {
        app,
    };
}
