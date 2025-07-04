<template>
  <view class="nearby-store-page">
    <!-- 搜索栏 -->
    <view class="search-section">
      <up-search 
        v-model="searchKeyword" 
        placeholder="搜索门店名称或地址"
        :show-action="false"
        bg-color="#f8f8f8"
        @search="handleSearch"
        @custom="handleSearch"
      ></up-search>
    </view>

    <!-- 地图视图 -->
    <view class="map-section" v-if="showMap">
      <map
        :latitude="currentLocation.latitude"
        :longitude="currentLocation.longitude"
        :markers="mapMarkers"
        :scale="15"
        class="map-container"
        @markertap="handleMarkerTap"
        @updated="handleMapUpdated"
        show-location
      >
        <!-- 地图控件 -->
        <cover-view class="map-controls">
          <cover-view class="control-btn" @tap="getCurrentLocation">
            <cover-image src="/static/images/icon_location.png" class="control-icon"></cover-image>
          </cover-view>
          <cover-view class="control-btn" @tap="toggleMapView">
            <cover-image src="/static/images/icon_list.png" class="control-icon"></cover-image>
          </cover-view>
        </cover-view>
      </map>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-section">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-item" 
              :class="{ active: currentFilter === 'all' }" 
              @tap="setFilter('all')">
          全部门店
        </view>
        <view class="filter-item" 
              :class="{ active: currentFilter === 'nearby' }" 
              @tap="setFilter('nearby')">
          附近1公里
        </view>
        <view class="filter-item" 
              :class="{ active: currentFilter === 'open' }" 
              @tap="setFilter('open')">
          营业中
        </view>
        <view class="filter-item" 
              :class="{ active: currentFilter === 'discount' }" 
              @tap="setFilter('discount')">
          有优惠
        </view>
      </scroll-view>
      
      <view class="sort-btn" @tap="showSortModal = true">
        <text class="sort-text">{{ sortOptions[currentSort] }}</text>
        <up-icon name="arrow-down" size="12"></up-icon>
      </view>
    </view>

    <!-- 门店列表 -->
    <scroll-view 
      class="store-list" 
      scroll-y 
      @scrolltolower="loadMore"
      lower-threshold="100"
    >
      <view v-if="loading && stores.length === 0" class="loading-container">
        <up-loading-icon mode="circle"></up-loading-icon>
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="filteredStores.length === 0" class="empty-container">
        <image src="/static/images/goods_null.png" class="empty-image"></image>
        <text class="empty-text">暂无门店信息</text>
      </view>
      
      <view v-else class="store-content">
        <view 
          v-for="store in filteredStores" 
          :key="store.id" 
          class="store-item"
          @tap="goToStoreDetail(store)"
        >
          <!-- 门店图片 -->
          <view class="store-image-container">
            <image 
              :src="store.image || '/static/images/icon_home.png'" 
              class="store-image"
              mode="aspectFill"
            ></image>
            <view v-if="!store.isOpen" class="closed-mask">
              <text class="closed-text">已打烊</text>
            </view>
          </view>
          
          <!-- 门店信息 -->
          <view class="store-info">
            <view class="store-header">
              <text class="store-name">{{ store.name }}</text>
              <view class="store-status" :class="{ open: store.isOpen }">
                {{ store.isOpen ? '营业中' : '已打烊' }}
              </view>
            </view>
            
            <view class="store-address">
              <up-icon name="map" size="12" color="#999"></up-icon>
              <text class="address-text">{{ store.address }}</text>
            </view>
            
            <view class="store-distance">
              <up-icon name="clock" size="12" color="#999"></up-icon>
              <text class="distance-text">距离{{ store.distance }}km</text>
              <text class="business-hours">{{ store.businessHours }}</text>
            </view>
            
            <!-- 优惠信息 -->
            <view v-if="store.promotions && store.promotions.length > 0" class="promotions">
              <view 
                v-for="promotion in store.promotions.slice(0, 2)" 
                :key="promotion.id"
                class="promotion-tag"
              >
                {{ promotion.title }}
              </view>
            </view>
          </view>
          
          <!-- 操作按钮 -->
          <view class="store-actions">
            <view class="action-btn" @tap.stop="callStore(store)">
              <up-icon name="phone" size="16" color="#FF2C3C"></up-icon>
            </view>
            <view class="action-btn" @tap.stop="navigateToStore(store)">
              <up-icon name="map" size="16" color="#FF2C3C"></up-icon>
            </view>
          </view>
        </view>
        
        <!-- 加载更多提示 -->
        <view v-if="loading && stores.length > 0" class="load-more-container">
          <up-loading-icon mode="circle" size="20"></up-loading-icon>
          <text class="load-more-text">加载更多...</text>
        </view>
        
        <view v-else-if="stores.length >= totalCount && totalCount > 0" class="no-more-container">
          <text class="no-more-text">没有更多门店了</text>
        </view>
      </view>
    </scroll-view>

    <!-- 排序弹窗 -->
    <up-popup v-model="showSortModal" mode="bottom" border-radius="20">
      <view class="sort-popup">
        <view class="popup-header">
          <text class="popup-title">排序方式</text>
          <up-icon name="close" @tap="showSortModal = false"></up-icon>
        </view>
        <view class="sort-options">
          <view 
            v-for="(label, key) in sortOptions" 
            :key="key"
            class="sort-option"
            :class="{ active: currentSort === key }"
            @tap="selectSort(key)"
          >
            <text class="option-text">{{ label }}</text>
            <up-icon v-if="currentSort === key" name="checkmark" color="#FF2C3C"></up-icon>
          </view>
        </view>
      </view>
    </up-popup>

    <!-- 底部安全区域 -->
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { StoreApi, type WineStoreSimple, type WineStore, type StoreQueryParams } from '@/api/store'

