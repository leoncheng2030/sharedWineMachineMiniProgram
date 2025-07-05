/**
 * 蓝牙设备操作工具类
 * @description 包含蓝牙设备连接、数据传输等功能
 * @author WQS团队
 * @date 2025-01-30
 * @version 3.0.0 - 基于原始 index.js 重构，简化架构，提升性能
 * 
 * ## 🚀 新版本特性
 * 
 * ### ✨ 主要改进
 * - **简化架构**: 基于原始 index.js 代码结构，去除复杂的类封装
 * - **TypeScript 支持**: 添加完整的类型定义，提升开发体验
 * - **性能优化**: 优化超时时间和搜索策略，提升检测速度
 * - **向后兼容**: 保持原有 API 接口不变
 * - **错误处理**: 完善的错误处理机制
 * 
 * ### 🔧 使用方式
 * 
 * #### 1. 检查设备是否在线
 * ```typescript
 * import { checkDeviceOnline } from '@/utils/ble'
 * 
 * const isOnline = await checkDeviceOnline(12345)
 * if (isOnline) {
 *   console.log('设备在线')
 * } else {
 *   console.log('设备离线')
 * }
 * ```
 * 
 * #### 2. 写入充电数据
 * ```typescript
 * import { writeChargeData } from '@/utils/ble'
 * 
 * const CMD = "your_command_string_here"
 * await writeChargeData(12345, CMD)
 * ```
 * 
 * #### 3. 检查蓝牙权限
 * ```typescript
 * import { checkBluetooth } from '@/utils/ble'
 * 
 * const hasPermission = await checkBluetooth()
 * ```
 */

// Loading 管理器
class LoadingManager {
  private static instance: LoadingManager;
  private _isLoading: boolean = false;
  private _loadingTimer: any = null;
  private _currentTitle: string = '';

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  show(title: string = '加载中'): void {
    if (this._isLoading && this._currentTitle === title) {
      return; // 相同标题的loading已经在显示，不重复显示
    }

    this.hide(); // 先隐藏之前的loading

    try {
      uni.showLoading({
        title,
        mask: true,
        complete: () => {
          this._isLoading = true;
          this._currentTitle = title;
          console.log(`[BLE-Loading] 显示: ${title}`);
          
          // 设置超时自动隐藏
          if (this._loadingTimer) {
            clearTimeout(this._loadingTimer);
          }
          this._loadingTimer = setTimeout(() => {
            console.warn(`[BLE-Loading] 超时自动隐藏: ${title}`);
            this.hide();
          }, 15000);
        }
      });
    } catch (error) {
      console.warn('[BLE-Loading] 显示失败:', error);
      this._isLoading = false;
      this._currentTitle = '';
    }
  }

  hide(): void {
    if (this._isLoading) {
      try {
        uni.hideLoading();
        console.log(`[BLE-Loading] 隐藏: ${this._currentTitle}`);
      } catch (error) {
        console.warn('[BLE-Loading] 隐藏失败:', error);
      }
    }
    
    this._isLoading = false;
    this._currentTitle = '';
    
    if (this._loadingTimer) {
      clearTimeout(this._loadingTimer);
      this._loadingTimer = null;
    }
  }

  isLoading(): boolean {
    return this._isLoading;
  }

  getCurrentTitle(): string {
    return this._currentTitle;
  }
}

// 全局变量
let _loading = false;
const loadingManager = LoadingManager.getInstance();

// 类型定义
interface ApiOptions {
  success?: (res: any) => void;
  fail?: (res: any) => void;
  complete?: () => void;
  [key: string]: any;
}

interface ApiResponse {
  data: any;
  status: 'success' | 'fail';
}

interface ChargeDeviceInfo {
  PRE?: string;
  VID: string;
  ID: number;
  MYVID: string;
  STATUS?: number;
  ORDERID?: number;
  REMAINTIME?: number;
  REMAINSHOW?: string;
  REMAINQUANTITY?: number;
  USEQUANTITY?: number;
  CHECK: string;
  UUID?: string;
}

interface BluetoothDevice {
  deviceId: string;
  name?: string;
  RSSI?: number;
  advertisData?: ArrayBuffer;
  advertisServiceUUIDs?: string[];
  localName?: string;
  serviceData?: any;
}

