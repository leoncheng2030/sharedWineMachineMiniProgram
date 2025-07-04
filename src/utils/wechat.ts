/**
 * 获取微信登录授权码
 */
export const getWechatCode = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        uni.login({
            provider: 'weixin',
            success: (res) => {
                if (res.code) {
                    resolve(res.code);
                } else {
                    reject(new Error('获取微信授权码失败'));
                }
            },
            fail: (err) => {
                reject(new Error(err.errMsg || '微信登录失败'));
            }
        });
    });
};

/**
 * 获取微信用户信息（已废弃，仅做兼容）
 * 注意：微信官方已不再支持getUserProfile，建议使用头像昵称填写能力
 */
export const getWechatUserInfo = (): Promise<UniApp.GetUserInfoRes> => {
    return new Promise((resolve, reject) => {
        // 显示提示，引导用户使用新的授权方式
        uni.showModal({
            title: '提示',
            content: '为了更好地保护您的隐私，请通过个人资料页面完善头像和昵称',
            showCancel: false,
            success: () => {
                reject(new Error('getUserProfile已废弃，请使用头像昵称填写能力'));
            }
        });
    });
};

/**
 * 处理微信手机号授权
 * @param event 手机号授权事件
 */
export const handleWechatPhoneAuth = (event: any): Promise<{
    encryptedData: string;
    iv: string;
    cloudID?: string;
}> => {
    return new Promise((resolve, reject) => {
        const { detail } = event;
        
        if (detail.errMsg === 'getPhoneNumber:ok') {
            // 成功获取手机号授权
            if (detail.cloudID) {
                // 云开发环境，使用cloudID
                resolve({
                    encryptedData: detail.encryptedData,
                    iv: detail.iv,
                    cloudID: detail.cloudID
                });
            } else if (detail.encryptedData && detail.iv) {
                // 传统小程序，使用加密数据
                resolve({
                    encryptedData: detail.encryptedData,
                    iv: detail.iv
                });
            } else {
                reject(new Error('手机号授权数据不完整'));
            }
        } else {
            // 用户拒绝授权或授权失败
            const errorMsg = detail.errMsg || '获取手机号授权失败';
            reject(new Error(errorMsg));
        }
    });
};

/**
 * 检查微信登录状态
 */
export const checkWechatLoginStatus = (): Promise<boolean> => {
    return new Promise((resolve) => {
        uni.checkSession({
            success: () => {
                // session有效
                resolve(true);
            },
            fail: () => {
                // session失效，需要重新登录
                resolve(false);
            }
        });
    });
};

/**
 * 获取微信运行环境信息
 */
export const getWechatEnvInfo = () => {
    // #ifdef MP-WEIXIN
    const accountInfo = uni.getAccountInfoSync();
    return {
        appId: accountInfo.miniProgram.appId,
        envVersion: accountInfo.miniProgram.envVersion, // develop, trial, release
        version: accountInfo.miniProgram.version
    };
    // #endif
    
    // #ifndef MP-WEIXIN
    return {
        appId: '',
        envVersion: 'h5',
        version: '1.0.0'
    };
    // #endif
};

/**
 * 处理头像选择（新版微信小程序）
 */
export const handleAvatarChoose = (event: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        const { detail } = event;
        
        if (detail.avatarUrl) {
            resolve(detail.avatarUrl);
        } else {
            reject(new Error('获取头像失败'));
        }
    });
};

/**
 * 微信授权设置检查
 */
export const checkWechatAuthSettings = (): Promise<{
    userInfo: boolean;
    phoneNumber: boolean;
}> => {
    return new Promise((resolve) => {
        uni.getSetting({
            success: (res) => {
                const authSetting = res.authSetting as any;
                resolve({
                    userInfo: authSetting['scope.userInfo'] === true,
                    phoneNumber: authSetting['scope.phoneNumber'] === true
                });
            },
            fail: () => {
                resolve({
                    userInfo: false,
                    phoneNumber: false
                });
            }
        });
    });
};

/**
 * 打开微信授权设置页面
 */
export const openWechatAuthSettings = (): Promise<boolean> => {
    return new Promise((resolve) => {
        uni.openSetting({
            success: (res) => {
                resolve(true);
            },
            fail: (err) => {
                resolve(false);
            }
        });
    });
}; 