export const getStorage = (key: string) => {
    return uni.getStorageSync(key);
};
export const setStorage = (key: string, value: any) => {
    return uni.setStorageSync(key, value);
};
export const removeStorage = (key: string) => {
    return uni.removeStorageSync(key);
};
export const arraySlice = (data: any[], array: any[] = [], optNum = 10): any[] => {
    if (data.length <= optNum) {
        data.length > 0 && array.push(data);
        return array;
    }
    array.push(data.splice(0, optNum));
    return arraySlice(data, array, optNum);
};
export const getUserProfile = () => {
    return new Promise<UniApp.GetUserProfileRes>((resolve, reject) => {
        uni.getUserProfile({
            desc: "获取用户信息，完善用户资料 ",
            success: (res) => {
                resolve(res);
            },
            fail(res) {
                uni.$u.toast(res.errMsg);
            },
        });
    });
};
export const copy = (str: string) => {
    return new Promise((resolve, reject) => {
        uni.setClipboardData({
            data: str,
            success: () => {
                uni.$u.toast("复制成功");
                resolve(true);
            },
            fail: (error) => {
                uni.$u.toast(error.errMsg);

                reject(false);
            },
        });
    });
};
export const imageToBase64 = (path: string) => {
    return new Promise<UniApp.ReadFileSuccessCallbackResult>((resolve, reject) => {
        // #ifdef MP
        uni.getFileSystemManager().readFile({
            filePath: path,
            encoding: "base64",
            success: (r) => {
                resolve(r);
            },
            fail: (errr) => {
                uni.$u.toast(errr.errMsg);
                reject(errr);
            },
        });
        // #endif
        // #ifdef H5
        uni.request({
            url: path,

            method: "GET",

            responseType: "arraybuffer",

            success: (ress: any) => {
                let base64 = uni.arrayBufferToBase64(ress.data); //把arraybuffer转成base64

                resolve({
                    errMsg: "readFile:ok",
                    data: base64,
                });
            },
            fail: (e) => {
                console.log("图片转换失败");
                resolve({
                    errMsg: "readFile:error",
                    data: "",
                });
            },
        });

        // #endif
    });
};

export const checkPhotoAuth = () => {
    return new Promise((resolve, reject) => {
        uni.getSetting({
            success: (res) => {
                console.log(res);
                if (!res.authSetting["scope.writePhotosAlbum"]) {
                    uni.showModal({
                        title: "警告",
                        content: "检测到您没您未授权相册权限,点击确定获取授权。",
                        success: function (res) {
                            if (res.confirm) {
                                uni.authorize({
                                    scope: "scope.writePhotosAlbum",
                                    success() {
                                        // 用户已经同意
                                        resolve({ code: 200, message: "授权相册成功" });
                                    },
                                    fail(err) {
                                        console.log(err);
                                        resolve({ code: 300, message: "拒绝授权相册" });
                                    },
                                });
                            }
                        },
                    });
                } else {
                    resolve({ code: 200, message: "授权相册成功" });
                }
            },
            fail: () => {
                console.log("点击了拒绝");
            },
        });
    });
};
export const saveImageToPhoto = (path: string) => {
    return new Promise((resolve, reject) => {
        var fileManager = uni.getFileSystemManager();
        fileManager.writeFile({
            filePath: wx.env.USER_DATA_PATH + "/img.png", // 指定图片的临时路径
            data: path, // 要写入的文本或二进制数据
            encoding: "base64", // 指定写入文件的字符编码
            success: (res) => {
                console.log("写入文件成功", res);
                console.log(wx.env.USER_DATA_PATH + "/img.png");
                uni.saveImageToPhotosAlbum({
                    // 保存图片到相册
                    filePath: wx.env.USER_DATA_PATH + "/img.png",
                    success: function (res) {
                        console.log("保存成功", res);
                        resolve(res);
                    },
                    fail: function (err) {
                        console.log("保存失败", err);
                    },
                });
            },
            fail: (err) => {
                reject(err);
            },
        });
    });
};
export const saveBowersFile = (picSrc: string) => {
    const a = document.createElement("a");
    const filename = Date.now() + ".png";
    a.href = picSrc; // picSrc  是图片 base64 码，可以直接给 img 的 src 属性，展示图片
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
export const pxToRpx = (px: number) => {
    let scale = uni.upx2px(100) / 100;
    return px / scale;
};
export const getSetting = () => {
    return new Promise<UniApp.GetSettingSuccessResult>((resolve, reject) => {
        uni.getSetting({
            success: (res) => {
                resolve(res);
            },
            fail: (err) => {
                reject(err);
            },
        });
    });
};

// 重新导出蓝牙相关功能，保持向后兼容
export { 
    postCMD, 
    postGateway, 
    postUpdateKey, 
    isChargeDevice, 
    writeChargeData, 
    checkBluetooth,
    type ChargeDeviceInfo,
    type BluetoothDevice
} from './ble';