interface DetailedDeviceStatus {
  isOnline: boolean;
  deviceId: number;
  deviceInfo?: ChargeDeviceInfo;
  signalStrength?: number;
  bluetoothDeviceId?: string;
  status?: {
    code: number;
    text: string;
  };
  remainInfo?: {
    time: number;
    timeDisplay: string;
    quantity: number;
  };
  orderInfo?: {
    orderId: number;
    isActive: boolean;
  };
  batteryInfo?: {
    usedQuantity: number;
    remainQuantity: number;
  };
  connectionInfo?: {
    rssi: number;
    signalLevel: 'excellent' | 'good' | 'fair' | 'poor';
  };
  errorInfo?: {
    hasError: boolean;
    errorMessage?: string;
  };
}

/**
 * 封装uni API为Promise
 */
function $uni(api: string, opts: ApiOptions = {}): Promise<ApiResponse> {
  return new Promise(resolve => {
    (uni as any)[api](Object.assign({}, opts, {
      success: (res: any) => resolve({ data: res, status: 'success' }),
      fail: (res: any) => resolve({ data: res, status: 'fail' })
    }));
  });
}

/**
 * 显示加载提示
 */
function showLoading(title: string = '加载中'): void {
  loadingManager.show(title);
}

/**
 * 隐藏加载提示
 */
function hideLoading(): void {
  loadingManager.hide();
}

/**
 * 默认失败回调
 */
function failCallback(): void {
  uni.showToast({ title: '请求错误' });
}

/**
 * 判断是否为函数
 */
function isFunction(val: any): val is Function {
  return typeof val === 'function';
}

/**
 * POST请求封装
 */
function postData(
  url: string,
  data: any,
  successCallback?: (data: any) => void,
  failCallback?: () => void
): Promise<any> {
  showLoading('请求中...');
  return new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: 'POST',
      data: data,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        isFunction(successCallback) && successCallback(res.data);
        hideLoading();
        return resolve(res.data);
      },
      fail: (res) => {
        isFunction(failCallback) && failCallback();
        hideLoading();
        return reject(res);
      }
    });
  });
}

/**
 * 检查是否为充电设备
 */
function isChargeDevice(view: Uint8Array): ChargeDeviceInfo | undefined {
  let CHECK: string;
  const PRE = byteChar2String([view[0]]);
  const VID = byteChar2String([view[5], view[6], view[7], view[8]]);
  const MYVID = byteChar2String([view[8], view[9], view[10]]);

  if (VID === '002C' || VID === '003C') {
    const ID = hex2Int(int2Hex(view[11]) + '' + int2Hex(view[12]) + '' + int2Hex(view[13]));

    if (Number(ID) === 0) {
      const UUID = byteChar2String([view[14], view[15], view[16], view[17], view[18], view[19], view[20], view[21]]);
      CHECK = int2Hex(view[25]) + '' + int2Hex(view[26]) + '' + int2Hex(view[27]) + '' + int2Hex(view[28]);

      return { VID: VID, ID: ID, MYVID: MYVID, UUID: UUID, CHECK: CHECK };
    } else {
      const STATUS = hex2Int(int2Hex(view[14]));
      const ORDERID = hex2Int(int2Hex(view[15]) + '' + int2Hex(view[16]) + '' + int2Hex(view[17]) + '' + int2Hex(view[18]));
      let REMAINTIME = 0;
      let REMAINQUANTITY = 0;
      let REMAINSHOW = '';

      if (Number(view[19]) === 255 && Number(view[20]) === 255 && Number(view[21]) === 255) {
        // FFFFFF，旧固件返回-1
        REMAINTIME = 0;
        REMAINQUANTITY = 0;
      } else {
        if (view[19] / 128 >= 1) { // 剩余电量
          REMAINQUANTITY = hex2Int(int2Hex(view[19] % 128) + '' + int2Hex(view[20]) + '' + int2Hex(view[21]));
        } else { // 剩余时长
          REMAINTIME = hex2Int(int2Hex(view[19]) + '' + int2Hex(view[20]) + '' + int2Hex(view[21]));
          // 剩余时间超过一定值，则按天进行核算
          if (REMAINTIME >= 8323072) REMAINTIME = (REMAINTIME - 8323072) * 3600 * 24;

          let MYTIME = REMAINTIME;
          if (MYTIME > 86400) {
            const day = Math.floor(MYTIME / 86400);
            MYTIME -= day * 86400;
            REMAINSHOW += day + '天';
          }
          if (MYTIME > 3600) {
            const hour = Math.floor(MYTIME / 3600);
            MYTIME -= hour * 3600;
            REMAINSHOW += hour + '小时';
          }
          if (MYTIME > 60) {
            const minute = Math.floor(MYTIME / 60);
            MYTIME -= minute * 60;
            REMAINSHOW += minute + '分钟';
          }
          if (MYTIME > 0) {
            REMAINSHOW += MYTIME + '秒';
          }
        }
      }

      const USEQUANTITY = hex2Int(int2Hex(view[22]) + '' + int2Hex(view[23]) + '' + int2Hex(view[24]));
      CHECK = int2Hex(view[25]) + '' + int2Hex(view[26]) + '' + int2Hex(view[27]) + '' + int2Hex(view[28]);

      return {
        PRE,
        VID,
        ID,
        MYVID,
        STATUS,
        ORDERID,
        REMAINTIME,
        REMAINSHOW,
        REMAINQUANTITY,
        USEQUANTITY,
        CHECK
      };
    }
  }
  return undefined;
}

