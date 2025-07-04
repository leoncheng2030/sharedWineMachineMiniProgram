import { useUserStore } from "@/store";
import { storeToRefs } from "pinia";
import { onShareAppMessage, onShareTimeline } from "@dcloudio/uni-app";
import { computed, onMounted, ref } from "vue";
import { getStorage, removeStorage, setStorage } from "@/utils";
import { USER_INFO, USER_TOKEN } from "@/constant";

export const currentPage = () => {
    let pages = getCurrentPages();
    let currentPage = pages[pages.length - 1];
    return currentPage || {};
};

// 获取登录凭证（code）
export const getWxCode = () => {
    return new Promise((resolve, reject) => {
        uni.login({
            success(res) {
                resolve(res.code);
            },
            fail(res) {
                reject(res);
            },
        });
    });
};

export const userGetUserInfo = (options = { manual: false }) => {
    const userStore = useUserStore();
    
    // 模拟用户信息获取
    const mockGetUserInfo = () => {
        // 创建符合IUserInfo接口的完整对象
        const mockUserInfo: any = {
            id: "mock_user_id",
            parentId: "",
            avatar: "/static/images/avatar.png",
            signature: "",
            account: "test_account",
            name: "测试用户",
            nickname: "测试用户",
            gender: "1",
            age: "25",
            birthday: "",
            phone: "138****8888",
            email: null,
            balance: 0,
            points: 0,
            growth: 0,
            commission: 0,
            level: {
                id: "",
                tenantId: "",
                name: "普通会员",
                growth: null,
                iconImage: "",
                bgImage: "",
                discount: "",
                privilege: "",
                memo: null,
                sortCode: null,
                extJson: null
            },
            couponNum: 0,
            nextGrowthDiffer: 0,
            lastLoginIp: "",
            lastLoginAddress: "",
            lastLoginTime: "",
            lastLoginDevice: "",
            latestLoginIp: "",
            latestLoginAddress: "",
            latestLoginTime: "",
            latestLoginDevice: "",
            userStatus: "1",
            sortCode: "",
            extJson: "",
            buttonCodeList: [],
            mobileButtonCodeList: [],
            permissionCodeList: [],
            roleCodeList: [],
            dataScopeList: [],
            enabled: true,
            sn: "test_sn"
        };
        
        setStorage(USER_INFO, mockUserInfo);
        userStore.setUserInfo(mockUserInfo);
        return mockUserInfo;
    };

    return {
        run: mockGetUserInfo,
        data: null,
        loading: false,
        error: null
    };
};

export const useUserInfo = () => {
    const userStore = useUserStore();
    const { userInfo } = storeToRefs(userStore);
    return userInfo;
};

//分享
export const useShareAppMessage = () => {
    // #ifdef  MP-WEIXIN
    const config = ref();
    wx.showShareMenu({
        withShareTicket: true,
        menus: ["shareAppMessage", "shareTimeline"],
    });
    onMounted(() => {
        let routes = getCurrentPages(); // 获取当前打开过的页面路由数组
        const current = routes[routes.length - 1];

        const path = current.route;
        const options = (current as any)?.options ?? {}; //获取当前页面路由参数
        let parmas = Object.keys(options)
            .map((key) => {
                const value = options[key];
                return `${key}=${value}`;
            })
            .join("&");
        const obj = {
            path: parmas ? path + "?" + parmas : path,
            title: "",
            imageUrl: "",
        };
        config.value = obj;
    });
    onShareAppMessage(() => {
        return config.value;
    });
    onShareTimeline(() => {
        return config.value;
    });
    // #endif
};

//用户是否登录
export const useIsLogin = () => {
    const token = getStorage(USER_TOKEN);
    const userinfo = useUserInfo();
    const isLogin = computed(() => {
        return token ? true : false;
    });
    return isLogin;
};

//获取用户信息
export const useGetUser = () => {
    const { run } = userGetUserInfo({ manual: true });
    onMounted(() => {
        const token = getStorage(USER_TOKEN);
        if (token) run();
    });
};