// 接口类型定义 - 更新为与后端API匹配
interface Store {
  id: string
  storeCode: string
  storeName: string
  fullAddress: string
  contactPhone: string
  businessHours: string
  status: 'ENABLE' | 'DISABLE'
  isOpen: boolean
  distance?: number
  rating?: number
  viewCount?: number
  sortCode: number
  createTime: string
  latitude?: number
  longitude?: number
  imageUrl?: string
  // 兼容前端显示的字段映射
  name?: string
  address?: string
  phone?: string
  image?: string
  promotions?: Array<{
    id: string
    title: string
    description: string
  }>
}

interface Location {
  latitude: number
  longitude: number
}

// 响应式数据
const loading = ref(false)
const showMap = ref(true)
const showSortModal = ref(false)
const searchKeyword = ref('')
const currentFilter = ref('all')
const currentSort = ref('distance')

// 位置信息
const currentLocation = ref<Location>({
  latitude: 39.908823,
  longitude: 116.397470
})

// 门店数据
const stores = ref<Store[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 筛选和排序选项
const sortOptions: Record<string, string> = {
  distance: '距离最近',
  rating: '评分最高',
  createTime: '最新开业',
  sortCode: '推荐排序'
}

// 计算属性
const filteredStores = computed(() => {
  let result = [...stores.value]
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(store => 
      store.storeName.toLowerCase().includes(keyword) || 
      store.fullAddress.toLowerCase().includes(keyword) ||
      store.storeCode.toLowerCase().includes(keyword)
    )
  }
  
  // 筛选过滤
  switch (currentFilter.value) {
    case 'nearby':
      result = result.filter(store => store.distance && store.distance <= 1)
      break
    case 'open':
      result = result.filter(store => store.isOpen)
      break
    case 'discount':
      result = result.filter(store => store.promotions && store.promotions.length > 0)
      break
  }
  
  // 排序
  switch (currentSort.value) {
    case 'distance':
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      break
    case 'rating':
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      break
    case 'createTime':
      result.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      break
    case 'sortCode':
      result.sort((a, b) => (a.sortCode || 0) - (b.sortCode || 0))
      break
  }
  
  return result
})

// 地图标记点
const mapMarkers = computed(() => {
  return filteredStores.value
    .filter(store => store.latitude && store.longitude)
    .map((store, index) => ({
      id: index,
      latitude: store.latitude!,
      longitude: store.longitude!,
      iconPath: store.isOpen ? '/static/images/icon_home.png' : '/static/images/icon_home_gray.png',
      width: 32,
      height: 32,
      callout: {
        content: store.storeName,
        color: '#333',
        fontSize: 14,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        bgColor: '#ffffff',
        padding: 10,
        textAlign: 'center' as any,
        display: 'BYCLICK' as any
      },
      label: {
        content: store.isOpen ? '营业中' : '已打烊',
        color: store.isOpen ? '#52c41a' : '#999',
        fontSize: 10,
        x: 16,
        y: -10,
        borderRadius: 4,
        bgColor: '#ffffff',
        padding: 4,
        textAlign: 'center' as any
      }
    } as any))
})

// 页面生命周期
onLoad(() => {
  console.log('📍 附近门店页面加载')
})

onShow(() => {
  // 只加载基础门店数据，不主动获取位置
  loadStoreData()
})

onMounted(() => {
  console.log('🏪 附近门店页面挂载完成')
})

