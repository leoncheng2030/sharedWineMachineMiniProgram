<template>
  <view class="store-detail-page">
    <view v-if="loading" class="loading-container">
      <up-loading-icon mode="circle"></up-loading-icon>
      <text class="loading-text">加载中...</text>
    </view>
    
    <view v-else-if="!store" class="error-container">
      <image src="/static/images/goods_null.png" class="error-image"></image>
      <text class="error-text">门店信息不存在</text>
      <up-button type="primary" @tap="goBack">返回</up-button>
    </view>
    
    <view v-else class="store-content">
      <!-- 门店头部信息 -->
      <view class="store-header">
        <image 
          :src="store.image || '/static/images/icon_home.png'" 
          class="store-cover"
          mode="aspectFill"
        ></image>
        
        <view class="store-info">
          <view class="store-title">
            <text class="store-name">{{ store.name }}</text>
            <view class="store-status" :class="{ open: store.isOpen }">
              {{ store.isOpen ? '营业中' : '已打烊' }}
            </view>
          </view>
          
          <view class="store-meta">
            <view class="meta-item">
              <up-icon name="map" size="14" color="#999"></up-icon>
              <text class="meta-text">距离{{ store.distance }}km</text>
            </view>
            <view class="meta-item">
              <up-icon name="star" size="14" color="#ffd700"></up-icon>
              <text class="meta-text">{{ store.rating || '4.8' }}分</text>
            </view>
            <view class="meta-item">
              <up-icon name="eye" size="14" color="#999"></up-icon>
              <text class="meta-text">{{ store.viewCount || '1234' }}人浏览</text>
            </view>
          </view>
          
          <view class="store-address">
            <up-icon name="home" size="14" color="#999"></up-icon>
            <text class="address-text">{{ store.address }}</text>
          </view>
        </view>
      </view>
      
      <!-- 快捷操作 -->
      <view class="quick-actions">
        <view class="action-item" @tap="callStore">
          <up-icon name="phone" size="20" color="#FF2C3C"></up-icon>
          <text class="action-text">拨打电话</text>
        </view>
        <view class="action-item" @tap="navigateToStore">
          <up-icon name="map" size="20" color="#FF2C3C"></up-icon>
          <text class="action-text">导航到店</text>
        </view>
        <view class="action-item" @tap="shareStore">
          <up-icon name="share" size="20" color="#FF2C3C"></up-icon>
          <text class="action-text">分享门店</text>
        </view>
        <view class="action-item" @tap="collectStore">
          <up-icon :name="store.isCollected ? 'heart-fill' : 'heart'" size="20" :color="store.isCollected ? '#FF2C3C' : '#999'"></up-icon>
          <text class="action-text">{{ store.isCollected ? '已收藏' : '收藏' }}</text>
        </view>
      </view>
      
      <!-- 营业时间 -->
      <view class="business-hours-section">
        <view class="section-title">
          <up-icon name="clock" size="16" color="#333"></up-icon>
          <text class="title-text">营业时间</text>
        </view>
        <view class="hours-list">
          <view 
            v-for="(hours, day) in store.businessHoursDetail" 
            :key="day"
            class="hours-item"
          >
            <text class="day-text">{{ getDayName(day) }}</text>
            <text class="hours-text" :class="{ closed: hours === '休息' }">{{ hours }}</text>
          </view>
        </view>
      </view>
      
      <!-- 优惠活动 -->
      <view v-if="store.promotions && store.promotions.length > 0" class="promotions-section">
        <view class="section-title">
          <up-icon name="gift" size="16" color="#333"></up-icon>
          <text class="title-text">优惠活动</text>
        </view>
        <view class="promotions-list">
          <view 
            v-for="promotion in store.promotions" 
            :key="promotion.id"
            class="promotion-item"
          >
            <view class="promotion-tag">
              <text class="tag-text">{{ promotion.type || '优惠' }}</text>
            </view>
            <view class="promotion-content">
              <text class="promotion-title">{{ promotion.title }}</text>
              <text class="promotion-desc">{{ promotion.description }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 酒品列表 -->
      <view class="products-section">
        <view class="section-title">
          <up-icon name="shopping-bag" size="16" color="#333"></up-icon>
          <text class="title-text">在售酒品</text>
          <text class="product-count">（{{ products.length }}款）</text>
        </view>
        
        <view v-if="products.length === 0" class="empty-products">
          <image src="/static/images/goods_null.png" class="empty-image"></image>
          <text class="empty-text">暂无在售酒品</text>
        </view>
        
        <view v-else class="products-grid">
          <view 
            v-for="product in products" 
            :key="product.id"
            class="product-item"
            @tap="goToProduct(product)"
          >
            <image 
              :src="product.image || '/static/images/goods_null.png'" 
              class="product-image"
              mode="aspectFill"
            ></image>
            
            <view class="product-info">
              <text class="product-name">{{ product.name }}</text>
              <text class="product-spec">{{ product.specification }}</text>
              <view class="product-price">
                <text class="price-symbol">¥</text>
                <text class="price-integer">{{ Math.floor(product.price) }}</text>
                <text class="price-decimal">.{{ (product.price % 1 * 100).toFixed(0).padStart(2, '0') }}</text>
                <text v-if="product.originalPrice > product.price" class="original-price">¥{{ product.originalPrice }}</text>
              </view>
              <view v-if="product.stock <= 10 && product.stock > 0" class="stock-warning">
                仅剩{{ product.stock }}件
              </view>
              <view v-else-if="product.stock === 0" class="stock-empty">
                暂时缺货
              </view>
            </view>
            
            <view v-if="product.stock > 0" class="buy-btn" @tap.stop="buyProduct(product)">
              <up-icon name="plus" size="16" color="#fff"></up-icon>
            </view>
            <view v-else class="buy-btn disabled">
              <up-icon name="close" size="16" color="#ccc"></up-icon>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 门店评价 -->
      <view class="reviews-section">
        <view class="section-title">
          <up-icon name="chat" size="16" color="#333"></up-icon>
          <text class="title-text">用户评价</text>
          <text class="review-count">（{{ reviews.length }}条）</text>
        </view>
        
        <view v-if="reviews.length === 0" class="empty-reviews">
          <text class="empty-text">暂无评价</text>
        </view>
        
        <view v-else class="reviews-list">
          <view 
            v-for="review in reviews.slice(0, 3)" 
            :key="review.id"
            class="review-item"
          >
            <view class="review-header">
              <image :src="review.avatar" class="user-avatar"></image>
              <view class="user-info">
                <text class="user-name">{{ review.userName }}</text>
                <view class="review-rating">
                  <up-rate 
                    :value="review.rating" 
                    :readonly="true" 
                    size="12"
                    active-color="#ffd700"
                    inactive-color="#ddd"
                  ></up-rate>
                </view>
              </view>
              <text class="review-time">{{ formatTime(review.createTime) }}</text>
            </view>
            <text class="review-content">{{ review.content }}</text>
          </view>
          
          <view v-if="reviews.length > 3" class="view-more" @tap="viewAllReviews">
            <text class="more-text">查看全部评价</text>
            <up-icon name="arrow-right" size="12" color="#999"></up-icon>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部安全区域 -->
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { StoreApi, type WineStore } from '@/api/store'

// 接口类型定义 - 更新为与后端API匹配
interface Store {
  id: string
  storeCode: string
  storeName: string
  fullAddress: string
  contactPhone: string
  businessHours: string
  businessHoursDetail?: Record<string, string>
  status: 'ENABLE' | 'DISABLE'
  isOpen: boolean
  distance?: number
  rating?: number
  viewCount?: number
  imageUrl?: string
  latitude?: number
  longitude?: number
  storeManagerUserName?: string
  province?: string
  city?: string
  district?: string
  detailAddress?: string
  contactEmail?: string
  priceAuthority?: 'PLATFORM' | 'CUSTOM'
  storeArea?: number
  description?: string
  deviceCount?: number
  productCount?: number
  promotions?: Array<{
    id: string
    title: string
    description: string
    type?: string
  }>
  
  // 兼容前端显示的字段映射
  name?: string
  address?: string
  phone?: string
  image?: string
  isCollected?: boolean
}

interface Product {
  id: string
  name: string
  image?: string
  price: number
  originalPrice: number
  specification: string
  stock: number
}

interface Review {
  id: string
  userName: string
  avatar: string
  rating: number
  content: string
  createTime: string
}

// 响应式数据
const loading = ref(false)
const storeId = ref('')
const store = ref<Store | null>(null)
const products = ref<Product[]>([])
const reviews = ref<Review[]>([])

// 页面生命周期
onLoad((options) => {
  console.log('🏪 门店详情页面加载:', options)
  if (options?.id) {
    storeId.value = options.id
  }
})

onShow(() => {
  if (storeId.value) {
    loadStoreDetail()
    loadProducts()
    loadReviews()
  }
})

// 方法
const loadStoreDetail = async () => {
  loading.value = true
  
  try {
    console.log('🔄 开始加载门店详情...', storeId.value)
    
    // 调用门店详情API
    const storeDetail = await StoreApi.getStoreDetail(storeId.value)
    
    console.log('✅ 门店详情加载成功:', storeDetail)
    
    // 转换数据格式以适配前端显示
    store.value = transformStoreDetailData(storeDetail)
    
  } catch (error) {
    console.error('❌ 加载门店详情失败:', error)
    uni.showToast({
      title: '加载门店详情失败',
      icon: 'none'
    })
    // 显示错误状态
    store.value = null
  } finally {
    loading.value = false
  }
}

// 数据转换函数：将后端门店详情数据转换为前端显示格式
const transformStoreDetailData = (apiStore: WineStore): Store => {
  return {
    id: apiStore.id,
    storeCode: apiStore.storeCode,
    storeName: apiStore.storeName,
    fullAddress: apiStore.fullAddress,
    contactPhone: apiStore.contactPhone,
    businessHours: apiStore.businessHours,
    businessHoursDetail: apiStore.businessHoursDetail,
    status: apiStore.status,
    isOpen: apiStore.isOpen,
    distance: apiStore.distance,
    rating: apiStore.rating,
    viewCount: apiStore.viewCount,
    imageUrl: apiStore.imageUrl,
    latitude: apiStore.latitude,
    longitude: apiStore.longitude,
    storeManagerUserName: apiStore.storeManagerUserName,
    province: apiStore.province,
    city: apiStore.city,
    district: apiStore.district,
    detailAddress: apiStore.detailAddress,
    contactEmail: apiStore.contactEmail,
    priceAuthority: apiStore.priceAuthority,
    storeArea: apiStore.storeArea,
    description: apiStore.description,
    deviceCount: apiStore.deviceCount,
    productCount: apiStore.productCount,
    promotions: apiStore.promotions,
    
    // 兼容字段映射
    name: apiStore.storeName,
    address: apiStore.fullAddress,
    phone: apiStore.contactPhone,
    image: apiStore.imageUrl || '/static/images/icon_home.png',
    isCollected: false // TODO: 后续需要从用户收藏API获取
  }
}

const loadProducts = async () => {
  try {
    console.log('🔄 开始加载门店酒品列表...', storeId.value)
    
    // TODO: 调用门店酒品列表API
    // 目前使用模拟数据，后续需要实现门店酒品API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟酒品数据
    products.value = [
      {
        id: '1',
        name: '茅台酒（飞天）',
        image: '/static/images/goods_null.png',
        price: 2699.00,
        originalPrice: 2999.00,
        specification: '500ml/瓶 53%vol',
        stock: 5
      },
      {
        id: '2',
        name: '五粮液（普五）',
        image: '/static/images/goods_null.png',
        price: 1299.00,
        originalPrice: 1399.00,
        specification: '500ml/瓶 52%vol',
        stock: 12
      },
      {
        id: '3',
        name: '剑南春（水晶剑）',
        image: '/static/images/goods_null.png',
        price: 399.00,
        originalPrice: 429.00,
        specification: '500ml/瓶 52%vol',
        stock: 0
      }
    ]
    
    console.log('✅ 门店酒品列表加载成功')
  } catch (error) {
    console.error('❌ 加载酒品列表失败:', error)
  }
}

const loadReviews = async () => {
  try {
    console.log('🔄 开始加载门店评价...', storeId.value)
    
    // TODO: 调用门店评价API
    // 目前使用模拟数据，后续需要实现门店评价API
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟评价数据
    reviews.value = [
      {
        id: '1',
        userName: '酒***客',
        avatar: '/static/images/my_portrait_empty.png',
        rating: 5,
        content: '门店位置很好找，酒品种类丰富，价格合理，服务态度也很好！',
        createTime: '2024-01-25 14:30:00'
      },
      {
        id: '2',
        userName: '品***家',
        avatar: '/static/images/my_portrait_empty.png',
        rating: 4,
        content: '购买很方便，扫码就能买，酒品质量有保障。',
        createTime: '2024-01-24 16:45:00'
      },
      {
        id: '3',
        userName: '老***酒',
        avatar: '/static/images/my_portrait_empty.png',
        rating: 5,
        content: '24小时营业真的很方便，半夜想喝酒也能买到！',
        createTime: '2024-01-23 22:15:00'
      }
    ]
    
    console.log('✅ 门店评价加载成功')
  } catch (error) {
    console.error('❌ 加载评价失败:', error)
  }
}

const getDayName = (day: string): string => {
  const dayNames: Record<string, string> = {
    '1': '周一',
    '2': '周二',
    '3': '周三',
    '4': '周四',
    '5': '周五',
    '6': '周六',
    '0': '周日'
  }
  return dayNames[day] || day
}

const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
  }
}