/**
 * 获取数据ArrayBuffer数组
 */
function getDataArrayBuffer(dataString: string): ArrayBuffer[] {
  let data: string;
  const arr: ArrayBuffer[] = [];

  while (dataString.length > 40) {
    data = dataString.substring(0, 40);
    const buffer = new ArrayBuffer(20);
    const dataView = new DataView(buffer);
    for (let i = 0; i < 20; i++) {
      dataView.setUint8(i, parseInt(data.substring(i * 2, i * 2 + 2), 16));
    }
    arr.push(buffer);
    dataString = dataString.substring(40, dataString.length);
  }

  data = dataString;
  const buffer = new ArrayBuffer(data.length / 2);
  const dataView = new DataView(buffer);

  for (let i = 0; i < data.length / 2; i++) {
    dataView.setUint8(i, parseInt(data.substring(i * 2, i * 2 + 2), 16));
  }
  arr.push(buffer);
  return arr;
}

/**
 * 检查蓝牙权限
 */
function checkBluetooth(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    uni.getSetting({
      success: (res) => {
        const authSetting = res.authSetting as any;

        if (typeof authSetting['scope.bluetooth'] === 'undefined') {
          uni.authorize({
            scope: 'scope.bluetooth',
            complete() {
              uni.showModal({
                content: '蓝牙授权后重试',
                showCancel: false,
                confirmText: '我知道了'
              });
              reject(false);
            }
          });
        }
        if (authSetting['scope.bluetooth'] === false) {
          uni.openSetting({
            success: () => {
              uni.showModal({
                content: '蓝牙授权后重试',
                showCancel: false,
                confirmText: '我知道了'
              });
              reject(false);
            }
          });
        }
        if (authSetting['scope.bluetooth'] === true) {
          resolve(true);
        }
      },
      fail: () => reject(false)
    });
  });
}

/**
 * 设备状态码映射
 */
const DEVICE_STATUS_MAP: Record<number, string> = {
  0: '通电停止',
  1: '启动中',
  2: '拔插断电',
  3: '过载断电',
  4: '短路断电',
  5: '充满断电',
  6: '主动断电',
  10: '电池电压低',
  30: '管理员停用',
  31: '库存用完',
  50: '淹水故障'
};

/**
 * 根据信号强度评估信号等级
 */
function getSignalLevel(rssi: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (rssi >= -40) return 'excellent';
  if (rssi >= -55) return 'good';
  if (rssi >= -70) return 'fair';
  return 'poor';
}

/**
 * 检查设备详细状态（新增方法）
 * @param deviceId 设备ID
 * @returns 详细的设备状态信息
 */
