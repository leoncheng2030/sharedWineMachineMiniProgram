import { post, get } from './request';

/**
 * 微信小程序登录参数
 */
export interface WechatLoginParams {
    /** 微信授权码（必填） */
    code: string;
    /** 设备类型 */
    device?: string;
    /** 用户昵称（可选） */
    nickName?: string;
    /** 用户头像（可选） */
    avatarUrl?: string;
    /** 手机号（可选，用于绑定已有账户） */
    phone?: string;
    /** 手机号验证码（当提供手机号时必填） */
    phoneCode?: string;
    /** 手机号授权码（新版本微信授权） */
    phoneAuthCode?: string;
    /** 手机号加密数据（传统微信授权） */
    encryptedData?: string;
    /** 手机号解密向量（传统微信授权） */
    iv?: string;
    /** 云开发手机号ID（云开发环境） */
    cloudID?: string;
    /** 静默登录标记（使用历史信息登录，不需要重新授权） */
    silentLogin?: boolean;
    /** 是否为老用户（用于区分新老用户登录流程） */
    isReturningUser?: boolean;
}

/**
 * 获取手机验证码参数
 */
export interface GetPhoneCodeParams {
    /** 手机号 */
    phone: string;
    /** 图片验证码 */
    validCode?: string;
    /** 图片验证码请求号 */
    validCodeReqNo?: string;
}

/**
 * 图片验证码结果
 */
export interface PicCaptchaResult {
    /** 验证码图片Base64 */
    validCodeBase64: string;
    /** 验证码请求号 */
    validCodeReqNo: string;
}

/**
 * 用户信息
 */
export interface UserInfo {
    id: string;
    account: string;
    name: string;
    nickname: string;
    avatar: string;
    phone: string;
    email?: string;
    balance: number;
    points: number;
    growth: number;
    commission: number;
    level?: any;
    userStatus: string;
    enabled: boolean;
    [key: string]: any;
}

/**
 * 认证API
 */
export const authApi = {
    /**
     * 微信小程序登录
     */
    wechatLogin: (params: WechatLoginParams): Promise<string> => {
        return post<string>('/auth/c/doLoginByMini', params);
    },

    /**
     * 获取图片验证码
     */
    getPicCaptcha: (): Promise<PicCaptchaResult> => {
        return get<PicCaptchaResult>('/auth/c/getPicCaptcha');
    },

    /**
     * 获取手机登录验证码
     */
    getPhoneValidCode: (params: GetPhoneCodeParams): Promise<string> => {
        return get<string>('/auth/c/getPhoneValidCode', params);
    },

    /**
     * 获取登录用户信息
     */
    getLoginUser: (): Promise<UserInfo> => {
        return get<UserInfo>('/auth/c/getLoginUser');
    },

    /**
     * 退出登录
     */
    logout: (): Promise<string> => {
        return get<string>('/auth/c/doLogout');
    },
}; 