<template>
  <view class="device-list-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <u-icon name="search" size="18" color="#999"></u-icon>
        <input 
          placeholder="搜索设备名称或位置" 
          v-model="searchKeyword" 
          @input="handleSearch"
          class="input-field"
        />
      </view>
      <view class="location-btn" @click="getCurrentLocation" :class="{ 'has-location': userLocation }">
        <u-icon name="map" size="18" :color="userLocation ? '#52c41a' : '#007aff'"></u-icon>
      </view>
    </view>

    <!-- 筛选器 -->
    <view class="tabs-container">
      <up-tabs 
        :list="filterList" 
        :current="currentTabIndex" 
        @change="handleTabChange"
        :scrollable="false"
        lineColor="#007aff"
        lineHeight="2"
        lineWidth="40"
        activeColor="#007aff"
        inactiveColor="#666"
        gutter="40"
        height="88"
        fontSize="28"
        :itemStyle="{ padding: '0 20rpx', height: '88rpx', margin: 0 }"
        :style="{ margin: 0, padding: 0 }"
      ></up-tabs>
    </view>

    <!-- 设备列表 -->
    <view class="device-list">
      <view v-if="deviceList.length === 0" class="empty-state">
        <image src="/static/images/暂无数据.svg" class="empty-icon" mode="aspectFit" />
        <text class="empty-text">暂无设备数据</text>
        <button class="refresh-btn" @click="refreshList">刷新</button>
      </view>
      
      <view v-else>
        <view 
          class="device-item" 
          v-for="device in deviceList" 
          :key="device.id"
          @click="goToDeviceDetail(device.id)"
        >
          <!-- 设备信息 -->
          <view class="device-info">
            <view class="device-header">
              <text class="device-name">{{ device.name }}</text>
              <view class="device-status" :class="getStatusClass(device.status)">
                {{ getStatusText(device.status) }}
              </view>
            </view>
            
            <view class="device-location">
              <u-icon name="home" size="14" color="#666"></u-icon>
              <text class="location-text">{{ device.location }}</text>
            </view>
            
            <view class="device-distance">
              <u-icon name="share" size="14" color="#007aff"></u-icon>
              <text class="distance-text">距离 {{ device.distance }}km</text>
            </view>
          </view>

          <!-- 设备详情 -->
          <view class="device-details">
            <view class="detail-row">
              <text class="detail-label">商品种类：</text>
              <text class="detail-value">{{ device.productCount }}种</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">营业时间：</text>
              <text class="detail-value">{{ device.businessHours }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">最后更新：</text>
              <text class="detail-value">{{ formatTime(device.lastUpdate) }}</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="device-actions">
            <button 
              class="action-btn secondary" 
              @click.stop="navigateToDevice(device)"
            >
              导航
            </button>
            <button 
              class="action-btn primary" 
              @click.stop="goToDeviceDetail(device.id)"
              :disabled="device.status !== 'online'"
            >
              {{ device.status === 'online' ? '立即购买' : '设备离线' }}
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view v-if="hasMore" class="load-more" @click="loadMore">
      <text>{{ loading ? '加载中...' : '加载更多' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DeviceApi } from '@/api/device'

interface Device {
  id: string
  name: string
  location: string
  distance: number
  status: 'online' | 'offline' | 'maintenance'
  productCount: number
  businessHours: string
  lastUpdate: string
  latitude?: number
  longitude?: number
}

// 状态数据
const searchKeyword = ref('')
const activeFilter = ref('all')
const deviceList = ref<Device[]>([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const userLocation = ref<{ latitude: number; longitude: number } | null>(null)
const currentTabIndex = ref(0)

// 筛选列表
const filterList = ref([
  { name: '全部', key: 'all' },
  { name: '在线', key: 'online' },
  { name: '附近', key: 'nearby' },
  { name: '离线', key: 'offline' }
])

onMounted(() => {
  // 设置导航栏标题
  uni.setNavigationBarTitle({
    title: '设备列表'
  })
  
  // 加载设备列表（不自动获取位置）
  loadDeviceList()
  
  // 延迟设置当前标签索引，确保组件完全初始化
  setTimeout(() => {
    const index = filterList.value.findIndex(item => item.key === activeFilter.value)
    if (index !== -1) {
      currentTabIndex.value = index
    }
  }, 100)
})

/**
 * 获取当前位置
 */
const getCurrentLocation = () => {
  // 先检查授权状态
  uni.getSetting({
    success: (res) => {
      if (res.authSetting['scope.userLocation'] === false) {
        // 用户之前拒绝了授权，需要引导用户到设置页面
        uni.showModal({
          title: '位置权限申请',
          content: '需要获取您的位置信息来查找附近的设备，请到设置页面开启位置权限',
          confirmText: '去设置',
          cancelText: '取消',
          success: (modalRes) => {
            if (modalRes.confirm) {
              uni.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.userLocation']) {
                    // 用户开启了权限，重新获取位置
                    getLocationWithPermission()
                  }
                }
              })
            }
          }
        })
      } else if (res.authSetting['scope.userLocation'] === undefined) {
        // 第一次请求，直接调用授权
        getLocationWithPermission()
      } else {
        // 已经授权，直接获取位置
        getLocationWithPermission()
      }
    },
    fail: () => {
      // 获取设置失败，直接尝试获取位置
      getLocationWithPermission()
    }
  })
}

