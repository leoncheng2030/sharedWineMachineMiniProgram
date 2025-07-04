import { get, post } from './request'

/**
 * 分页结果
 */
export interface PageResult<T> {
  /** 记录列表 */
  records: T[]
  /** 总记录数 */
  total: number
  /** 当前页 */
  current: number
  /** 每页大小 */
  size: number
  /** 总页数 */
  pages: number
}

/**
 * 设备信息接口
 */
export interface DeviceInfo {
  /** 设备ID */
  id: string
  /** 设备编码 */
  deviceCode: string
  /** 设备名称 */
  deviceName: string
  /** 设备业务状态：ONLINE-正常营业，OFFLINE-暂停营业，MAINTENANCE-维护中 */
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
  /** 蓝牙连接状态：ONLINE-蓝牙在线，OFFLINE-蓝牙离线，UNKNOWN-未检测 */
  connectionStatus?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN'
  /** 设备位置描述 */
  location?: string
  /** 详细地址 */
  address?: string
  /** 经度 */
  longitude?: number
  /** 纬度 */
  latitude?: number
  /** 所属门店ID */
  storeId?: string
  /** 所属门店名称 */
  storeName?: string
  /** 管理员用户ID */
  managerUserId?: string
  /** 当前绑定的酒品ID */
  currentProductId?: string
  /** 当前绑定的酒品名称 */
  currentProductName?: string
  /** 设备型号 */
  deviceModel?: string
  /** 设备版本 */
  deviceVersion?: string
  /** 最后心跳时间 */
  lastHeartbeatTime?: string
  /** 最后上线时间 */
  lastOnlineTime?: string
  /** 最后检测时间 */
  lastCheckTime?: string
  /** 检测结果描述 */
  checkResult?: string
  /** 创建时间 */
  createTime: string
  /** 更新时间 */
  updateTime?: string
  /** 排序码 */
  sortCode?: number
  /** 备注 */
  remark?: string
}

/**
 * 设备查询参数
 */
export interface DeviceQueryParams {
  /** 页码 */
  pageNum?: number
  /** 每页数量 */
  pageSize?: number
  /** 设备编码或名称关键词 */
  keyword?: string
  /** 设备状态筛选 */
  status?: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
  /** 所属门店ID */
  storeId?: string
  /** 管理员用户ID（用于查询我管理的设备） */
  managerUserId?: string
  /** 经度（用于附近设备查询） */
  longitude?: number
  /** 纬度（用于附近设备查询） */
  latitude?: number
  /** 搜索半径（公里） */
  radius?: number
  /** 排序字段 */
  sortField?: 'createTime' | 'lastOnlineTime' | 'deviceName' | 'distance'
  /** 排序方向 */
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * 设备库存信息接口
 */
export interface DeviceStockInfo {
  /** 设备ID */
  deviceId: string
  /** 酒品ID */
  productId: string
  /** 酒品名称 */
  productName?: string
  /** 当前库存数量(ml) */
  stockQuantity: number
  /** 预警阈值(ml) */
  alertThreshold: number
  /** 库存状态：NORMAL-正常，LOW-低库存，OUT-缺货 */
  status: 'NORMAL' | 'LOW' | 'OUT'
  /** 最后补货时间 */
  lastRefillTime?: string
  /** 最后补货数量 */
  lastRefillQuantity?: number
  /** 总销售数量 */
  totalSold: number
}

/**
 * 设备控制参数
 */
export interface DeviceControlParams {
  /** 设备ID */
  deviceId: string
  /** 控制命令：START-启动，STOP-停止，RESTART-重启，MAINTENANCE-进入维护模式 */
  command: 'START' | 'STOP' | 'RESTART' | 'MAINTENANCE'
  /** 命令参数 */
  params?: Record<string, any>
}

/**
 * 设备绑定参数
 */
export interface DeviceBindParams {
  /** 设备ID */
  deviceId: string
  /** 酒品ID */
  productId: string
}

/**
 * 设备API接口类
 */
export class DeviceApi {
  
  /**
   * 获取我管理的设备分页列表
   * @param params 查询参数
   * @returns 设备分页数据
   */
  static async getMyDevicesPage(params: DeviceQueryParams = {}): Promise<PageResult<DeviceInfo>> {
    // 构建查询参数
    const queryParams: string[] = []
    const mergedParams = { pageNum: 1, pageSize: 10, ...params }
    
    Object.entries(mergedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      }
    })
    
