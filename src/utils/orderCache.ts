/**
 * 订单数据缓存管理工具
 * @description 用于在不同页面间同步订单状态变化，避免数据不一致
 * @author WQS团队
 * @date 2025-01-30
 */

import { reactive, ref } from 'vue'
import type { OrderSimple, OrderDetail, OrderStatus } from '@/api/order'

// 订单缓存数据
interface OrderCache {
  // 订单列表缓存
  orderList: OrderSimple[]
  // 订单详情缓存
  orderDetails: Map<string, OrderDetail>
  // 最后更新时间
  lastUpdateTime: number
  // 缓存版本号
  version: number
}

// 创建响应式缓存数据
const orderCache = reactive<OrderCache>({
  orderList: [],
  orderDetails: new Map(),
  lastUpdateTime: 0,
  version: 0
})

// 缓存过期时间（5分钟）
const CACHE_EXPIRE_TIME = 5 * 60 * 1000

/**
 * 检查缓存是否过期
 */
function isCacheExpired(): boolean {
  return Date.now() - orderCache.lastUpdateTime > CACHE_EXPIRE_TIME
}

/**
 * 更新缓存版本号
 */
function updateCacheVersion(): void {
  orderCache.version++
  orderCache.lastUpdateTime = Date.now()
  console.log('📦 缓存版本已更新:', orderCache.version)
}

/**
 * 设置订单列表缓存
 */
export function setOrderListCache(orders: OrderSimple[]): void {
  orderCache.orderList = [...orders]
  updateCacheVersion()
  console.log('📦 订单列表缓存已更新，数量:', orders.length)
}

/**
 * 获取订单列表缓存
 */
export function getOrderListCache(): OrderSimple[] | null {
  if (isCacheExpired()) {
    console.log('📦 订单列表缓存已过期')
    return null
  }
  
  console.log('📦 使用订单列表缓存，数量:', orderCache.orderList.length)
  return [...orderCache.orderList]
}

/**
 * 设置订单详情缓存
 */
export function setOrderDetailCache(orderId: string, orderDetail: OrderDetail): void {
  orderCache.orderDetails.set(orderId, { ...orderDetail })
  updateCacheVersion()
  console.log('📦 订单详情缓存已更新:', orderId)
}

/**
 * 获取订单详情缓存
 */
export function getOrderDetailCache(orderId: string): OrderDetail | null {
  if (isCacheExpired()) {
    console.log('📦 订单详情缓存已过期:', orderId)
    return null
  }
  
  const detail = orderCache.orderDetails.get(orderId)
  if (detail) {
    console.log('📦 使用订单详情缓存:', orderId)
    return { ...detail }
  }
  
  return null
}

/**
 * 更新缓存中的订单状态
 */
export function updateOrderStatusInCache(orderId: string, newStatus: OrderStatus): void {
  // 更新列表中的订单状态
  const orderInList = orderCache.orderList.find(order => order.id === orderId)
  if (orderInList) {
    orderInList.status = newStatus
    console.log('📦 列表缓存中订单状态已更新:', orderId, newStatus)
  }
  
  // 更新详情中的订单状态
  const orderDetail = orderCache.orderDetails.get(orderId)
  if (orderDetail) {
    orderDetail.status = newStatus
    console.log('📦 详情缓存中订单状态已更新:', orderId, newStatus)
  }
  
  updateCacheVersion()
}

/**
 * 从缓存中移除订单
 */
export function removeOrderFromCache(orderId: string): void {
  // 从列表中移除
  const listIndex = orderCache.orderList.findIndex(order => order.id === orderId)
  if (listIndex !== -1) {
    orderCache.orderList.splice(listIndex, 1)
    console.log('📦 订单已从列表缓存中移除:', orderId)
  }
  
  // 从详情中移除
  if (orderCache.orderDetails.has(orderId)) {
    orderCache.orderDetails.delete(orderId)
    console.log('📦 订单已从详情缓存中移除:', orderId)
  }
  
  updateCacheVersion()
}

/**
 * 清空所有缓存
 */
export function clearOrderCache(): void {
  orderCache.orderList = []
  orderCache.orderDetails.clear()
  orderCache.lastUpdateTime = 0
  orderCache.version = 0
  console.log('📦 所有订单缓存已清空')
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): {
  listCount: number
  detailCount: number
  version: number
  lastUpdateTime: number
  isExpired: boolean
} {
  return {
    listCount: orderCache.orderList.length,
    detailCount: orderCache.orderDetails.size,
    version: orderCache.version,
    lastUpdateTime: orderCache.lastUpdateTime,
    isExpired: isCacheExpired()
  }
}

/**
 * 订单缓存事件管理
 */
class OrderCacheEventManager {
  private listeners: Map<string, Function[]> = new Map()
  
  /**
   * 添加事件监听器
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }
  
  /**
   * 移除事件监听器
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }
  
  /**
   * 触发事件
   */
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('订单缓存事件处理错误:', error)
        }
      })
    }
  }
}

// 导出事件管理器实例
export const orderCacheEvents = new OrderCacheEventManager()

/**
 * 触发订单状态变化事件
 */
export function emitOrderStatusChanged(orderId: string, newStatus: OrderStatus, oldStatus?: OrderStatus): void {
  // 更新缓存
  updateOrderStatusInCache(orderId, newStatus)
  
  // 触发事件
  orderCacheEvents.emit('orderStatusChanged', {
    orderId,
    newStatus,
    oldStatus,
    timestamp: Date.now()
  })
  
  console.log('📦 订单状态变化事件已触发:', orderId, oldStatus, '->', newStatus)
}

/**
 * 预加载订单数据到缓存
 */
export async function preloadOrderCache(orderIds: string[], orderApi: any): Promise<void> {
  console.log('📦 开始预加载订单缓存:', orderIds.length, '个订单')
  
  const promises = orderIds.map(async (orderId) => {
    try {
      const detail = await orderApi.getOrderDetail(orderId)
      if (detail) {
        setOrderDetailCache(orderId, detail)
      }
    } catch (error) {
      console.error('预加载订单详情失败:', orderId, error)
    }
  })
  
  await Promise.all(promises)
  console.log('📦 订单缓存预加载完成')
} 