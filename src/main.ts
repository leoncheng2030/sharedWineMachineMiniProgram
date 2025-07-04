import { createSSRApp } from "vue";
import App from "./App.vue";
import uviewPlus from "uview-plus";
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