const goBack = () => {
  uni.navigateBack()
}

const callStore = () => {
  if (store.value?.phone) {
    uni.makePhoneCall({
      phoneNumber: store.value.phone,
      fail: (err) => {
        console.error('❌ 拨打电话失败:', err)
        uni.showToast({
          title: '拨打失败',
          icon: 'none'
        })
      }
    })
  }
}

const navigateToStore = () => {
  if (store.value && store.value.latitude && store.value.longitude) {
    uni.openLocation({
      latitude: store.value.latitude,
      longitude: store.value.longitude,
      name: store.value.name || store.value.storeName,
      address: store.value.address || store.value.fullAddress,
      fail: (err) => {
        console.error('❌ 打开地图失败:', err)
        uni.showToast({
          title: '打开地图失败',
          icon: 'none'
        })
      }
    })
  } else {
    uni.showToast({
      title: '门店位置信息不完整',
      icon: 'none'
    })
  }
}

const shareStore = () => {
  uni.share({
    provider: 'weixin',
    scene: 'WXSceneSession',
    type: 0,
    href: `pages/store/detail?id=${storeId.value}`,
    title: store.value?.name || '门店详情',
    summary: store.value?.address || '',
    imageUrl: store.value?.image || '',
    success: () => {
      uni.showToast({
        title: '分享成功',
        icon: 'success'
      })
    },
    fail: (err) => {
      console.error('❌ 分享失败:', err)
      uni.showToast({
        title: '分享失败',
        icon: 'none'
      })
    }
  })
}