// 方法
const getCurrentLocation = () => {
  // 先检查位置权限
  uni.getSetting({
    success: (settingRes) => {
      if (settingRes.authSetting['scope.userLocation'] === false) {
        // 用户拒绝了位置权限，引导用户手动开启
        uni.showModal({
          title: '位置权限',
          content: '需要获取您的位置信息来显示附近门店，请在设置中开启位置权限',
          confirmText: '去设置',
          success: (modalRes) => {
            if (modalRes.confirm) {
              uni.openSetting({
                success: (openRes) => {
                  if (openRes.authSetting['scope.userLocation']) {
                    // 用户开启了权限，重新获取位置
                    getLocationWithPermission()
                  } else {
                    // 用户仍未开启权限，加载默认门店列表
                    loadStoreData()
                  }
                }
              })
            } else {
              // 用户取消，加载默认门店列表
              loadStoreData()
            }
          }
        })
      } else {
        // 有权限或未询问过权限，直接获取位置
        getLocationWithPermission()
      }
    },
    fail: () => {
      // 获取设置失败，直接尝试获取位置
      getLocationWithPermission()
    }
  })
}

const getLocationWithPermission = () => {
  uni.showLoading({ title: '获取位置中...' })
  
  uni.getLocation({
    type: 'gcj02',
    altitude: false, // 不需要高度信息
    success: (res) => {
      currentLocation.value = {
        latitude: res.latitude,
        longitude: res.longitude
      }
      console.log('📍 获取当前位置成功:', currentLocation.value)
      // 重新加载附近门店数据
      loadNearbyStores()
    },
    fail: (err) => {
      console.error('❌ 获取位置失败:', err)
      
      // 根据错误类型给出不同提示
      let errorMessage = '获取位置失败，将显示默认门店'
      if (err.errMsg && err.errMsg.includes('no permission')) {
        errorMessage = '位置权限未开启，将显示默认门店'
      } else if (err.errMsg && err.errMsg.includes('timeout')) {
        errorMessage = '位置获取超时，将显示默认门店'
      }
      
      uni.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      })
      
      // 即使获取位置失败，也加载默认门店列表
      loadStoreData()
    },
    complete: () => {
      uni.hideLoading()
    }
  })
}

