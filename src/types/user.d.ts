interface IAppid {
    sessionKey: string;
    openId: string;
}
interface IUserInfo {
    id: string;
    parentId: string;
    avatar: string;
    signature: string;
    account: string;
    name: string;
    nickname: string;
    gender: string;
    age: string;
    birthday: string | number;
    phone: string;
    email: null;
    balance: number;
    points: number;
    growth: number;
    commission: number;
    level: Level;
    couponNum: number;
    nextGrowthDiffer: number;
    lastLoginIp: string;
    lastLoginAddress: string;
    lastLoginTime: string;
    lastLoginDevice: string;
    latestLoginIp: string;
    latestLoginAddress: string;
    latestLoginTime: string;
    latestLoginDevice: string;
    userStatus: string;
    sortCode: string;
    extJson: string;
    buttonCodeList: any[];
    mobileButtonCodeList: any[];
    permissionCodeList: any[];
    roleCodeList: any[];
    dataScopeList: any[];
    enabled: boolean;
    sn: string;
    // 佣金账户相关字段
    commissionBalance?: number;
    availableBalance?: number;
    frozenBalance?: number;
    commissionAccountStatus?: string;
    totalCommissionIncome?: number;
    totalWithdrawAmount?: number;
    commissionAccountCreateTime?: string;
}

interface Level {
    id: string;
    tenantId: string;
    name: string;
    growth: null;
    iconImage: string;
    bgImage: string;
    discount: string;
    privilege: string;
    memo: null;
    sortCode: null;
    extJson: null;
}

interface IAgree {
    service: string;
    privacy: string;
}
interface IRsultPage<T> {
    records: T;
    total: number;
    size: number;
    current: number;
    pages: number;
}
interface IAddress {
    address: string;
    cityId: number;
    clientUserId: string;
    createTime: string;
    createUser: string;
    deleteFlag: string;
    districtId: number;
    id: string;
    isDefault: number;
    latitude: number;
    longitude: number;
    name: string;
    phone: string;
    postCode: string;
    provinceId: number;
    sortCode: string;
    tags: string;
    tenantId: string;
    updateTime: string;
    updateUser: string;
    region: string;
    districtName: string;
    provinceName: string;
    cityName: string;
}
// blance代表余额，points代表积分，growth代表成长值

interface IWallet {
    balance: number;
    points: number;
    growth: number;
    rechargeCount: number;
    consumeCount: number;
    commission: number;
    openRecharge: number;
}
interface IRecharge {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    money: number;
    giveMoney: number;
    sort: number;
    isRecommend: boolean;
}
interface IMonyConfig {
    open_recharge: string;
    giveGrowth: string;
    rechargeMin: string;
    givePoints: string;
}
interface ISign {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    days: number;
    points: number;
    continuousPoints: number;
    signTime: string;
    clientUserId: string;
    growth: number;
    continuousGrowth: number;
    clientUserName: string;
}
interface ISignInfo {
    signTotalDays: number;
    todaySignStatus: number;
    signListItemPojo: SignListItemPojo;
}

interface SignListItemPojo {
    "1": _1;
    "2": _1;
    "3": _1;
    "4": _1;
    "5": _1;
    "6": _1;
    "7": _1;
    "8": _1;
    "9": _1;
    "10": _1;
    "11": _1;
    "12": _1;
}

interface _1 {
    days: number;
    status: number;
    points: number;
    growth: number;
}
interface IPoints {
    createTime: string;
    createUser: string;
    createUserName: null;
    updateTime: null;
    updateUser: null;
    updateUserName: null;
    id: string;
    tenantId: string;
    clientUserId: string;
    clientUserNickname: string;
    clientUserPhone: string;
    num: number;
    adjustAfter: number;
    type: string;
    memo: string;
    orderId: null;
}
interface IPoints {
    createTime: string;
    createUser: string;
    id: string;
    tenantId: string;
    clientUserId: string;
    clientUserNickname: string;
    clientUserPhone: string;
    num: number;
    adjustAfter: number;
    type: string;
    memo: string;
}
interface IPointTask {
    name: string;
    description: string;
    points: number;
    status: number;
    showIcon: number;
}
interface ICoupon {
    createTime: string;
    createUser: string;
    createUserName: string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: string;
    name: string;
    sendTimeStart: string;
    sendTimeEnd: string;
    money: number;
    conditionType: number;
    conditionMoney: number;
    sendTotalType: number;
    sendTotal: number;
    useTimeType: number;
    useTimeStart: string;
    useTimeEnd: string;
    useTime: number;
    getType: number;
    getNumType: number;
    getNum: number;
    useGoodsType: number;
    status: number;
    useProducts: string;
    isGet: number;
    couponType: string;
    useTimeTips: string;
    useCondition: string;
    couponName: string;
}

