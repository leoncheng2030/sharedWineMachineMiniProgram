import { CONFIG } from "@/constant";
import { useConfigStore } from "@/store/modules/config";
import { setStorage } from "@/utils";

//获取配置
export const useGetConfig = () => {
    const configStore = useConfigStore();
    
    // 使用默认配置数据，不进行API调用
    const defaultConfig = {
        icp_number: "",
        icp_link: "",
        mnQrcode: "",
        logo: "/static/images/icon_home.png",
        name: "小程序",
        shop_login_logo: "/static/images/icon_home.png",
        cate_style: "",
        copyright_info: "",
        index_setting: {
            showLogo: "1",
            index_top_bg: "",
            news: "0",
            hots: "0"
        },
        center_setting: {
            top_bg_image: "",
            open_recharge: "0"
        }
    };
    
    // 设置配置到store
    configStore.setConfig(defaultConfig);
    
    // 保存到本地存储
    setStorage(CONFIG, defaultConfig);
    
    return { data: defaultConfig, loading: false, error: null };
};

//获取窗口高度
export const useGetWindowHeight = () => {
    const info = uni.getWindowInfo();
    const windowHeight = info.windowHeight;
    return windowHeight;
};

// 空的购物车数量设置函数，保持兼容性
export const useSetCartCount = () => {
    // 空实现，保持兼容性
    return { data: null, loading: false, error: null };
};

// 导出认证相关hooks
export * from "./useAuth";
