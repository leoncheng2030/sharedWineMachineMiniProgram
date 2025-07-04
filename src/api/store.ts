import { get } from './request'

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
 * 门店简化信息接口（用于列表展示）
 */
export interface WineStoreSimple {
  /** 门店ID */
  id: string
  /** 门店编码 */
  storeCode: string
  /** 门店名称 */
  storeName: string
  /** 门店图片URL */
  imageUrl?: string
  /** 完整地址 */
  fullAddress: string
  /** 联系电话 */
  contactPhone: string
  /** 营业时间 */
  businessHours: string
  /** 门店状态 */
  status: 'ENABLE' | 'DISABLE'
  /** 是否营业中 */
  isOpen: boolean
  /** 距离（公里） */
  distance?: number
  /** 评分 */
  rating?: number
  /** 浏览次数 */
  viewCount?: number
  /** 排序码 */
  sortCode: number
  /** 创建时间 */
  createTime: string
}

/**
 * 门店完整信息接口（用于详情展示）
 */
export interface WineStore extends WineStoreSimple {
  /** 门店管理员ID */
  storeManagerId?: string
  /** 门店管理员姓名 */
  storeManagerUserName?: string
  /** 省份 */
  province?: string
  /** 城市 */
  city?: string
  /** 区县 */
  district?: string
  /** 详细地址 */
  detailAddress?: string
  /** 联系邮箱 */
  contactEmail?: string
  /** 定价权限 */
  priceAuthority?: 'PLATFORM' | 'CUSTOM'
  /** 门店面积 */
  storeArea?: number
  /** 门店描述 */
  description?: string
  /** 备注 */
  remark?: string
  /** 经度 */
  longitude?: number
  /** 纬度 */
  latitude?: number
  /** 详细营业时间 */
  businessHoursDetail?: Record<string, string>
  /** 门店优惠活动 */
  promotions?: Array<{
    id: string
    title: string
    description: string
    type?: string
  }>
  /** 门店设备数量 */
  deviceCount?: number
  /** 门店酒品数量 */
  productCount?: number
}

/**
 * 门店查询参数接口
 */
export interface StoreQueryParams {
  /** 页码 */
  pageNum?: number
  /** 每页数量 */
  pageSize?: number
  /** 关键词搜索 */
  keyword?: string
  /** 门店状态筛选 */
  status?: 'ENABLE' | 'DISABLE'
  /** 省份筛选 */
  province?: string
  /** 城市筛选 */
  city?: string
  /** 区县筛选 */
  district?: string
  /** 经度 */
  longitude?: number
  /** 纬度 */
  latitude?: number
  /** 搜索半径 */
  radius?: number
  /** 排序字段 */
  sortField?: 'distance' | 'createTime' | 'sortCode' | 'rating'
  /** 排序方向 */
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * 门店设备信息接口
 */
export interface StoreDevice {
  id: string
  deviceCode: string
  deviceName: string
  status: string
  location?: string
}

/**
 * 门店统计信息接口
 */
export interface StoreStatistics {
  deviceCount: number
  productCount: number
  orderCount: number
  revenue: number
}

/**
 * 门店API接口类
 */
export class StoreApi {
  
  /**
   * 获取门店分页列表
   * @param params 查询参数
   * @returns 门店分页数据
   */
  static async getStorePage(params: StoreQueryParams = {}): Promise<PageResult<WineStoreSimple>> {
    // 构建查询参数（小程序兼容方式）
    const queryParams: string[] = []
    const mergedParams = { pageNum: 1, pageSize: 10, ...params }
    
    Object.entries(mergedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      }
    })
    
    const queryString = queryParams.join('&')
    return get<PageResult<WineStoreSimple>>(`/miniprogram/store/page${queryString ? '?' + queryString : ''}`)
  }

  /**
   * 获取门店详情
   * @param id 门店ID
   * @returns 门店详情信息
   */
  static async getStoreDetail(id: string): Promise<WineStore> {
    return get<WineStore>(`/miniprogram/store/detail?id=${id}`)
  }

  /**
   * 获取附近门店列表
   * @param longitude 经度
   * @param latitude 纬度
   * @param radius 搜索半径（公里），默认5
   * @param limit 返回数量限制，默认20
   * @returns 附近门店列表
   */
  static async getNearbyStores(
    longitude: number, 
    latitude: number, 
    radius: number = 5, 
    limit: number = 20
  ): Promise<WineStoreSimple[]> {
    return get<WineStoreSimple[]>(`/miniprogram/store/nearby?longitude=${longitude}&latitude=${latitude}&radius=${radius}&limit=${limit}`)
  }

  /**
   * 搜索门店
   * @param keyword 搜索关键词
   * @param limit 返回数量限制，默认10
   * @returns 搜索结果列表
   */
  static async searchStores(keyword: string, limit: number = 10): Promise<WineStoreSimple[]> {
    return get<WineStoreSimple[]>(`/miniprogram/store/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`)
  }

  /**
   * 获取推荐门店列表
   * @param limit 返回数量限制，默认10
   * @returns 推荐门店列表
   */
  static async getRecommendedStores(limit: number = 10): Promise<WineStoreSimple[]> {
    return get<WineStoreSimple[]>(`/miniprogram/store/recommended?limit=${limit}`)
  }

  /**
   * 检查门店是否营业
   * @param storeId 门店ID
   * @returns 是否营业
   */
  static async checkStoreOpen(storeId: string): Promise<boolean> {
    return get<boolean>(`/miniprogram/store/check-open?storeId=${storeId}`)
  }

  /**
   * 获取门店设备列表
   * @param storeId 门店ID
   * @returns 设备列表
   */
  static async getStoreDevices(storeId: string): Promise<StoreDevice[]> {
    return get<StoreDevice[]>(`/miniprogram/store/${storeId}/devices`)
  }

  /**
   * 获取门店统计信息
   * @param storeId 门店ID
   * @returns 统计信息
   */
  static async getStoreStatistics(storeId: string): Promise<StoreStatistics> {
    return get<StoreStatistics>(`/miniprogram/store/${storeId}/statistics`)
  }
}

// 导出默认实例和类型
export default StoreApi
export type { WineStoreSimple as StoreSimple, WineStore as Store } 