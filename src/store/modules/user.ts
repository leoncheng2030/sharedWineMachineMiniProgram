import { USER_INFO } from "@/constant";
import { getStorage, removeStorage } from "@/utils";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUserStore = defineStore("useUserStore", () => {
    const userInfo = ref<IUserInfo | null>(getStorage(USER_INFO) ?? null);
    const setUserInfo = (data: IUserInfo | null) => {
        userInfo.value = data;
    };
    
    const logout = () => {
        userInfo.value = null;
        removeStorage(USER_INFO);
    };
    
    return { userInfo, setUserInfo, logout };
});