    const queryString = queryParams.join('&')
    return get<PageResult<DeviceInfo>>(`/miniprogram/device/my-devices${queryString ? '?' + queryString : ''}`)
  }

  /**
   * 获取设备详情
   * @param deviceId 设备ID
   * @returns 设备详情信息
   */
  static async getDeviceDetail(deviceId: string): Promise<DeviceInfo> {
    return get<DeviceInfo>(`/miniprogram/device/detail?id=${deviceId}`)
  }

  /**
   * 根据设备编码获取设备信息
   * @param deviceCode 设备编码
   * @returns 设备信息
   */
  static async getDeviceByCode(deviceCode: string): Promise<DeviceInfo> {
    return get<DeviceInfo>(`/miniprogram/device/by-code?deviceCode=${deviceCode}`)
  }

  /**
   * 获取附近设备列表
   * @param longitude 经度
   * @param latitude 纬度
   * @param radius 搜索半径（公里），默认5
   * @param limit 返回数量限制，默认20
   * @returns 附近设备列表
   */
  static async getNearbyDevices(
    longitude: number, 
    latitude: number, 
    radius: number = 5, 
    limit: number = 20
  ): Promise<DeviceInfo[]> {
    return get<DeviceInfo[]>(`/miniprogram/device/nearby?longitude=${longitude}&latitude=${latitude}&radius=${radius}&limit=${limit}`)
  }

  /**
   * 搜索设备
   * @param keyword 搜索关键词
   * @param limit 返回数量限制，默认10
   * @returns 搜索结果列表
   */
  static async searchDevices(keyword: string, limit: number = 10): Promise<DeviceInfo[]> {
    return get<DeviceInfo[]>(`/miniprogram/device/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`)
  }

  /**
   * 检查设备是否在线
   * @param deviceId 设备ID
   * @returns 是否在线
   */
  static async checkDeviceOnline(deviceId: string): Promise<boolean> {
    return get<boolean>(`/miniprogram/device/check-online?deviceId=${deviceId}`)
  }

  /**
   * 检查设备是否可用
   * @param deviceId 设备ID
   * @returns 是否可用
   */
  static async checkDeviceAvailable(deviceId: string): Promise<boolean> {
    return get<boolean>(`/miniprogram/device/check-available?deviceId=${deviceId}`)
  }

  /**
   * 控制设备
   * @param params 控制参数
   * @returns 控制结果
   */
  static async controlDevice(params: DeviceControlParams): Promise<boolean> {
    return post<boolean>('/miniprogram/device/control', params)
  }

  /**
   * 绑定设备到酒品
   * @param params 绑定参数
   * @returns 绑定结果
   */
  static async bindDeviceProduct(params: DeviceBindParams): Promise<boolean> {
    return post<boolean>('/miniprogram/device/bind-product', params)
  }

  /**
   * 解绑设备酒品
   * @param deviceId 设备ID
   * @returns 解绑结果
   */
  static async unbindDeviceProduct(deviceId: string): Promise<boolean> {
    return post<boolean>('/miniprogram/device/unbind-product', { deviceId })
  }

  /**
   * 更新设备状态
   * @param deviceId 设备ID
   * @param status 新状态
   * @returns 更新结果
   */
  static async updateDeviceStatus(deviceId: string, status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'): Promise<boolean> {
    return post<boolean>('/miniprogram/device/update-status', { deviceId, status })
  }

  /**
   * 更新设备蓝牙连接状态
   * @param deviceId 设备ID
   * @param connectionStatus 连接状态
   * @param checkResult 检测结果描述
   * @returns 更新结果
   */
  static async updateDeviceConnectionStatus(
    deviceId: string, 
    connectionStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN',
    checkResult?: string
  ): Promise<boolean> {
    return post<boolean>('/miniprogram/device/update-connection-status', { 
      deviceId, 
      connectionStatus, 
      checkResult 
    })
  }

  /**
   * 记录设备心跳
   * @param deviceCode 设备编码
   * @param heartbeatData 心跳数据
   * @returns 记录结果
   */
  static async recordHeartbeat(deviceCode: string, heartbeatData?: Record<string, any>): Promise<boolean> {
    return post<boolean>('/miniprogram/device/heartbeat', { deviceCode, heartbeatData })
  }

  /**
   * 获取门店设备列表
   * @param storeId 门店ID
   * @returns 设备列表
   */
  static async getStoreDevices(storeId: string): Promise<DeviceInfo[]> {
    return get<DeviceInfo[]>(`/miniprogram/store/${storeId}/devices`)
  }

  /**
   * 查询设备库存信息
   * @param deviceId 设备ID
   * @returns 设备库存信息列表
   */
  static async getDeviceStock(deviceId: string): Promise<DeviceStockInfo[]> {
    return get<DeviceStockInfo[]>(`/miniprogram/device/stock?deviceId=${deviceId}`)
  }

  /**
   * 查询设备特定酒品的库存数量
   * @param deviceId 设备ID
   * @param productId 酒品ID
   * @returns 库存数量(ml)
   */
  static async getStockQuantity(deviceId: string, productId: string): Promise<number> {
    const result = await get<{ quantity: number }>(`/miniprogram/device/stock/quantity?deviceId=${deviceId}&productId=${productId}`)
    return result.quantity || 0
  }

  /**
   * 检查库存是否充足
   * @param deviceId 设备ID
   * @param productId 酒品ID
   * @param requiredQuantity 需要的数量(ml)
   * @returns 是否充足
   */
  static async checkStockSufficient(deviceId: string, productId: string, requiredQuantity: number): Promise<boolean> {
    const result = await get<{ sufficient: boolean }>(`/miniprogram/device/stock/check?deviceId=${deviceId}&productId=${productId}&requiredQuantity=${requiredQuantity}`)
    return result.sufficient
  }

  /**
   * 获取设备库存状态概览
   * @param deviceId 设备ID
   * @returns 库存状态概览
   */
  static async getDeviceStockOverview(deviceId: string): Promise<{
    totalProducts: number
    normalStock: number
    lowStock: number
    outOfStock: number
  }> {
    return get<{
      totalProducts: number
      normalStock: number
      lowStock: number
      outOfStock: number
    }>(`/miniprogram/device/stock/overview?deviceId=${deviceId}`)
  }
}

// 导出默认实例和类型
export default DeviceApi
export type { DeviceInfo as Device } 