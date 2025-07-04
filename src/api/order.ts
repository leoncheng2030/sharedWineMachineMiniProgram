/**
 * 订单相关API接口
 * @description 小程序订单管理接口，包含订单查询、创建、取消、状态查询等功能
 * @author WQS团队
 * @date 2025-01-30
 */

import { request } from './request'

// ================================ 类型定义 ================================

/**
 * 订单状态枚举
 */
export enum OrderStatus {
  PENDING = 'PENDING',                  // 待支付
  DISPENSING = 'DISPENSING',            // 待取酒
  COMPLETED = 'COMPLETED'               // 已完成
}

/**
 * 订单状态显示文本映射
 */
export const OrderStatusText: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '待支付',
  [OrderStatus.DISPENSING]: '待取酒',
  [OrderStatus.COMPLETED]: '已完成'
}

/**
 * 订单分页查询参数
 */
export interface OrderPageParam {
  /** 页码，从1开始 */
  pageNum?: number
  /** 每页数量，默认10 */
  pageSize?: number
  /** 订单状态筛选 */
  status?: OrderStatus
  /** 开始时间 */
  startTime?: string
  /** 结束时间 */
  endTime?: string
  /** 关键词搜索（订单号、酒品名称） */
  keyword?: string
}

/**
 * 订单创建参数
 */
export interface OrderCreateParam {
  /** 设备ID */
  deviceId: string
  /** 酒品ID */
  wineId: string
  /** 出酒量(ml) */
  amount: number
  /** 单价(元/ml) */
  unitPrice: number
  /** 备注 */
  remark?: string
  /** 下单位置纬度 */
  latitude?: number
  /** 下单位置经度 */
  longitude?: number
}

/**
 * 订单取消参数
 */
export interface OrderCancelParam {
  /** 订单ID */
  orderId: string
  /** 取消原因 */
  cancelReason?: string
}

/**
 * 订单详情数据
 */
export interface OrderDetail {
  /** 订单ID */
  id: string
  /** 订单号 */
  orderNo: string
  /** 用户ID */
  userId: string
  /** 设备ID */
  deviceId: string
  /** 设备名称 */
  deviceName?: string
  /** 设备编码 */
  deviceCode?: string
  /** 酒品ID */
  wineId: string
  /** 酒品名称 */
  wineName: string
  /** 酒品图片 */
  wineImage?: string
  /** 酒品规格 */
  wineSpec?: string
  /** 酒精度数 */
  alcoholDegree?: number
  /** 出酒量(ml) */
  amount: number
  /** 单价(元/ml) */
  unitPrice: number
  /** 总金额(元) */
  totalAmount: number
  /** 服务费(元) */
  serviceFee?: number
  /** 订单状态 */
  status: OrderStatus
  /** 订单状态显示文本 */
  statusText?: string
  /** 支付时间 */
  payTime?: string
  /** 开始出酒时间 */
  dispenseStartTime?: string
  /** 出酒完成时间 */
  dispenseEndTime?: string
  /** 取消时间 */
  cancelTime?: string
  /** 取消原因 */
  cancelReason?: string
  /** 退款时间 */
  refundTime?: string
  /** 退款金额 */
  refundAmount?: number
  /** 备注 */
  remark?: string
  /** 创建时间 */
  createTime: string
  /** 更新时间 */
  updateTime?: string
  /** 扩展信息 */
  extJson?: string
}

/**
 * 订单简化信息（列表展示用）
 */
export interface OrderSimple {
  /** 订单ID */
  id: string
  /** 订单号 */
  orderNo: string
  /** 酒品名称 */
  wineName: string
  /** 酒品图片 */
  wineImage?: string
  /** 出酒量(ml) */
  amount: number
  /** 总金额(元) */
  totalAmount: number
  /** 订单状态 */
  status: OrderStatus
  /** 订单状态显示文本 */
  statusText?: string
  /** 创建时间 */
  createTime: string
  /** 设备ID */
  deviceId?: string
  /** 设备名称 */
  deviceName?: string
  /** 设备编码 */
  deviceCode?: string
  /** 设备位置 */
  deviceLocation?: string
  /** 是否可以取消 */
  canCancel?: boolean
  /** 是否可以支付 */
  canPay?: boolean
  /** 是否可以申请退款 */
  canRefund?: boolean
}

/**
 * 分页响应数据
 */
export interface OrderPageResult {
  /** 数据列表 */
  records: OrderSimple[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  current: number
  /** 每页大小 */
  size: number
  /** 总页数 */
  pages: number
}

/**
 * 订单统计数据
 */
export interface OrderStatistics {
  /** 待支付订单数 */
  pendingPaymentCount: number
  /** 进行中订单数（已支付+出酒中） */
  processingCount: number
  /** 已完成订单数 */
  completedCount: number
  /** 已取消订单数 */
  cancelledCount: number
  /** 总订单数 */
  totalCount: number
  /** 累计消费金额 */
  totalAmount: number
}

// ================================ API接口类 ================================

/**
 * 订单API接口类
 */
export class OrderApi {
  
