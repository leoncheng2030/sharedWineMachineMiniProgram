import { post, get } from './request'

// 设备控制参数接口
export interface DeviceControlParam {
  /** 设备UUID */
  uuid?: string
  /** 订单编号 */
  chargeId: string
  /** 设备ID */
  deviceCode: string
  /** 用户ID */
  userId: string
  /** 通电分钟数 */
  minute?: number
  /** 通电秒数 */
  second?: number
  /** 最大功率限制 */
  maxPower?: number
  /** 最小功率限制 */
  minPower?: number
  /** 拔插断电检测时间 */
  blackoutTime?: number
  /** 延迟断电检测时间 */
  delayTime?: number
  /** 授权电量/投币数/脉冲数 */
  quantity?: number
  /** 扩展指令标识 */
  extMode?: number
  /** 浮充终止判断时间 */
  extTime?: number
  /** 当前时间戳 */
  nowTime?: number
  /** 订单起始时间戳 */
  startTime?: number
  /** 订单启动窗口 */
  validSecond?: number
  /** 覆盖标识 */
  overlap?: number
}

// 设备控制结果接口
export interface DeviceControlResult {
  /** 是否成功 */
  success: boolean
  /** 订单ID */
  orderId?: string
  /** 设备ID */
  deviceId?: string
  /** 加密指令 */
  encryptCommand?: string
  /** 加密指令（别名） */
  cmd?: string
  /** 状态 */
  status?: string
  /** 操作类型 */
  operationType?: string
  /** 消息 */
  message?: string
  /** 错误码 */
  errorCode?: string
}

// 控制结果更新参数
export interface ControlResultParam {
  /** 订单ID */
  orderId: string
  /** 设备ID */
  deviceId: string
  /** 是否成功 */
  success: boolean
  /** 执行结果消息 */
  message?: string
}

/**
 * 设备控制API
 */
export const deviceControlApi = {
  /**
   * 获取设备控制指令
   * 调用后端接口获取加密控制指令，然后通过蓝牙发送给设备
   */
  getControlCommand: (param: DeviceControlParam): Promise<DeviceControlResult> => {
    return post('/miniprogram/device/control/getCommand', param)
  },

  /**
   * 验证控制权限
   * 检查订单和设备是否可以进行控制操作
   */
  validatePermission: (orderId: string, deviceId: string): Promise<boolean> => {
    return get('/miniprogram/device/control/validatePermission', {
      orderId,
      deviceId
    })
  },

  /**
   * 更新控制结果
   * 小程序端执行设备控制后，调用此接口更新执行状态
   */
  updateControlResult: (param: ControlResultParam): Promise<void> => {
    return post('/miniprogram/device/control/updateResult', param)
  }
}

/**
 * 蓝牙设备控制工具类
 */
export class BluetoothDeviceController {
  /**
   * 执行设备控制流程
   * 1. 获取控制指令
   * 2. 通过蓝牙发送指令
   * 3. 更新执行结果
   */
  static async executeControl(param: DeviceControlParam): Promise<boolean> {
    try {
      // 1. 验证权限
      const hasPermission = await deviceControlApi.validatePermission(param.chargeId, param.deviceId)
      if (!hasPermission) {
        throw new Error('无权限控制该设备')
      }

      // 2. 获取控制指令
      const controlResult = await deviceControlApi.getControlCommand(param)
      if (!controlResult.success || !controlResult.cmd) {
        throw new Error(controlResult.message || '获取控制指令失败')
      }

      // 3. 通过蓝牙发送指令到设备
      const bleResult = await this.sendBluetoothCommand(param.deviceId, controlResult.cmd)
      
      // 4. 更新执行结果
      await deviceControlApi.updateControlResult({
        orderId: param.chargeId,
        deviceId: param.deviceId,
        success: bleResult.success,
        message: bleResult.message
      })

      return bleResult.success
    } catch (error: any) {
      // 更新失败结果
      await deviceControlApi.updateControlResult({
        orderId: param.chargeId,
        deviceId: param.deviceId,
        success: false,
        message: error.message || '设备控制失败'
      })
      
      throw error
    }
  }

  /**
   * 通过蓝牙发送指令到设备
   * 这里需要根据实际的蓝牙通信协议实现
   */
  private static async sendBluetoothCommand(deviceId: string, command: string): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: 实现实际的蓝牙通信逻辑
      // 1. 连接蓝牙设备
      // 2. 发送控制指令
      // 3. 接收设备响应
      // 4. 处理响应结果
      
      console.log(`发送蓝牙指令到设备 ${deviceId}: ${command}`)
      
      // 模拟蓝牙通信
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: '设备控制成功'
          })
        }, 1000)
      })
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '蓝牙通信失败'
      }
    }
  }
} 