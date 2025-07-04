interface IConfig {
    icp_number: string;
    icp_link: string;
    mnQrcode: string;
    index_setting: Indexsetting;
    name: string;
    shop_login_logo: string;
    center_setting: Centersetting;
    logo: string;
    cate_style: string;
    copyright_info: string;
}

interface Centersetting {
    top_bg_image: string;
    open_recharge: string | number;
}

interface Indexsetting {
    news: string | number;
    showLogo: string;
    hots: string | number;
    index_top_bg: string;
}

interface INavList {
    name: string;
    image: string;
    link: string;
    is_tab: number;
    link_type: number;
}
interface INewsCategory {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    parentId: string;
    name: string;
    memo: string;
    description: string;
    thumbnail: string;
    status: string;
    type: string;
    sortCode: number;
    extJson: string;
    tenantId: string;
}
interface INews {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    tenantId: string;
    categoryId: string;
    title: string;
    memo: string;
    description: string;
    thumbnail: string;
    author: string;
    views: number;
    status: string;
    content: null;
    sortCode: number;
    type: string;
    extJson: null;
    categoryName: string;
}
interface INewsDetail {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    tenantId: string;
    categoryId: string;
    title: string;
    memo: string;
    description: string;
    thumbnail: string;
    author: string;
    views: number;
    status: string;
    content: string;
    sortCode: number;
    type: string;
    extJson: string;
    categoryName: string;
}
interface ISeckill {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    tenantId: string;
    startTime: string;
    endTime: string;
    name: string;
    status: number;
    statusStr: string;
}
interface ISeckillGoods {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: null;
    updateUser: null;
    updateUserName: null;
    id: string;
    seckillTimeId: string;
    productId: string;
    minPrice: number;
    maxPrice: number;
    sales: number;
    status: number;
    secKillTimeEndTime: string;
    secKillTimeStartTime: string;
    productThumbnail: string;
    productMinPrice: string;
    productMaxPrice: string;
    productName: string;
}
interface IAD {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    tenantId: string;
    name: string;
    mode: string;
    imgWidth: number;
    imgHeight: number;
    status: string;
    sortCode: string;
    extJson: string;
}
interface IAdDetail {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    tenantId: string;
    categoryId: string;
    title: string;
    image: string;
    status: string;
    startDate: string;
    endDate: string;
    sortCode: number;
    extJson: string;
    categoryName: string;
}

interface ITransfer {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    tenantId: string;
    fromUserId: string;
    toUserId: string;
    money: number;
    fromUserName: string;
    fromUserSn: string;
    fromUserNickname: string;
    fromUserAvatar: string;
    toUserAvatar: string;
    toUserName: string;
    toUserSn: string;
    toUserNickname: string;
    type: number;
}
interface IOrderArrow {
    name: string;
    value: string;
    arrow: boolean;
}
interface IHostData {
    id: string;
    keywords: string;
    userTimes: number;
    deleteFlag: string;
    createTime: string;
    createUser: string;
    updateTime: null;
    updateUser: null;
}