/**
 * 获取位置（已有权限）
 */
const getLocationWithPermission = () => {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      userLocation.value = {
        latitude: res.latitude,
        longitude: res.longitude
      }
      
      // 重新加载设备列表以计算距离
      page.value = 1
      loadDeviceList()
    },
    fail: (err) => {
      console.error('获取位置失败:', err)
      if (err.errMsg.includes('no permission')) {
        uni.showModal({
          title: '位置权限未开启',
          content: '请在小程序设置中开启位置权限，以便为您推荐附近的设备',
          showCancel: false,
          confirmText: '知道了'
        })
      } else {
        uni.showToast({
          title: '获取位置失败',
          icon: 'none'
        })
      }
    }
  })
}

/**
 * 加载设备列表
 */
const loadDeviceList = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    // 调用真实API获取设备列表
    const response = await DeviceApi.getNearbyDevices(
      116.476624, // 默认经度
      39.996564,  // 默认纬度
      10,         // 搜索半径10公里
      20          // 限制20个结果
    )
    
    // 转换API数据格式
    let apiDevices: Device[] = response.map((device: any) => {
      const deviceStatus = device.status?.toLowerCase() || 'offline'
      const validStatus: 'online' | 'offline' | 'maintenance' = 
        ['online', 'offline', 'maintenance'].includes(deviceStatus) 
          ? deviceStatus as 'online' | 'offline' | 'maintenance'
          : 'offline'
      
      return {
        id: device.id,
        name: device.deviceName,
        location: device.address || device.location || '',
        distance: 0, // API暂未返回距离，可后续计算
        status: validStatus,
        productCount: 0, // API暂未返回产品数量
        businessHours: '24小时', // API暂未返回营业时间
        lastUpdate: device.lastOnlineTime || device.updateTime || '',
        latitude: device.latitude || 0,
        longitude: device.longitude || 0
      }
    })
    
    // 根据筛选条件过滤数据
    if (activeFilter.value !== 'all') {
      if (activeFilter.value === 'nearby') {
        apiDevices = apiDevices.filter(device => device.distance <= 2)
      } else {
        apiDevices = apiDevices.filter(device => device.status === activeFilter.value)
      }
    }
    
    // 根据搜索关键词过滤
    if (searchKeyword.value) {
      apiDevices = apiDevices.filter(device => 
        device.name.includes(searchKeyword.value) || 
        device.location.includes(searchKeyword.value)
      )
    }
    
    if (page.value === 1) {
      deviceList.value = apiDevices
    } else {
      deviceList.value.push(...apiDevices)
    }
    
    // 设置分页状态
    hasMore.value = apiDevices.length >= 20
    
  } catch (error) {
    console.error('加载设备列表失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 搜索防抖定时器
let searchTimer: number | null = null

/**
 * 搜索处理
 */
const handleSearch = () => {
  // 防抖处理
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    page.value = 1
    hasMore.value = true
    loadDeviceList()
  }, 500)
}

/**
 * 处理标签页切换
 */
const handleTabChange = (index: number) => {
  try {
    if (index >= 0 && index < filterList.value.length) {
      currentTabIndex.value = index
      const filterKey = filterList.value[index].key
      activeFilter.value = filterKey
      page.value = 1
      hasMore.value = true
      loadDeviceList()
    }
  } catch (error) {
    console.error('标签页切换错误:', error)
  }
}

/**
 * 切换筛选
 */
const switchFilter = (filterKey: string) => {
  if (activeFilter.value === filterKey) return
  
  activeFilter.value = filterKey
  const index = filterList.value.findIndex(item => item.key === filterKey)
  if (index !== -1) {
    currentTabIndex.value = index
  }
  page.value = 1
  hasMore.value = true
  loadDeviceList()
}

/**
 * 加载更多
 */