const collectStore = () => {
  if (store.value) {
    store.value.isCollected = !store.value.isCollected
    uni.showToast({
      title: store.value.isCollected ? '收藏成功' : '取消收藏',
      icon: 'success'
    })
  }
}

const goToProduct = (product: Product) => {
  console.log('🍷 查看酒品详情:', product.name)
  uni.navigateTo({
    url: `/pages/product/detail?id=${product.id}`
  })
}

const buyProduct = (product: Product) => {
  console.log('🛒 购买酒品:', product.name)
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const viewAllReviews = () => {
  uni.navigateTo({
    url: `/pages/store/reviews?id=${storeId.value}`
  })
}
</script>

<style lang="scss" scoped>
.store-detail-page {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
  
  .loading-text, .error-text {
    margin: 20rpx 0;
    font-size: 28rpx;
    color: #999;
  }
  
  .error-image {
    width: 200rpx;
    height: 200rpx;
  }
}

.store-content {
  padding-bottom: 40rpx;
}

.store-header {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .store-cover {
    width: 100%;
    height: 300rpx;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
  }
  
  .store-info {
    .store-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16rpx;
      
      .store-name {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        flex: 1;
      }
      
      .store-status {
        padding: 6rpx 16rpx;
        border-radius: 16rpx;
        font-size: 24rpx;
        background-color: #f5f5f5;
        color: #999;
        
        &.open {
          background-color: #e8f5e8;
          color: #52c41a;
        }
      }
    }
    
    .store-meta {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;
      
      .meta-item {
        display: flex;
        align-items: center;
        margin-right: 24rpx;
        
        .meta-text {
          margin-left: 6rpx;
          font-size: 26rpx;
          color: #666;
        }
      }
    }
    
    .store-address {
      display: flex;
      align-items: flex-start;
      
      .address-text {
        margin-left: 8rpx;
        font-size: 28rpx;
        color: #666;
        line-height: 1.4;
        flex: 1;
      }
    }
  }
}

