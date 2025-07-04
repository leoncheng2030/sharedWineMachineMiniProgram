interface Good {
    id: number;
    name: string;
    image: string;
    min_price: string;
    seckill_price: string;
    sales_sum: number;
}
interface IHhost {
    id: number;
    name: string;
    image: string;
    price: string;
    market_price: string;
    sales_sum: number;
}
interface INewsGood {
    id: number;
    name: string;
    image: string;
    price: string;
    market_price: string;
    sales_sum: number;
}
interface IHomeList {
    activityAreaList: ActivityAreaList[];
    hotList: HotList[];
    newList: HotList[];
    seckill: Seckill;
    goodList: HotList[];
}

interface Seckill {
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
    productIds: ProductId[];
    name: null;
    status: null;
    tips: null;
}

interface ProductId {
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
    status: null;
    tips: null;
    secKillTimeEndTime: string;
    secKillTimeStartTime: string;
    productThumbnail: string;
    productMinPrice: string;
    productMaxPrice: string;
    productName: string;
}

interface HotList {
    createTime: null;
    createUser: null;
    createUserName: null;
    updateTime: null;
    updateUser: null;
    updateUserName: null;
    id: string;
    tenantId: null;
    categoryId: null;
    brandId: null;
    supplierId: null;
    name: string;
    code: null;
    memo: null;
    content: null;
    thumbnail: string;
    images: null;
    video: null;
    shareImage: null;
    specType: null;
    status: null;
    sortCode: null;
    extJson: null;
    sales: number;
    stock: null;
    views: null;
    maxPrice: number;
    minPrice: number;
    maxMarketPrice: number;
    virtualSales: null;
    virtualViews: null;
    stockWarning: null;
    showStock: null;
    expressShippingId: null;
    pointDeduction: null;
    giftPointType: null;
    giftPointFee: null;
    vipPriceType: null;
    isNew: null;
    isGood: null;
    isLike: null;
    categoryName: null;
    brandName: null;
    supplierName: null;
}

interface ActivityAreaList {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    tenantId: string;
    name: string;
    title: string;
    memo: null | string;
    thumbnail: string;
    status: string;
    sortCode: null;
    extJson: null;
}