const loadMore = () => {
  if (loading.value || !hasMore.value) return
  
  page.value++
  loadDeviceList()
}

/**
 * 刷新列表
 */
const refreshList = () => {
  page.value = 1
  hasMore.value = true
  loadDeviceList()
}

/**
 * 格式化时间
 */
const formatTime = (timeStr: string): string => {
  try {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) { // 1天内
      return Math.floor(diff / 3600000) + '小时前'
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  } catch {
    return timeStr
  }
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    maintenance: '维护中'
  }
  return statusMap[status] || status
}

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string): string => {
  const classMap: Record<string, string> = {
    online: 'status-online',
    offline: 'status-offline',
    maintenance: 'status-maintenance'
  }
  return classMap[status] || ''
}

/**
 * 跳转设备详情
 */
const goToDeviceDetail = (deviceId: string) => {
  uni.navigateTo({
    url: `/pages/device/detail?deviceId=${deviceId}`,
    fail: () => {
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 导航到设备
 */
const navigateToDevice = (device: Device) => {
  if (!device.latitude || !device.longitude) {
    uni.showToast({
      title: '设备位置信息不完整',
      icon: 'none'
    })
    return
  }
  
  uni.openLocation({
    latitude: device.latitude,
    longitude: device.longitude,
    name: device.name,
    address: device.location,
    scale: 15
  })
}
</script>

<style lang="scss" scoped>
.device-list-page {
  min-height: 100vh;
  background: #f5f5f5;
  margin: 0;
  padding: 0;
}

.search-bar {
  background: white;
  padding: 20rpx;
  display: flex;
  gap: 20rpx;
  align-items: center;
  margin: 0;
  border-bottom: none;
  
  .search-input {
    flex: 1;
    display: flex;
    align-items: center;
    background: #f8f9fa;
    border-radius: 30rpx;
    padding: 16rpx 24rpx;
    gap: 12rpx;
    
    .input-field {
      flex: 1;
      font-size: 28rpx;
      color: #333;
      
      &::placeholder {
        color: #999;
      }
    }
  }
  
  .location-btn {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f8ff;
    border-radius: 40rpx;
    transition: all 0.3s;
    
    &:active {
      background: #e6f3ff;
    }
    
    &.has-location {
      background: #f6ffed;
      box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.2);
    }
  }
}

.tabs-container {
  background: white;
  border-top: none;
  position: sticky;
  top: 0;
  z-index: 100;
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  margin-top: -1rpx;
}

.device-list {
  padding: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
  
  .empty-icon {
    width: 200rpx;
    height: 200rpx;
    opacity: 0.5;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 30rpx;
  }
  
  .refresh-btn {
    background: #007aff;
    color: white;
    border: none;
    border-radius: 30rpx;
    padding: 20rpx 40rpx;
    font-size: 28rpx;
  }
}

.device-item {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  position: relative;
}



.device-info {
  margin-bottom: 20rpx;
  
  .device-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    
    .device-name {
      font-size: 32rpx;
      color: #333;
      font-weight: bold;
    }
    
    .device-status {
      font-size: 24rpx;
      padding: 6rpx 12rpx;
      border-radius: 12rpx;
      
      &.status-online {
        color: #52c41a;
        background: #f6ffed;
      }
      
      &.status-offline {
        color: #999;
        background: #f5f5f5;
      }
      
      &.status-maintenance {
        color: #ff9500;
        background: #fff3e0;
      }
    }
  }
  
  .device-location {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 12rpx;
    
    .location-text {
      font-size: 26rpx;
      color: #666;
      line-height: 1.4;
    }
  }
  
  .device-distance {
    display: flex;
    align-items: center;
    gap: 8rpx;
    
    .distance-text {
      font-size: 24rpx;
      color: #007aff;
    }
  }
}

.device-details {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .detail-label {
      font-size: 26rpx;
      color: #666;
    }
    
    .detail-value {
      font-size: 26rpx;
      color: #333;
    }
  }
}

.device-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
  
  .action-btn {
    padding: 8rpx 16rpx;
    border-radius: 16rpx;
    font-size: 22rpx;
    border: none;
    min-width: 80rpx;
    height: 60rpx;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.primary {
      background: #007aff;
      color: white;
      
      &:disabled {
        background: #ccc;
        color: #999;
      }
    }
    
    &.secondary {
      background: #f8f9fa;
      color: #666;
      border: 1rpx solid #e9ecef;
    }
    
    &:active:not(:disabled) {
      opacity: 0.8;
    }
  }
}

.load-more {
  text-align: center;
  padding: 40rpx;
  font-size: 28rpx;
  color: #666;
}
</style> 