/**
 * 图片URL处理工具函数
 * @description 处理各种格式的图片URL，包括Base64、相对路径、绝对路径等
 * @author WQS团队
 * @date 2025-01-30
 */

import { config } from '@/config'

/**
 * 处理图片URL，支持多种格式
 * @param imageUrl 原始图片URL
 * @param defaultImage 默认图片路径
 * @returns 处理后的图片URL
 */
export function processImageUrl(imageUrl?: string, defaultImage: string = '/static/images/wine_default.png'): string {
  // 如果没有图片URL，返回默认图片
  if (!imageUrl || imageUrl.trim() === '') {
    console.log('🖼️ 使用默认图片:', defaultImage)
    return defaultImage
  }

  const trimmedUrl = imageUrl.trim()
  
  // 1. Base64格式图片 - 直接返回
  if (trimmedUrl.startsWith('data:image/')) {
    console.log('🖼️ 使用Base64图片:', trimmedUrl.substring(0, 50) + '...')
    return trimmedUrl
  }
  
  // 2. 绝对URL（http/https开头）- 直接返回
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    console.log('🖼️ 使用绝对URL图片:', trimmedUrl)
    return trimmedUrl
  }
  
  // 3. 相对路径 - 需要加上服务器基础URL
  if (trimmedUrl.startsWith('/')) {
    // 获取服务器基础URL
    const baseUrl = getServerBaseUrl()
    const fullUrl = baseUrl + trimmedUrl
    console.log('🖼️ 使用相对路径图片:', trimmedUrl, '-> 完整URL:', fullUrl)
    return fullUrl
  }
  
  // 4. 其他格式 - 当作相对路径处理
  const baseUrl = getServerBaseUrl()
  const fullUrl = baseUrl + '/' + trimmedUrl
  console.log('🖼️ 使用其他格式图片:', trimmedUrl, '-> 完整URL:', fullUrl)
  return fullUrl
}

/**
 * 获取服务器基础URL
 * @returns 服务器基础URL
 */
function getServerBaseUrl(): string {
  // 从配置中获取基础URL
  const baseUrl = config.baseUrl || 'http://localhost:91'
  
  // 如果基础URL包含 /api 路径，去掉它
  if (baseUrl.endsWith('/api')) {
    return baseUrl.substring(0, baseUrl.length - 4)
  }
  
  return baseUrl
}

/**
 * 酒品图片URL处理（专用函数）
 * @param imageUrl 酒品图片URL
 * @returns 处理后的图片URL
 */
export function getWineImageUrl(imageUrl?: string): string {
  return processImageUrl(imageUrl, '/static/images/wine_default.png')
}

/**
 * 门店图片URL处理（专用函数）
 * @param imageUrl 门店图片URL
 * @returns 处理后的图片URL
 */
export function getStoreImageUrl(imageUrl?: string): string {
  return processImageUrl(imageUrl, '/static/images/store_default.png')
}

/**
 * 用户头像URL处理（专用函数）
 * @param avatarUrl 用户头像URL
 * @returns 处理后的图片URL
 */
export function getUserAvatarUrl(avatarUrl?: string): string {
  return processImageUrl(avatarUrl, '/static/images/user_default.png')
}

/**
 * 图片加载错误处理
 * @param event 错误事件
 * @param defaultImage 默认图片路径
 */
export function handleImageError(event: any, defaultImage: string = '/static/images/wine_default.png'): void {
  console.log('🖼️ 图片加载失败:', event)
  
  const target = event.target || event.currentTarget
  if (target && target.src !== defaultImage) {
    console.log('🖼️ 切换到默认图片:', defaultImage)
    target.src = defaultImage
  }
}

/**
 * 预加载图片
 * @param imageUrl 图片URL
 * @returns Promise<boolean> 是否加载成功
 */
export function preloadImage(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      console.log('🖼️ 图片预加载成功:', imageUrl)
      resolve(true)
    }
    
    img.onerror = () => {
      console.log('🖼️ 图片预加载失败:', imageUrl)
      resolve(false)
    }
    
    img.src = imageUrl
  })
}

/**
 * 批量预加载图片
 * @param imageUrls 图片URL数组
 * @returns Promise<boolean[]> 每个图片的加载结果
 */
export function preloadImages(imageUrls: string[]): Promise<boolean[]> {
  const promises = imageUrls.map(url => preloadImage(url))
  return Promise.all(promises)
} 