import type { App } from "vue";
import StatusBar from "./statusBar/index.vue";
import CustomDivider from "./customDivder/index.vue";
import AndPrivacy from "./andPrivacy/index.vue";
import AuthModal from "./authModal/index.vue";
import EmptyState from "./EmptyState/index.vue";

export default {
    install: (app: App) => {
        app.component("StatusBar", StatusBar);
        app.component("CustomDivider", CustomDivider);
        app.component("AuthModal", AuthModal);
        app.component("EmptyState", EmptyState);
    },
};

export { StatusBar, CustomDivider, AndPrivacy, AuthModal, EmptyState };