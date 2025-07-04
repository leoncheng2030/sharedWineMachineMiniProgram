<template>
  <view class="my-devices-page">


    <!-- 筛选和搜索 -->
    <view class="filter-section">
      <view class="search-box">
        <up-search 
          v-model="searchKeyword" 
          placeholder="搜索设备名称或编码"
          @search="handleSearch"
          @clear="handleSearch"
          shape="round"
          bg-color="#f8f8f8"
        ></up-search>
      </view>
      

    </view>

    <!-- 设备列表 -->
    <view class="devices-list">
      <view v-if="loading && deviceList.length === 0" class="loading-state">
        <up-loading-icon mode="circle"></up-loading-icon>
        <text>加载中...</text>
      </view>

      <EmptyState 
        v-else-if="filteredDevices.length === 0"
        type="device"
        text="暂无管理的设备"
      />

      <view v-else>
        <view 
          v-for="device in filteredDevices" 
          :key="device.id"
          class="device-card"
        >


          <!-- 设备信息 -->
          <view class="device-info">
            <view class="device-header">
              <view class="device-name">{{ device.deviceName }}</view>
              <view class="device-code">{{ device.deviceCode }}</view>
            </view>
            
            <view class="device-details">
              <view class="detail-row">
                <up-icon name="map" size="14" color="#999"></up-icon>
                <text class="detail-text">{{ device.location || device.address || '位置未设置' }}</text>
              </view>
              
              <view class="detail-row" v-if="device.storeName">
                <up-icon name="shop" size="14" color="#999"></up-icon>
                <text class="detail-text">{{ device.storeName }}</text>
              </view>
              
              <view class="detail-row" v-if="device.currentProductName">
                <up-icon name="goods" size="14" color="#999"></up-icon>
                <text class="detail-text">当前酒品：{{ device.currentProductName }}</text>
              </view>
              
              <view class="detail-row">
                <up-icon name="clock" size="14" color="#999"></up-icon>
                <text class="detail-text">{{ formatTime(device.lastOnlineTime || device.updateTime) }}</text>
              </view>
            </view>
          </view>

          <!-- 设备操作 -->
          <view class="device-actions">
            <view class="action-buttons">
              <button 
                class="action-btn secondary" 
                @click.stop="showDeviceMenu(device)"
              >
                管理
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
      <text>{{ loading ? '加载中...' : '加载更多' }}</text>
    </view>

    <!-- 设备操作菜单 -->
    <up-action-sheet 
      :show="showActionSheet" 
      :actions="actionSheetActions"
      title="设备管理"
      @close="showActionSheet = false"
      @select="handleActionSelect"
    ></up-action-sheet>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/hooks'
import { EmptyState } from '@/components'
import { onLoad, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app'
import { DeviceApi, type DeviceInfo } from '@/api/device'

// 使用认证系统
const { isLoggedIn, userInfo, requireAuth } = useAuth()

// 响应式数据
const loading = ref(false)

const searchKeyword = ref('')

const deviceList = ref<DeviceInfo[]>([])

const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(20)

// 操作菜单相关
const showActionSheet = ref(false)
const currentDevice = ref<DeviceInfo | null>(null)
const actionSheetActions = ref([
  { name: '设备详情', value: 'detail' },
  { name: '绑定酒品', value: 'bind' },
  { name: '解绑酒品', value: 'unbind' },
  { name: '进入维护', value: 'maintenance' },
  { name: '设备控制', value: 'control' }
])



// 过滤后的设备列表
const filteredDevices = computed(() => {
  let filtered = deviceList.value

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    filtered = filtered.filter(device => 
      device.deviceName.toLowerCase().includes(keyword) ||
      device.deviceCode.toLowerCase().includes(keyword) ||
      (device.location && device.location.toLowerCase().includes(keyword))
    )
  }

  return filtered
})

// 页面加载
onLoad(async () => {

  
  if (!isLoggedIn.value) {
    await requireAuth()
    return
  }
})

onMounted(async () => {
  if (isLoggedIn.value) {
    await loadDevices()
  }
})

// 下拉刷新
onPullDownRefresh(async () => {
  await refreshData()
  uni.stopPullDownRefresh()
})

// 触底加载更多
onReachBottom(() => {
  if (hasMore.value && !loading.value) {
    loadMore()
  }
})

/**
 * 加载设备列表
 */
const loadDevices = async (reset = true) => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    if (reset) {
      page.value = 1
      deviceList.value = []
    }
    
    const params = {
      pageNum: page.value,
      pageSize: pageSize.value,
      managerUserId: userInfo.value?.id,
      keyword: searchKeyword.value.trim() || undefined,
      sortField: 'lastOnlineTime' as const,
      sortOrder: 'DESC' as const
    }
    
    const result = await DeviceApi.getMyDevicesPage(params)
    
    if (reset) {
      deviceList.value = result.records
    } else {
      deviceList.value.push(...result.records)
    }
    
    hasMore.value = result.records.length === pageSize.value
    

    
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



