// 开发者环境：开|关	【注：方便微信小程序发行测试】
export const SWITCH_DEVELOPMENT = true;

/** S API BaseURL **/
// develop: //开发版，使用开发工具测试时
// trial: //体验版
// release: //正式版
export const baseURLMap = {
    develop: {
        // api_url: "http://10.245.249.227:82",
        api_url: "http://192.168.1.2:91",
    },
    trial: {
        // api_url: "http://10.245.249.227:82",
        api_url: "http://192.168.1.2:91",
    },
    release: {
        // api_url: "http://10.245.249.227:82",
        api_url: "http://192.168.1.2:91",
    },

    // 生产环境https://php-b2c.likeshop.cn
    production: "",
};
export enum OrderSource {
    wx = 1,
    h5 = 2,
    ios = 3,
    android = 4,
}
//支付类型
export enum PayWayType {
    wx = 1,
    apply = 2,
    balance = 3,
}

export enum OrderType {
    //全部
    ALL = 0,
    //待付款
    PENDING_PAY = 1,
    //待发货
    PENDING_DELIVERY = 2,
    //待收货
    DELIVERY = 3,
    //已完成,
    FINISH = 4,
    //已关闭
    CLOSE = 5,
    //待评价
    EVALUATE = 6,
    //退款中
    REFUND = 7,
}

export const orderStatus = {
    order: [
        {
            name: "待付款",
            value: 0,
        },
        {
            name: "待发货",
            value: 1,
        },
        {
            name: "待收货",
            value: 2,
        },
        {
            name: "待评价",
            value: 3,
        },
        {
            name: "已完成",
            value: 4,
        },
        {
            name: "已关闭",
            value: 5,
        },
    ],
    pay: [
        {
            name: "待支付",
            value: 0,
        },
        {
            name: "已支付",
            value: 1,
        },
        {
            name: "已退款",
            value: 2,
        },
        {
            name: "拒绝退款",
            value: 3,
        },
    ],
};
export const couponStatus = [
    { name: "去使用", value: 0 },
    { name: "已使用", value: 1 },
    { name: "已过期", value: 2 },
    { name: "领取", value: 3 },
];
export const backMoneyType = [
    { id: 0, title: "仅退款", desc: "未收到货，与卖家协商同意无需退货只需退款" },
    { id: 1, title: "退货退款", desc: "已收到货，需退还收到的实物" },
];
export enum LoadingType {
    loading = "loading",
    nomore = "nomore",
    loadmore = "loadmore",
}
//订单来源
export enum OrderFromType {
    recharge = "RECHARGE", //充值
    buy = "BUY", //商品
}
export enum actionType {
    separately = 0, //单独购买
    seckill = 1, //秒杀
    buynow = 2, //普通购物
    openGroup = 3, //开团
    addCart = 4, //加入购物车
}

export const actionTypes = [
    { name: "单独购买", color: "#ffa630", value: actionType.separately },
    { name: "秒杀", color: "red", value: actionType.seckill },
    { name: "立即购买", color: "red", value: actionType.buynow },
    { name: "开团", color: "red", value: actionType.openGroup },
    { name: "加入购物车", color: "#ffa630", value: actionType.addCart },
];
export enum OrderActionType {
    确认订单 = "info",
    提交订单 = "submit",
}
export enum DeliveryType {
    门店自提 = "selfPickupSwitch",
    快递配送 = "expressSwitch",
}

// 开发环境配置
export const devConfig = {
  baseUrl: 'http://localhost:8888',
  appId: 'dev_app_id',
  websocketUrl: 'ws://localhost:8888/ws'
}

// 生产环境配置
export const prodConfig = {
  baseUrl: 'http://test.weiqisheng.cn',
  appId: 'wx496f8c6f04580ab0',  // 微信小程序AppID
  websocketUrl: 'ws://test.weiqisheng.cn/ws'
}

// 当前环境配置 - 使用uni-app的环境变量
export const config = import.meta.env.DEV ? devConfig : prodConfig

// API基础路径
export const API_BASE_URL = config.baseUrl

// WebSocket连接地址
export const WS_URL = config.websocketUrl

// 微信小程序AppID
export const WX_APP_ID = config.appId

// 微信支付配置
export const WX_PAY_CONFIG = {
  appId: 'wx496f8c6f04580ab0',           // 微信小程序AppID
  merchantId: '1372536002',              // 微信支付商户号
  notifyUrl: 'http://test.weiqisheng.cn/pay/wx/notifyUrl',  // 支付回调地址
  timeExpire: 30,                        // 支付超时时间（分钟）
  payType: 'WECHAT_MINI'                 // 支付方式
}