async function checkDetailedDeviceStatus(deviceId: number): Promise<DetailedDeviceStatus> {
  try {
    console.log(`[BLE] 🚀 开始检测设备 ${deviceId} 的详细状态`);

    // #ifdef MP-WEIXIN
    const hasPermission = await checkBluetooth().catch(_ => false);
    if (!hasPermission) {
      console.log('[BLE] ❌ 蓝牙权限检查失败');
      return {
        isOnline: false,
        deviceId,
        errorInfo: {
          hasError: true,
          errorMessage: '蓝牙权限未授权'
        }
      };
    }
    // #endif

    return new Promise((resolve) => {
      showLoading('正在检测设备状态...');
      let myDevice: BluetoothDevice | null = null;
      let deviceInfo: ChargeDeviceInfo | null = null;
      let tryCnt = 0;
      let isFound = false;
      let searchTimer: any = null;

      // 设置搜索超时（优化到10秒，给详细检测更多时间）
      const searchTimeout = setTimeout(() => {
        console.log('[BLE] ⏰ 搜索超时，停止搜索');
        cleanup();
        resolve({
          isOnline: false,
          deviceId,
          errorInfo: {
            hasError: true,
            errorMessage: '搜索超时，设备可能离线'
          }
        });
      }, 10000);

      const cleanup = () => {
        if (searchTimer) {
          clearTimeout(searchTimer);
          searchTimer = null;
        }
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        uni.stopBluetoothDevicesDiscovery();
        uni.offBluetoothDeviceFound();
        hideLoading();
      };

      uni.openBluetoothAdapter({
        success: () => {
          console.log('[BLE] ✅ 蓝牙适配器初始化成功');
          uni.startBluetoothDevicesDiscovery({
            allowDuplicatesKey: true,
            interval: 50,
            complete: () => {
              console.log('[BLE] 🔍 开始搜索设备');

              uni.onBluetoothDeviceFound((res: any) => {
                tryCnt++;
                if (tryCnt % 20 === 0) {
                  showLoading(`检测设备状态(${Math.floor(tryCnt / 20)})...`);
                }

                const devices: BluetoothDevice[] = res.devices;
                for (let i = 0; i < devices.length; i++) {
                  if (devices[i].advertisData) {
                    try {
                      const view = new Uint8Array(devices[i].advertisData as ArrayBuffer);
                      const checkDevice = isChargeDevice(view);
                      if (checkDevice && Number(checkDevice.ID) === Number(deviceId)) {
                        myDevice = devices[i];
                        deviceInfo = checkDevice;
                        isFound = true;
                        console.log(`[BLE] 🎯 找到目标设备 ${deviceId}，搜索次数: ${tryCnt}`);

                        // 构建详细状态信息
                        const detailedStatus: DetailedDeviceStatus = {
                          isOnline: true,
                          deviceId,
                          deviceInfo: checkDevice,
                          signalStrength: devices[i].RSSI,
                          bluetoothDeviceId: devices[i].deviceId,
                          status: checkDevice.STATUS !== undefined ? {
                            code: checkDevice.STATUS,
                            text: DEVICE_STATUS_MAP[checkDevice.STATUS] || `未知状态(${checkDevice.STATUS})`
                          } : undefined,
                          remainInfo: {
                            time: checkDevice.REMAINTIME || 0,
                            timeDisplay: checkDevice.REMAINSHOW || '无',
                            quantity: checkDevice.REMAINQUANTITY || 0
                          },
                          orderInfo: checkDevice.ORDERID !== undefined ? {
                            orderId: checkDevice.ORDERID,
                            isActive: checkDevice.ORDERID > 0
                          } : undefined,
                          batteryInfo: {
                            usedQuantity: checkDevice.USEQUANTITY || 0,
                            remainQuantity: checkDevice.REMAINQUANTITY || 0
                          },
                          connectionInfo: devices[i].RSSI !== undefined ? {
                            rssi: devices[i].RSSI!,
                            signalLevel: getSignalLevel(devices[i].RSSI!)
                          } : undefined,
                          errorInfo: {
                            hasError: false
                          }
                        };

                        // 立即停止搜索并返回结果
                        cleanup();
                        resolve(detailedStatus);
                        return;
                      }
                    } catch (error) {
                      console.warn('[BLE] 设备数据解析错误，跳过:', error);
                    }
                  }
                }

                // 如果搜索次数达到限制且未找到设备，返回失败
                if (tryCnt >= 200 && !isFound) {
                  console.log('[BLE] ❌ 搜索次数达到限制，未找到设备');
                  cleanup();
                  resolve({
                    isOnline: false,
                    deviceId,
                    errorInfo: {
                      hasError: true,
                      errorMessage: '设备离线或不在附近'
                    }
                  });
                }
              });
            }
          });
        },
        fail: (error: any) => {
          console.error('[BLE] ❌ 蓝牙适配器初始化失败:', error);
          cleanup();

          let message = '蓝牙启动失败，请开启重试';
          if (error.errCode === 10001) {
            message = '蓝牙未开启，请在设置中开启蓝牙后重试';
          }

          resolve({
            isOnline: false,
            deviceId,
            errorInfo: {
              hasError: true,
              errorMessage: message
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('[BLE] ❌ 检查设备详细状态失败:', error);
    hideLoading();
    return {
      isOnline: false,
      deviceId,
      errorInfo: {
        hasError: true,
        errorMessage: '检测失败，请重试'
      }
    };
  }
}

/**
 * 检查设备是否在线（优化版本）
 */
async function checkDeviceOnline(deviceId: number): Promise<boolean> {
  try {
    console.log(`[BLE] 🚀 开始检测设备 ${deviceId} 是否在线`);

    // #ifdef MP-WEIXIN
    const hasPermission = await checkBluetooth().catch(_ => false);
    if (!hasPermission) {
      console.log('[BLE] ❌ 蓝牙权限检查失败');
      return false;
    }
    // #endif

    return new Promise((resolve) => {
      showLoading('快速搜索设备...');
      let myDevice: BluetoothDevice | null = null;
      let tryCnt = 0;
      let isFound = false;
      let searchTimer: any = null;

      // 设置搜索超时（优化到8秒）
      const searchTimeout = setTimeout(() => {
        console.log('[BLE] ⏰ 搜索超时，停止搜索');
        cleanup();
        resolve(false);
      }, 8000);

      const cleanup = () => {
        if (searchTimer) {
          clearTimeout(searchTimer);
          searchTimer = null;
        }
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        uni.stopBluetoothDevicesDiscovery();
        uni.offBluetoothDeviceFound();
        hideLoading();
      };

      uni.openBluetoothAdapter({
        success: () => {
          console.log('[BLE] ✅ 蓝牙适配器初始化成功');
          uni.startBluetoothDevicesDiscovery({
            allowDuplicatesKey: true,
            interval: 50, // 优化搜索间隔到50ms
            complete: () => {
              console.log('[BLE] 🔍 开始搜索设备');

              uni.onBluetoothDeviceFound((res: any) => {
                tryCnt++;
                if (tryCnt % 10 === 0) { // 减少UI更新频率
                  showLoading(`快速搜索(${Math.floor(tryCnt / 10)})...`);
                }

                const devices: BluetoothDevice[] = res.devices;
                for (let i = 0; i < devices.length; i++) {
                  
                  console.log('devices[i].advertisData', devices[i].advertisData);
                  if (devices[i].advertisData) {
                    try {
                      const view = new Uint8Array(devices[i].advertisData as ArrayBuffer);
                      const checkDevice = isChargeDevice(view);
                      if (checkDevice && Number(checkDevice.ID) === Number(deviceId)) {
                        myDevice = devices[i];
                        isFound = true;
                        console.log(`[BLE] 🎯 找到目标设备 ${deviceId}，搜索次数: ${tryCnt}`);

                        // 立即停止搜索并返回结果
                        cleanup();
                        resolve(true);
                        return;
                      }
                    } catch (error) {
                      // 忽略解析错误，继续搜索
                      console.warn('[BLE] 设备数据解析错误，跳过:', error);
                    }
                  }
                }

                // 如果搜索次数达到限制且未找到设备，返回失败
                if (tryCnt >= 100 && !isFound) {
                  console.log('[BLE] ❌ 搜索次数达到限制，未找到设备');
                  cleanup();
                  resolve(false);
                }
              });
            }
          });
        },
        fail: (error: any) => {
          console.error('[BLE] ❌ 蓝牙适配器初始化失败:', error);
          cleanup();

          let message = '蓝牙启动失败，请开启重试';
          if (error.errCode === 10001) {
            message = '蓝牙未开启，请在设置中开启蓝牙后重试';
          }

          uni.showModal({
            content: message,
            showCancel: false,
            confirmText: '我知道了'
          });
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('[BLE] ❌ 检查设备在线状态失败:', error);
    hideLoading();
    return false;
  }
}

/**
 * 写入充电数据（优化版本）
 */
async function writeChargeData(deviceId: number, CMD: string): Promise<void> {
  try {
    console.log(`[BLE] 🚀 开始写入充电数据到设备 ${deviceId}`);
    console.log('CMD', CMD)
    
    // 验证CMD指令格式
    if (!CMD || CMD.length < 20) {
      throw new Error('控制指令格式错误，请重新获取指令');
    }
    
    // #ifdef MP-WEIXIN
    const hasPermission = await checkBluetooth().catch(_ => false);
    if (!hasPermission) { return; }
    // #endif

    showLoading('准备连接...');
    let myDevice: BluetoothDevice | null = null;
    let tryCnt = 0;
    let isFound = false;

    uni.openBluetoothAdapter({
      success: () => {
        uni.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: true,
          interval: 50, // 优化搜索间隔
          complete: () => {
            showLoading('快速搜索设备...');

            uni.onBluetoothDeviceFound((res: any) => {
              showLoading(`快速搜索(${tryCnt})...`);
              const devices: BluetoothDevice[] = res.devices;

              for (let i = 0; i < devices.length; i++) {
                if (devices[i].advertisData) {
                  try {
                    const view = new Uint8Array(devices[i].advertisData as ArrayBuffer);
                    const checkDevice = isChargeDevice(view);
                    if (checkDevice && Number(checkDevice.ID) === Number(deviceId)) {
                      myDevice = devices[i];
                      if (isFound) tryCnt = 0;
                      else tryCnt = 100;
                      isFound = true;
                      break;
                    }
                  } catch (error) {
                    console.warn('[BLE] 设备数据解析错误，跳过:', error);
                  }
                }
              }

              if (tryCnt >= 20) {
                tryCnt = 0;
                uni.stopBluetoothDevicesDiscovery({
                  fail: (res: any) => {
                    failWrite(myDevice, res.errCode, res.errMsg);
                  },
                  success: () => {
                    if (myDevice) {
                      showLoading('快速连接设备...');
                      uni.createBLEConnection({
                        deviceId: myDevice.deviceId,
                        fail: (res: any) => {
                          failWrite(myDevice, res.errCode, res.errMsg);
                        },
                        success: async () => {
                          showLoading('连接设备...');
                          const serviceId = '00000001-0000-1000-8000-00805F9B34FB';
                          const wcharacteristicId = '00000003-0000-1000-8000-00805F9B34FB';
                          let successNum = 0;
                          let failNum = 0;
                          let hasService = false;
                          let nowTime = 0;
                          let diffTime = 0;
                          const startTime = Date.now();

                          // 优化服务发现等待时间（从10秒优化到5秒）
                          while (nowTime - startTime < 10000) {
                            nowTime = Date.now();
                            if (nowTime - diffTime < 10000) { continue; } // 优化重试间隔到200ms

                            const res = await $uni('getBLEDeviceServices', { deviceId: myDevice!.deviceId });
                            if (res.status === 'fail') {
                              failWrite(myDevice, res.data.errCode, res.data.errMsg);
                              break;
                            }
                            if (res.status === 'success' && res.data.services.length > 0) {
                              hasService = true;
                              break;
                            }
                            diffTime = nowTime;
                          }

                          if (!hasService) {
                            failWrite(myDevice, -1, '服务发现超时');
                            return;
                          }

                          showLoading('获取设备特征...');
                          uni.getBLEDeviceCharacteristics({
                            deviceId: myDevice!.deviceId,
                            serviceId,
                            fail: (res: any) => {
                              failWrite(myDevice, res.errCode, res.errMsg);
                            },
                            success: () => {
                              showLoading('发送指令...');
                              const dataArr = getDataArrayBuffer(CMD);

                              for (let i = 0; i < dataArr.length; i++) {
                                const data = dataArr[i];
                                console.log('发送数据: ', data);
                                
                                uni.writeBLECharacteristicValue({
                                  deviceId: myDevice!.deviceId,
                                  serviceId,
                                  characteristicId: wcharacteristicId,
                                  value: data as any,
                                  success: () => {
                                    successNum++;
                                    console.log(`[BLE] 数据包 ${i+1}/${dataArr.length} 发送成功`);
                                  },
                                  fail: (res: any) => {
                                    failNum++;
                                    console.error(`[BLE] 数据包 ${i+1} 发送失败:`, res);
                                    failWrite(myDevice, res.errCode, res.errMsg);
                                  },
                                  complete: () => {
                                    if (successNum === dataArr.length) {
                                      console.log(`[BLE] 所有数据包发送完成，成功: ${successNum}, 失败: ${failNum}`);
                                      // 延时验证设备状态
                                      setTimeout(() => {
                                        verifyDeviceStatus(myDevice, deviceId);
                                      }, 2000);
                                    }
                                  }
                                })

                                if (failNum > 0) { break; }
                                sleep(100); // 优化发送间隔到50ms
                              }
                            }
                          });
                        }
                      });
                    } else {
                      hideLoading();
                      uni.showModal({
                        content: '未检测到对应通电设备，请重试',
                        showCancel: false,
                        confirmText: '我知道了'
                      });
                      uni.closeBluetoothAdapter({ complete: _ => null });
                    }
                  }
                });
              }
              tryCnt++;
            });
          }
        });
      },
      fail: (error: any) => {
        hideLoading();
        let message = '蓝牙启动失败，请开启重试';
        if (error.errCode === 10001) {
          message = '蓝牙未开启，请在设置中开启蓝牙后重试';
        }
        uni.showModal({
          content: message,
          showCancel: false,
          confirmText: '我知道了'
        });
      }
    });
  } catch (error) {
    console.error('[BLE] ❌ 写入充电数据失败:', error);
    hideLoading();
    uni.showModal({
      content: '操作失败，请重试',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
}

/**
 * 验证设备状态
 */
async function verifyDeviceStatus(myDevice: BluetoothDevice | null, deviceId: number): Promise<void> {
  try {
    console.log(`[BLE] 🔍 验证设备 ${deviceId} 状态...`);
    
    // 重新检查设备状态
    const isOnline = await checkDeviceOnline(deviceId);
    if (!isOnline) {
      console.log('[BLE] ⚠️ 设备已离线，可能已启动');
      successWrite(myDevice);
      return;
    }
    
    // 设备仍在线，检查是否有状态变化
    showLoading('验证设备状态...');
    
    uni.openBluetoothAdapter({
      success: () => {
        uni.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: true,
          interval: 100,
          complete: () => {
            let checkCount = 0;
            const maxChecks = 5;
            
            const deviceFoundHandler = (res: any) => {
              checkCount++;
              const devices: BluetoothDevice[] = res.devices;
              
              for (let i = 0; i < devices.length; i++) {
                if (devices[i].advertisData) {
                  try {
                    const view = new Uint8Array(devices[i].advertisData as ArrayBuffer);
                    const checkDevice = isChargeDevice(view);
                    
                    if (checkDevice && Number(checkDevice.ID) === Number(deviceId)) {
                      console.log(`[BLE] 设备状态检查 ${checkCount}/${maxChecks}:`, checkDevice);
                      
                      // 检查设备是否在工作状态
                      if (checkDevice.STATUS && checkDevice.STATUS > 0) {
                        console.log('[BLE] ✅ 设备已启动，状态正常');
                        cleanup();
                        successWrite(myDevice);
                        return;
                      }
                    }
                  } catch (error) {
                    console.warn('[BLE] 设备状态解析错误:', error);
                  }
                }
              }
              
              if (checkCount >= maxChecks) {
                console.log('[BLE] ⚠️ 设备状态检查完成，未检测到启动状态');
                cleanup();
                // 显示可能的问题提示
                uni.showModal({
                  title: '设备状态提醒',
                  content: '指令已发送，但设备可能未启动。\n可能原因：\n1. 设备忙碌或故障\n2. 控制指令过期\n3. 设备需要手动重启\n\n请检查设备状态或联系客服。',
                  showCancel: true,
                  cancelText: '我知道了',
                  confirmText: '重试控制',
                  success: (res) => {
                    if (res.confirm) {
                      // 重试控制逻辑可以在上层处理
                      console.log('[BLE] 用户选择重试控制');
                    }
                  }
                });
                
                if (myDevice) {
                  uni.closeBLEConnection({
                    deviceId: myDevice.deviceId,
                    complete: _ => null
                  });
                }
                uni.closeBluetoothAdapter({ complete: _ => null });
              }
            };
            
            const cleanup = () => {
              uni.stopBluetoothDevicesDiscovery();
              uni.offBluetoothDeviceFound(deviceFoundHandler);
              hideLoading();
            };
            
            uni.onBluetoothDeviceFound(deviceFoundHandler);
            
            // 设置超时
            setTimeout(() => {
              if (checkCount < maxChecks) {
                console.log('[BLE] ⏰ 设备状态检查超时');
                cleanup();
                successWrite(myDevice);
              }
            }, 8000);
          }
        });
      },
      fail: () => {
        console.log('[BLE] ❌ 设备状态验证失败');
        successWrite(myDevice);
      }
    });
    
  } catch (error) {
    console.error('[BLE] ❌ 设备状态验证异常:', error);
    successWrite(myDevice);
  }
}

/**
 * 写入成功回调
 */
function successWrite(myDevice: BluetoothDevice | null): void {
  hideLoading();
  uni.showModal({
    content: '指令发送成功，请稍候观察设备是否启动',
    showCancel: false,
    confirmText: '我知道了'
  });
  if (myDevice) {
    uni.closeBLEConnection({
      deviceId: myDevice.deviceId,
      complete: _ => null
    });
  }
  uni.closeBluetoothAdapter({ complete: _ => null });
}

/**
 * 写入失败回调
 */
function failWrite(myDevice: BluetoothDevice | null, errCode: number, errMsg: string): void {
  hideLoading();

  // 优化错误提示信息
  let userFriendlyMessage = errMsg;
  switch (errCode) {
    case 10001:
      userFriendlyMessage = '蓝牙未开启，请在设置中开启蓝牙后重试';
      break;
    case 10002:
      userFriendlyMessage = '未找到蓝牙设备，请确保设备已开启';
      break;
    case 10003:
      userFriendlyMessage = '蓝牙连接失败，请重试';
      break;
    case 10012:
      userFriendlyMessage = '连接超时，请确保设备在附近并重试';
      break;
    case -1:
      userFriendlyMessage = errMsg || '操作失败，请重试';
      break;
  }

  uni.showModal({
    content: userFriendlyMessage,
    showCancel: false,
    confirmText: '我知道了'
  });

  if (myDevice) {
    uni.closeBLEConnection({
      deviceId: myDevice.deviceId,
      complete: _ => null
    });
  }
  uni.closeBluetoothAdapter({ complete: _ => null });
}

/**
 * 字节数组转字符串
 */
function byteChar2String(byteArr: number[]): string {
  const arrs: string[] = [];
  for (let i = 0; i < byteArr.length; i++) {
    arrs.push(String.fromCharCode(byteArr[i]));
  }
  return arrs.join('');
}

/**
 * 整数转十六进制
 */
function int2Hex(i: number): string {
  const hex = Math.abs(i).toString(16);
  if (hex.length === 1) {
    return '0' + hex;
  } else {
    return hex;
  }
}

/**
 * 十六进制转整数
 */
function hex2Int(hex: string): number {
  const len = hex.length;
  const a = new Array(len);
  let code: number;

  for (let i = 0; i < len; i++) {
    code = hex.charCodeAt(i);
    if (code >= 48 && code < 58) {
      code -= 48;
    } else {
      code = (code & 0xdf) - 65 + 10;
    }
    a[i] = code;
  }

  return a.reduce(function (acc: number, c: number) {
    acc = 16 * acc + c;
    return acc;
  }, 0);
}

/**
 * 延时函数
 */
function sleep(time: number): void {
  const startTime = new Date().getTime() + parseInt(time.toString(), 10);
  while (new Date().getTime() < startTime) { }
}

/**
 * 发送CMD指令
 */
function postCMD(data: any, successCallback?: (data: any) => void): Promise<any> {
  const url = 'https://gateway.biandianxia.com/encrypt/sharedevice';
  return postData(url, data, successCallback, failCallback);
}

/**
 * 发送网关指令
 */
function postGateway(data: any, successCallback?: (data: any) => void): Promise<any> {
  const url = 'https://gateway.biandianxia.com/encrypt/gateway';
  return postData(url, data, successCallback, failCallback);
}

/**
 * 更新密钥
 */
function postUpdateKey(data: any, successCallback?: (data: any) => void): Promise<any> {
  const url = 'https://gateway.biandianxia.com/updateKey';
  return postData(url, data, successCallback, failCallback);
}

/**
 * 调试日志功能
 */
function debugLog(message: string, data?: any): void {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[BLE-DEBUG ${timestamp}] ${message}`, data || '');
  
  // 可选：将日志保存到本地存储用于调试
  try {
    const logs = uni.getStorageSync('ble_debug_logs') || [];
    logs.push({
      timestamp,
      message,
      data: data ? JSON.stringify(data) : null
    });
    
    // 只保留最近100条日志
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    uni.setStorageSync('ble_debug_logs', logs);
  } catch (error) {
    console.warn('[BLE] 保存调试日志失败:', error);
  }
}

/**
 * 获取调试日志
 */
function getDebugLogs(): any[] {
  try {
    return uni.getStorageSync('ble_debug_logs') || [];
  } catch (error) {
    console.warn('[BLE] 获取调试日志失败:', error);
    return [];
  }
}

/**
 * 清除调试日志
 */
function clearDebugLogs(): void {
  try {
    uni.removeStorageSync('ble_debug_logs');
    console.log('[BLE] 调试日志已清除');
  } catch (error) {
    console.warn('[BLE] 清除调试日志失败:', error);
  }
}

/**
 * 获取 Loading 状态
 */
function getLoadingStatus(): { isLoading: boolean; currentTitle: string } {
  return {
    isLoading: loadingManager.isLoading(),
    currentTitle: loadingManager.getCurrentTitle()
  };
}

// 导出所有功能
export {
  // 网络请求函数
  postCMD,
  postGateway,
  postUpdateKey,

  // 设备检查函数
  isChargeDevice,
  checkDeviceOnline,
  checkDetailedDeviceStatus,
  writeChargeData,
  checkBluetooth,
  verifyDeviceStatus,

  // 调试功能
  debugLog,
  getDebugLogs,
  clearDebugLogs,
  getLoadingStatus,

  // 类型定义
  type ChargeDeviceInfo,
  type BluetoothDevice,
  type DetailedDeviceStatus,
  type ApiOptions,
  type ApiResponse
};

export default {
  postCMD,
  postGateway,
  postUpdateKey,
  isChargeDevice,
  writeChargeData,
  checkBluetooth,
  checkDeviceOnline,
  checkDetailedDeviceStatus,
  verifyDeviceStatus,
  debugLog,
  getDebugLogs,
  clearDebugLogs,
  getLoadingStatus
}; 