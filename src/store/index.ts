import { createPinia } from "pinia";
import { useConfigStore } from "./modules/config";
import { useUserStore } from "./modules/user";
import { useAuthStore } from "./modules/auth";
const pinia = createPinia();
export { useConfigStore, pinia, useUserStore, useAuthStore };