  /**
   * 获取用户订单分页列表
   * @param params 查询参数
   * @returns 订单分页数据
   */
  static async getOrderPage(params: OrderPageParam = {}): Promise<OrderPageResult> {
    const defaultParams = {
      pageNum: 1,
      pageSize: 10,
      ...params
    }
    
    return request<OrderPageResult>('/miniprogram/order/page', defaultParams, 'GET')
  }

  /**
   * 获取订单详情
   * @param orderId 订单ID
   * @returns 订单详情
   */
  static async getOrderDetail(orderId: string): Promise<OrderDetail> {
    return request<OrderDetail>(`/miniprogram/order/detail?orderId=${orderId}`, {}, 'GET')
  }

  /**
   * 根据订单号获取订单详情
   * @param orderNo 订单号
   * @returns 订单详情
   */
  static async getOrderByOrderNo(orderNo: string): Promise<OrderDetail> {
    return request<OrderDetail>(`/miniprogram/order/orderNo/${orderNo}`, {}, 'GET')
  }

  /**
   * 创建订单
   * @param params 订单创建参数
   * @returns 订单ID
   */
  static async createOrder(params: OrderCreateParam): Promise<string> {
    return request<string>('/miniprogram/order/create', params, 'POST')
  }

  /**
   * 取消订单
   * @param params 取消订单参数
   * @returns 操作结果
   */
  static async cancelOrder(params: OrderCancelParam): Promise<boolean> {
    return request<boolean>('/miniprogram/order/cancel', params, 'POST')
  }

  /**
   * 确认取酒
   * @param orderId 订单ID
   * @returns 操作结果
   */
  static async confirmOrder(orderId: string): Promise<boolean> {
    return request<boolean>(`/miniprogram/order/confirm?orderId=${orderId}`, {}, 'POST')
  }

  /**
   * 申请退款
   * @param orderId 订单ID
   * @param reason 退款原因
   * @returns 操作结果
   */
  static async refundOrder(orderId: string, reason?: string): Promise<boolean> {
    // 手动构建查询参数，兼容小程序环境
    let url = `/miniprogram/order/refund?orderId=${encodeURIComponent(orderId)}`
    if (reason) {
      url += `&reason=${encodeURIComponent(reason)}`
    }
    
    return request<boolean>(url, {}, 'POST')
  }

  /**
   * 获取订单状态
   * @param orderId 订单ID
   * @returns 订单状态
   */
  static async getOrderStatus(orderId: string): Promise<OrderStatus> {
    return request<OrderStatus>(`/miniprogram/order/status/${orderId}`, {}, 'GET')
  }

  /**
   * 获取用户订单统计
   * @returns 订单统计数据
   */
  static async getOrderStatistics(): Promise<OrderStatistics> {
    return request<OrderStatistics>('/miniprogram/order/statistics', {}, 'GET')
  }

  /**
   * 搜索订单
   * @param keyword 搜索关键词
   * @param limit 返回数量限制
   * @returns 订单列表
   */
  static async searchOrders(keyword: string, limit: number = 10): Promise<OrderSimple[]> {
    return request<OrderSimple[]>('/miniprogram/order/search', { keyword, limit }, 'GET')
  }

  /**
   * 获取订单操作历史
   * @param orderId 订单ID
   * @returns 操作历史列表
   */
  static async getOrderHistory(orderId: string): Promise<any[]> {
    return request<any[]>(`/miniprogram/order/history/${orderId}`, {}, 'GET')
  }

  /**
   * 重新下单（基于历史订单）
   * @param orderId 原订单ID
   * @returns 新订单ID
   */
  static async reorder(orderId: string): Promise<string> {
    return request<string>(`/miniprogram/order/reorder?orderId=${orderId}`, {}, 'POST')
  }
}

// ================================ 工具函数 ================================

/**
 * 获取订单状态显示文本
 * @param status 订单状态
 * @returns 显示文本
 */
export function getOrderStatusText(status: OrderStatus): string {
  return OrderStatusText[status] || '未知状态'
}

/**
 * 判断订单是否可以取消
 * @param status 订单状态
 * @returns 是否可以取消
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === OrderStatus.PENDING
}

/**
 * 判断订单是否可以支付
 * @param status 订单状态
 * @returns 是否可以支付
 */
export function canPayOrder(status: OrderStatus): boolean {
  return status === OrderStatus.PENDING
}

/**
 * 判断订单是否可以申请退款
 * @param status 订单状态
 * @returns 是否可以申请退款
 */
export function canRefundOrder(status: OrderStatus): boolean {
  return status === OrderStatus.DISPENSING
}

/**
 * 格式化订单金额
 * @param amount 金额
 * @returns 格式化后的金额字符串
 */
export function formatOrderAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

/**
 * 格式化出酒量
 * @param amount 出酒量(ml)
 * @returns 格式化后的出酒量字符串
 */
export function formatWineAmount(amount: number): string {
  return `${amount}ml`
}

// 默认导出
export default OrderApi 