interface ILevel {
    growthRule: string;
    levelList: LevelList[];
    clientUser: ClientUser;
}

interface ClientUser {
    avatar: string;
    nickname: string;
    levelName: string;
    growth: number;
}

interface LevelList {
    createTime: null | string;
    createUser: null | string;
    createUserName: null | string;
    updateTime: string;
    updateUser: string;
    updateUserName: string;
    id: number;
    tenantId: string;
    name: string;
    growth: number;
    iconImage: string;
    bgImage: string;
    discount: string;
    privilege: string;
    memo: null;
    sortCode: null;
    extJson: null;
    growthTip: string;
    currentLevelStatus: number;
    privilegeList: PrivilegeList[];
    diffGrowthTip: string;
    diffGrowthPercent: number;
}

interface PrivilegeList {
    id: string;
    tenantId: string;
    name: string;
    image: string;
    memo: null;
    sortCode: null;
    extJson: null;
    deleteFlag: string;
    createTime: string;
    createUser: string;
    updateTime: string;
    updateUser: string;
}
interface ISpread {
    createTime: string;
    createUser: string;
    createUserName: null;
    updateTime: null;
    updateUser: null;
    updateUserName: null;
    id: string;
    clientUserId: string;
    realName: string;
    province: number;
    city: number;
    district: number;
    reason: string;
    status: number;
    clientUserSn: string;
    clientUserAvatar: string;
    clientUserNickname: string;
    clientUserClientLevelId: string;
    clientUserPhone: string;
    provinceName: string;
    cityName: string;
    districtName: string;
}
interface IPayDetail {
    createTime: string;
    createUser: string;
    createUserName: null;
    updateTime: null;
    updateUser: null;
    updateUserName: null;
    id: string;
    orderSn: string;
    transactionId: null;
    orderSource: boolean;
    payWay: number;
    payStatus: boolean;
    payTime: null;
    clientUserId: string;
    templateId: null;
    orderAmount: number;
    giveMoney: null;
    givePoints: null;
    giveGrowth: null;
    wechatMiniExpressSync: string;
    wechatMiniExpressSyncTime: number;
    payLeftTime: number;
    tips: string;
    payEndTime: number;
    payTips: string;
}
interface ISpreadInfos {
    firstLeaderName: null;
    commission: number;
    dayCommission: number;
    monthCommission: number;
    commissionCount: number;
    fansNum: number;
    distributionCode: string;
}
interface ISpreadUser {
    id: string;
    nickName: string;
    name: string;
    avatar: string;
    phone: string;
    sn: string;
}
interface IQrcodeInfo {
    clientBaseInfo: ClientBaseInfo;
    qrcode: string;
    background: string;
}

interface ClientBaseInfo {
    id: string;
    nickName: null;
    name: string;
    avatar: string;
    phone: string;
    sn: string;
    distributionCode: null;
}
interface IFans {
    createTime: null;
    createUser: null;
    createUserName: null;
    updateTime: null;
    updateUser: null;
    updateUserName: null;
    id: string;
    sn: string;
    distributionCode: null;
    openId: null;
    firstLeaderId: null;
    secondLeaderId: null;
    thirdLeaderId: null;
    allLeaderIds: null;
    avatar: string;
    account: null;
    name: null;
    nickname: string;
    gender: null;
    age: null;
    birthday: null;
    clientLevelId: null;
    payPassword: null;
    balance: null;
    points: null;
    growth: null;
    commission: null;
    rechargeCount: null;
    consumeCount: null;
    commissionCount: number;
    isDistribution: null;
    distributionMiniQrCode: null;
    lastLoginIp: null;
    phone: string;
    email: null;
    level: null;
    couponNum: null;
    nextGrowthDiffer: null;
    lastLoginAddress: null;
    lastLoginTime: null;
    lastLoginDevice: null;
    latestLoginIp: null;
    latestLoginAddress: null;
    latestLoginTime: null;
    latestLoginDevice: null;
    userStatus: null;
    sortCode: null;
    extJson: null;
    genderName: string;
}