const loadStoreData = async () => {
  loading.value = true
  
  try {
    console.log('🔄 开始加载门店数据...')
    
    // 构建查询参数
    const params: StoreQueryParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      status: 'ENABLE' // 只显示营业的门店
    }
    
    // 设置排序字段
    if (currentSort.value === 'distance') {
      params.sortField = 'sortCode'
      params.sortOrder = 'ASC' // 距离从近到远
    } else if (currentSort.value === 'rating' || currentSort.value === 'createTime' || currentSort.value === 'sortCode') {
      params.sortField = currentSort.value as 'rating' | 'createTime' | 'sortCode'
      params.sortOrder = currentSort.value === 'createTime' ? 'DESC' : 'ASC'
    }
    
    // 如果有搜索关键词，添加到查询参数
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    
    // 调用门店分页API
    const result = await StoreApi.getStorePage(params)
    
    console.log('✅ 门店数据加载成功:', result)
    
    // 转换数据格式以适配前端显示，并获取详细信息（包括经纬度）
    const transformedStores = await Promise.all(
      result.records.map(async (store) => {
        try {
          // 获取门店详细信息以获取经纬度
          const storeDetail = await StoreApi.getStoreDetail(store.id)
          return transformStoreData(storeDetail)
        } catch (error) {
          console.warn(`获取门店详情失败 (ID: ${store.id}):`, error)
          // 如果获取详情失败，使用基础信息
          return transformStoreData(store)
        }
      })
    )
    
    if (currentPage.value === 1) {
      stores.value = transformedStores
    } else {
      stores.value.push(...transformedStores)
    }
    
    totalCount.value = result.total
    
    // 如果有位置信息，计算距离
    if (currentLocation.value.latitude && currentLocation.value.longitude) {
      calculateDistances()
    }
    
  } catch (error) {
    console.error('❌ 加载门店数据失败:', error)
    uni.showToast({
      title: '加载门店失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const loadNearbyStores = async () => {
  if (!currentLocation.value.latitude || !currentLocation.value.longitude) {
    return
  }
  
  loading.value = true
  
  try {
    console.log('🔄 开始加载附近门店数据...')
    
    // 调用附近门店API
    const nearbyStores = await StoreApi.getNearbyStores(
      currentLocation.value.longitude,
      currentLocation.value.latitude,
      5.0, // 5公里范围
      50   // 最多50个门店
    )
    
    console.log('✅ 附近门店数据加载成功:', nearbyStores)
    
    // 转换数据格式
    stores.value = nearbyStores.map(transformStoreData)
    totalCount.value = stores.value.length
    
    // 距离已经在后端计算好了，无需重新计算
    
  } catch (error) {
    console.error('❌ 加载附近门店失败:', error)
    // 如果附近门店API失败，回退到普通门店列表
    await loadStoreData()
  } finally {
    loading.value = false
  }
}

// 数据转换函数：将后端数据转换为前端显示格式
const transformStoreData = (apiStore: WineStoreSimple | WineStore): Store => {
  return {
    id: apiStore.id,
    storeCode: apiStore.storeCode,
    storeName: apiStore.storeName,
    fullAddress: apiStore.fullAddress,
    contactPhone: apiStore.contactPhone,
    businessHours: apiStore.businessHours,
    status: apiStore.status,
    isOpen: apiStore.isOpen,
    distance: apiStore.distance,
    rating: apiStore.rating,
    viewCount: apiStore.viewCount,
    sortCode: apiStore.sortCode,
    createTime: apiStore.createTime,
    imageUrl: apiStore.imageUrl,
    
    // 兼容字段映射
    name: apiStore.storeName,
    address: apiStore.fullAddress,
    phone: apiStore.contactPhone,
    image: apiStore.imageUrl || '/static/images/icon_home.png',
    
    // 从完整门店信息中获取经纬度和优惠信息
    latitude: (apiStore as WineStore).latitude,
    longitude: (apiStore as WineStore).longitude,
    promotions: (apiStore as WineStore).promotions || []
  }
}

const calculateDistances = () => {
  // 计算每个门店与当前位置的距离
  stores.value.forEach(store => {
    if (store.latitude && store.longitude) {
      store.distance = calculateDistance(
        currentLocation.value.latitude,
        currentLocation.value.longitude,
        store.latitude,
        store.longitude
      )
    }
  })
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // 地球半径(公里)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10 // 保留一位小数
}

const handleSearch = async () => {
  console.log('🔍 搜索门店:', searchKeyword.value)
  
  if (searchKeyword.value.trim()) {
    // 使用搜索API
    try {
      loading.value = true
      const searchResults = await StoreApi.searchStores(searchKeyword.value.trim(), 20)
      stores.value = searchResults.map(transformStoreData)
      totalCount.value = stores.value.length
    } catch (error) {
      console.error('❌ 搜索门店失败:', error)
      uni.showToast({
        title: '搜索失败',
        icon: 'none'
      })
    } finally {
      loading.value = false
    }
  } else {
    // 清空搜索，重新加载数据
    currentPage.value = 1
    await loadStoreData()
  }
}

const setFilter = (filter: string) => {
  currentFilter.value = filter
  console.log('🔧 设置筛选:', filter)
  
  // 根据筛选条件重新加载数据
  if (filter === 'nearby') {
    // 符合隐私规范：用户主动点击"附近门店"时才请求位置权限
    requestLocationAndLoadNearby()
  } else {
    currentPage.value = 1
    loadStoreData()
  }
}

// 用户主动请求位置权限并加载附近门店（符合隐私规范）
const requestLocationAndLoadNearby = () => {
  uni.showModal({
    title: '位置权限',
    content: '需要获取您的位置信息来显示附近门店，是否允许？',
    success: (res) => {
      if (res.confirm) {
        // 用户同意，获取位置权限
        getCurrentLocation()
      } else {
        // 用户拒绝，重置筛选为全部门店
        currentFilter.value = 'all'
        uni.showToast({
          title: '已取消位置获取',
          icon: 'none'
        })
      }
    }
  })
}

const selectSort = (sort: string) => {
  currentSort.value = sort
  showSortModal.value = false
  console.log('📊 设置排序:', sort)
  
  // 重新加载数据以应用新的排序
  currentPage.value = 1
  loadStoreData()
}

const toggleMapView = () => {
  showMap.value = !showMap.value
}

const handleMarkerTap = (e: any) => {
  const markerId = e.detail.markerId
  const store = filteredStores.value[markerId]
  if (store) {
    goToStoreDetail(store)
  }
}

const handleMapUpdated = (e: any) => {
  console.log('🗺️ 地图更新:', e)
}

const goToStoreDetail = (store: Store) => {
  console.log('🏪 查看门店详情:', store.storeName)
  uni.navigateTo({
    url: `/pages/store/detail?id=${store.id}`
  })
}

const callStore = (store: Store) => {
  uni.makePhoneCall({
    phoneNumber: store.contactPhone,
    fail: (err) => {
      console.error('❌ 拨打电话失败:', err)
      uni.showToast({
        title: '拨打失败',
        icon: 'none'
      })
    }
  })
}

const navigateToStore = (store: Store) => {
  if (!store.latitude || !store.longitude) {
    uni.showToast({
      title: '门店位置信息不完整',
      icon: 'none'
    })
    return
  }
  
  uni.openLocation({
    latitude: store.latitude,
    longitude: store.longitude,
    name: store.storeName,
    address: store.fullAddress,
    fail: (err) => {
      console.error('❌ 打开地图失败:', err)
      uni.showToast({
        title: '打开地图失败',
        icon: 'none'
      })
    }
  })
}

// 加载更多数据
const loadMore = async () => {
  if (loading.value || stores.value.length >= totalCount.value) {
    return
  }
  
  currentPage.value++
  await loadStoreData()
}
</script>

<style lang="scss" scoped>
.nearby-store-page {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.search-section {
  padding: 20rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.map-section {
  height: 400rpx;
  position: relative;
  
  .map-container {
    width: 100%;
    height: 100%;
  }
  
  .map-controls {
    position: absolute;
    right: 20rpx;
    top: 20rpx;
    
    .control-btn {
      width: 60rpx;
      height: 60rpx;
      background-color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20rpx;
      box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
      
      .control-icon {
        width: 32rpx;
        height: 32rpx;
      }
    }
  }
}

.filter-section {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
  
  .filter-scroll {
    flex: 1;
    white-space: nowrap;
    
    .filter-item {
      display: inline-block;
      padding: 12rpx 24rpx;
      margin-right: 20rpx;
      background-color: #f5f5f5;
      border-radius: 30rpx;
      font-size: 26rpx;
      color: #666;
      
      &.active {
        background-color: #FF2C3C;
        color: #fff;
      }
    }
  }
  
  .sort-btn {
    display: flex;
    align-items: center;
    padding: 12rpx 20rpx;
    border: 1rpx solid #ddd;
    border-radius: 30rpx;
    margin-left: 20rpx;
    
    .sort-text {
      font-size: 26rpx;
      color: #666;
      margin-right: 8rpx;
    }
  }
}

.store-list {
  height: calc(100vh - 300rpx); /* 减去搜索栏、地图、筛选栏的高度 */
  
  .store-content {
    padding: 0 20rpx;
  }
}

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .loading-text, .empty-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #999;
  }
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
  }
}

.store-item {
  display: flex;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx 0;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  
  .store-image-container {
    position: relative;
    margin-right: 24rpx;
    
    .store-image {
      width: 120rpx;
      height: 120rpx;
      border-radius: 12rpx;
    }
    
    .closed-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .closed-text {
        color: #fff;
        font-size: 22rpx;
      }
    }
  }
  
  .store-info {
    flex: 1;
    
    .store-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12rpx;
      
      .store-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        flex: 1;
      }
      
      .store-status {
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
        font-size: 22rpx;
        background-color: #f5f5f5;
        color: #999;
        
        &.open {
          background-color: #e8f5e8;
          color: #52c41a;
        }
      }
    }
    
    .store-address {
      display: flex;
      align-items: center;
      margin-bottom: 8rpx;
      
      .address-text {
        margin-left: 8rpx;
        font-size: 26rpx;
        color: #666;
        flex: 1;
      }
    }
    
    .store-distance {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;
      
      .distance-text {
        margin-left: 8rpx;
        font-size: 24rpx;
        color: #999;
      }
      
      .business-hours {
        margin-left: 20rpx;
        font-size: 24rpx;
        color: #999;
      }
    }
    
    .promotions {
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;
      
      .promotion-tag {
        padding: 4rpx 8rpx;
        background-color: #fff2f0;
        color: #FF2C3C;
        font-size: 20rpx;
        border-radius: 4rpx;
        border: 1rpx solid #ffccc7;
      }
    }
  }
  
  .store-actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20rpx;
    
    .action-btn {
      width: 60rpx;
      height: 60rpx;
      border: 1rpx solid #FF2C3C;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.sort-popup {
  padding: 40rpx 0;
  
  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40rpx 30rpx;
    border-bottom: 1rpx solid #eee;
    
    .popup-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .sort-options {
    padding: 20rpx 0;
    
    .sort-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx 40rpx;
      
      .option-text {
        font-size: 30rpx;
        color: #333;
      }
      
      &.active .option-text {
        color: #FF2C3C;
        font-weight: bold;
      }
    }
  }
}

.load-more-container, .no-more-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
  
  .load-more-text, .no-more-text {
    margin-left: 16rpx;
    font-size: 26rpx;
    color: #999;
  }
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
}
</style>