.quick-actions {
  display: flex;
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .action-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .action-text {
      margin-top: 12rpx;
      font-size: 24rpx;
      color: #666;
    }
  }
}

.business-hours-section,
.promotions-section,
.products-section,
.reviews-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  
  .section-title {
    display: flex;
    align-items: center;
    padding: 30rpx 30rpx 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .title-text {
      margin-left: 8rpx;
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .product-count,
    .review-count {
      margin-left: 8rpx;
      font-size: 26rpx;
      color: #999;
    }
  }
}

.hours-list {
  padding: 20rpx 30rpx;
  
  .hours-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 0;
    
    .day-text {
      font-size: 28rpx;
      color: #333;
    }
    
    .hours-text {
      font-size: 28rpx;
      color: #666;
      
      &.closed {
        color: #999;
      }
    }
  }
}

.promotions-list {
  padding: 20rpx 30rpx;
  
  .promotion-item {
    display: flex;
    align-items: flex-start;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .promotion-tag {
      background-color: #FF2C3C;
      color: #fff;
      padding: 4rpx 12rpx;
      border-radius: 8rpx;
      font-size: 20rpx;
      margin-right: 16rpx;
      margin-top: 4rpx;
      
      .tag-text {
        white-space: nowrap;
      }
    }
    
    .promotion-content {
      flex: 1;
      
      .promotion-title {
        display: block;
        font-size: 28rpx;
        color: #333;
        font-weight: bold;
        margin-bottom: 8rpx;
      }
      
      .promotion-desc {
        display: block;
        font-size: 24rpx;
        color: #666;
        line-height: 1.4;
      }
    }
  }
}