/**
 * 刷新数据
 */
const refreshData = async () => {
  await loadDevices(true)
}

/**
 * 处理搜索
 */
const handleSearch = () => {
  // 搜索是通过计算属性实时过滤的，这里可以添加额外逻辑

}



/**
 * 加载更多
 */
const loadMore = async () => {
  page.value++
  await loadDevices(false)
}



/**
 * 显示设备操作菜单
 */
const showDeviceMenu = (device: DeviceInfo) => {
  currentDevice.value = device
  
  // 动态调整菜单项
  const actions = [
    { name: '设备控制', value: 'control' }
  ]
  
  if (device.currentProductId) {
    actions.push({ name: '解绑酒品', value: 'unbind' })
  } else {
    actions.push({ name: '绑定酒品', value: 'bind' })
  }
  
  actionSheetActions.value = actions
  showActionSheet.value = true
}

/**
 * 处理操作菜单选择
 */
const handleActionSelect = (action: any) => {
  showActionSheet.value = false
  
  if (!currentDevice.value) return
  
  switch (action.value) {
    case 'bind':
      goToBindProduct(currentDevice.value.id)
      break
    case 'unbind':
      handleUnbindProduct(currentDevice.value.id)
      break
    case 'control':
      goToDeviceControl(currentDevice.value.id)
      break
  }
}

/**
 * 解绑酒品
 */
const handleUnbindProduct = async (deviceId: string) => {
  try {
    const success = await DeviceApi.unbindDeviceProduct(deviceId)
    if (success) {
      await refreshData()
      uni.showToast({
        title: '解绑成功',
        icon: 'success'
      })
    }
  } catch (error) {
    console.error('解绑酒品失败:', error)
    uni.showToast({
      title: '解绑失败',
      icon: 'none'
    })
  }
}



/**
 * 格式化时间
 */
const formatTime = (dateStr: string | undefined): string => {
  if (!dateStr) return '未知'
  
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60 * 1000) {
      return '刚刚'
    } else if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  } catch {
    return dateStr
  }
}

/**
 * 页面跳转方法
 */
const goBack = () => {
  uni.navigateBack()
}

const addDevice = () => {
  uni.navigateTo({
    url: '/pages/device/add'
  })
}

const goToDeviceDetail = (deviceId: string) => {
  uni.navigateTo({
    url: `/pages/device/detail?id=${deviceId}`
  })
}

const goToBindProduct = (deviceId: string) => {
  uni.navigateTo({
    url: `/pages/device/bind-product?deviceId=${deviceId}`
  })
}

const goToDeviceControl = (deviceId: string) => {
  uni.navigateTo({
    url: `/pages/device/control?deviceId=${deviceId}`
  })
}
</script>

<style lang="scss" scoped>
.my-devices-page {
  min-height: 100vh;
  background: #f8f8f8;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  background: white;
  border-bottom: 1rpx solid #f0f0f0;
  
  .nav-back {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .nav-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
  
  .nav-actions {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}



.filter-section {
  background: white;

  border-radius: 0rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .search-box {
    margin-bottom: 0;
  }
}

.devices-list {
  padding: 30rpx 40rpx;
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 40rpx;
    
    text {
      margin-top: 20rpx;
      font-size: 28rpx;
      color: #999;
    }
  }
  
  .device-card {
    background: white;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: flex-start;
    position: relative;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.98);
    }
    

    
    .device-info {
      flex: 1;
      margin-right: 20rpx;
      
      .device-header {
        margin-bottom: 20rpx;
        
        .device-name {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .device-code {
          font-size: 24rpx;
          color: #999;
          background: #f0f0f0;
          padding: 4rpx 12rpx;
          border-radius: 12rpx;
          display: inline-block;
        }
      }
      
      .device-details {
        .detail-row {
          display: flex;
          align-items: center;
          margin-bottom: 12rpx;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .detail-text {
            font-size: 24rpx;
            color: #666;
            margin-left: 12rpx;
          }
        }
      }
    }
    
    .device-actions {
      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 16rpx;
        
        .action-btn {
          padding: 16rpx 24rpx;
          border-radius: 20rpx;
          font-size: 24rpx;
          border: none;
          min-width: 120rpx;
          
          &.primary {
            background: #52c41a;
            color: white;
          }
          
          &.secondary {
            background: #f0f0f0;
            color: #666;
          }
          
          &.danger {
            background: #ff4d4f;
            color: white;
          }
          
          &:disabled {
            opacity: 0.6;
          }
        }
      }
    }
  }
}

.load-more {
  text-align: center;
  padding: 40rpx;
  
  text {
    font-size: 28rpx;
    color: #52c41a;
  }
}
</style> 