.empty-products,
.empty-reviews {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  
  .empty-image {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 20rpx;
  }
  
  .empty-text {
    font-size: 26rpx;
    color: #999;
  }
}

.products-grid {
  padding: 20rpx 30rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  
  .product-item {
    width: calc(50% - 10rpx);
    background-color: #f8f8f8;
    border-radius: 12rpx;
    padding: 20rpx;
    position: relative;
    
    .product-image {
      width: 100%;
      height: 200rpx;
      border-radius: 8rpx;
      margin-bottom: 16rpx;
    }
    
    .product-info {
      .product-name {
        display: block;
        font-size: 28rpx;
        color: #333;
        font-weight: bold;
        margin-bottom: 8rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .product-spec {
        display: block;
        font-size: 22rpx;
        color: #999;
        margin-bottom: 12rpx;
      }
      
      .product-price {
        display: flex;
        align-items: baseline;
        margin-bottom: 8rpx;
        
        .price-symbol {
          font-size: 24rpx;
          color: #FF2C3C;
          margin-right: 2rpx;
        }
        
        .price-integer {
          font-size: 32rpx;
          color: #FF2C3C;
          font-weight: bold;
        }
        
        .price-decimal {
          font-size: 24rpx;
          color: #FF2C3C;
          margin-right: 12rpx;
        }
        
        .original-price {
          font-size: 22rpx;
          color: #999;
          text-decoration: line-through;
        }
      }
      
      .stock-warning {
        font-size: 22rpx;
        color: #ff9500;
      }
      
      .stock-empty {
        font-size: 22rpx;
        color: #999;
      }
    }
    
    .buy-btn {
      position: absolute;
      right: 20rpx;
      bottom: 20rpx;
      width: 60rpx;
      height: 60rpx;
      background-color: #FF2C3C;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.disabled {
        background-color: #f5f5f5;
      }
    }
  }
}

.reviews-list {
  padding: 20rpx 30rpx;
  
  .review-item {
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .review-header {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;
      
      .user-avatar {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        margin-right: 16rpx;
      }
      
      .user-info {
        flex: 1;
        
        .user-name {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .review-rating {
          display: flex;
          align-items: center;
        }
      }
      
      .review-time {
        font-size: 24rpx;
        color: #999;
      }
    }
    
    .review-content {
      font-size: 26rpx;
      color: #666;
      line-height: 1.5;
    }
  }
  
  .view-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30rpx 0;
    
    .more-text {
      font-size: 26rpx;
      color: #999;
      margin-right: 8rpx;
    }
  }
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
}
</style> 