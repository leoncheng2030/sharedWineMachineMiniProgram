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

          <!-- 设备操作按钮 -->
          <view class="device-actions">
            <view class="action-buttons">
              <button
                  class="action-btn success"
                  @click.stop="checkBleDeviceStatus(device.deviceCode)"
              >
                设备状态
              </button>
              <button 
                class="action-btn primary" 
                @click.stop="goToDeviceControl(device.id)"
              >
                设备控制
              </button>
              <button 
                v-if="device.currentProductId"
                class="action-btn danger" 
                @click.stop="handleUnbindProduct(device.id)"
              >
                解绑酒品
              </button>
              <button 
                v-else
                class="action-btn secondary" 
                @click.stop="goToBindProduct(device.id)"
              >
                绑定酒品
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

    <!-- 设备状态弹窗 -->
    <up-modal 
      :show="showStatusModal" 
      title="设备状态检测"
      :show-cancel-button="currentDeviceStatus?.isOnline"
      cancel-text="⚡ 断电"
      cancel-color="#ff4d4f"
      confirm-text="确定"
      confirm-color="#1890ff"
      @cancel="handleDevicePowerOff"
      @confirm="handleCloseStatusModal"
      @close="handleCloseStatusModal"
    >
      <view class="device-status-content">
        <view v-if="currentDeviceStatus?.isOnline" class="status-section">
          <view class="status-header online">
            <up-icon name="checkmark-circle-fill" color="#52c41a" size="18"></up-icon>
            <text class="status-text">设备在线</text>
          </view>
          
          <view class="info-list" v-if="!currentDeviceStatus?.errorInfo?.hasError">
            <view class="info-item" v-if="currentDeviceStatus.status">
              <text class="label">状态：</text>
              <text class="value">{{ currentDeviceStatus.status.text }}</text>
            </view>
            
            <view class="info-item" v-if="currentDeviceStatus.remainInfo?.timeDisplay && currentDeviceStatus.remainInfo.timeDisplay !== '无'">
              <text class="label">剩余时间：</text>
              <text class="value">{{ currentDeviceStatus.remainInfo.timeDisplay }}</text>
            </view>
            
            <view class="info-item" v-if="currentDeviceStatus.remainInfo?.quantity && currentDeviceStatus.remainInfo.quantity > 0">
              <text class="label">剩余电量：</text>
              <text class="value">{{ currentDeviceStatus.remainInfo.quantity }}</text>
            </view>
            
            <view class="info-item" v-if="currentDeviceStatus.connectionInfo">
              <text class="label">信号强度：</text>
              <text class="value">{{ getSignalText(currentDeviceStatus.connectionInfo.signalLevel) }} ({{ currentDeviceStatus.connectionInfo.rssi }}dBm)</text>
            </view>
            
            <view class="info-item" v-if="currentDeviceStatus.orderInfo?.isActive">
              <text class="label">订单ID：</text>
              <text class="value">{{ currentDeviceStatus.orderInfo.orderId }}</text>
            </view>
          </view>
        </view>
        
        <view v-else class="status-section">
          <view class="status-header offline">
            <up-icon name="close-circle-fill" color="#ff4d4f" size="18"></up-icon>
            <text class="status-text">设备离线</text>
          </view>
        </view>
        
        <view class="error-section" v-if="currentDeviceStatus?.errorInfo?.hasError">
          <text class="error-text">{{ currentDeviceStatus.errorInfo.errorMessage }}</text>
        </view>
      </view>
    </up-modal>

  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/hooks'
import { EmptyState } from '@/components'
import { onLoad, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app'
import { DeviceApi, type DeviceInfo } from '@/api/device'
import { checkDetailedDeviceStatus, type DetailedDeviceStatus, writeChargeData } from '@/utils/ble'
import { deviceControlApi, type DeviceControlParam } from '@/api/deviceControl'
// 使用认证系统
const { isLoggedIn, userInfo, requireAuth } = useAuth()

// 响应式数据
const loading = ref(false)

const searchKeyword = ref('')

const deviceList = ref<DeviceInfo[]>([])

const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(20)

// 设备状态弹窗相关
const showStatusModal = ref(false)
const currentDeviceStatus = ref<DetailedDeviceStatus | undefined>()

const checkBleDeviceStatus = async (deviceCode: string | number) => {
  try {
    console.log('开始检测设备状态:', deviceCode)
    const status: DetailedDeviceStatus = await checkDetailedDeviceStatus(Number(deviceCode))
    
    console.log('获取到设备状态:', status)
    
    // 设置状态数据并显示弹窗
    currentDeviceStatus.value = status
    showStatusModal.value = true
    
    console.log('弹窗状态设置为:', showStatusModal.value)
    
  } catch (e) {
    console.error('设备状态检测失败:', e)
    uni.showToast({
      title: '检测失败',
      icon: 'none'
    })
  }
}

const handleCloseStatusModal = () => {
  showStatusModal.value = false
  currentDeviceStatus.value = undefined
}

const getSignalText = (level: string) => {
  const signalMap = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  }
  return signalMap[level as keyof typeof signalMap] || '未知'
}

const handleDevicePowerOff = async () => {
  if (!currentDeviceStatus.value || !currentDeviceStatus.value.isOnline) {
    uni.showToast({
      title: '设备离线，无法断电',
      icon: 'none'
    })
    return
  }

  try {
    // 显示确认对话框
    const result = await new Promise<boolean>((resolve) => {
      uni.showModal({
        title: '确认断电',
        content: '确定要对设备执行断电操作吗？此操作将立即停止设备供电。',
        success: (res) => {
          resolve(res.confirm)
        },
        fail: () => {
          resolve(false)
        }
      })
    })

    if (!result) {
      return
    }

    uni.showLoading({ title: '正在断电...' })

    const deviceId = currentDeviceStatus.value.deviceId.toString()
    
    // 构建断电控制参数
    const controlParam: DeviceControlParam = {
      chargeId: currentDeviceStatus.value.orderInfo?.orderId?.toString() || 'POWER_OFF_' + Date.now(),
      deviceCode: deviceId,
      userId: userInfo.value?.id || '',
      minute: 0, // 断电操作，时间设为0
      second: 0,
      quantity: 0, // 断电操作，电量设为0
      extMode: 99, // 特殊模式标识断电操作
      nowTime: Date.now()
    }

    // 获取断电控制指令
    const controlResult = await deviceControlApi.getControlCommand(controlParam)
    
    if (!controlResult.success || !controlResult.cmd) {
      throw new Error(controlResult.message || '获取断电指令失败')
    }

    // 通过蓝牙发送断电指令
    await writeChargeData(Number(deviceId), controlResult.cmd)
    
    // 更新控制结果
    await deviceControlApi.updateControlResult({
      orderId: controlParam.chargeId,
      deviceId: deviceId,
      success: true,
      message: '断电操作成功'
    })
    
    uni.hideLoading()
    uni.showToast({
      title: '断电成功',
      icon: 'success'
    })

    // 关闭弹窗
    handleCloseStatusModal()

    // 刷新设备列表
    await refreshData()

  } catch (error: any) {
    uni.hideLoading()
    console.error('设备断电失败:', error)
    
    // 如果有控制参数，更新失败结果
    if (currentDeviceStatus.value) {
      try {
        await deviceControlApi.updateControlResult({
          orderId: 'POWER_OFF_' + Date.now(),
          deviceId: currentDeviceStatus.value.deviceId.toString(),
          success: false,
          message: error.message || '断电操作失败'
        })
      } catch (updateError) {
        console.error('更新断电结果失败:', updateError)
      }
    }
    
    uni.showToast({
      title: error.message || '断电失败',
      icon: 'none'
    })
  }
}



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
    flex-direction: column;
    position: relative;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.98);
    }
    
    .device-info {
      flex: 1;
      margin-bottom: 30rpx;
      
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
      border-top: 1rpx solid #f0f0f0;
      padding-top: 20rpx;
      
      .action-buttons {
        display: flex;
        gap: 20rpx;
        
        .action-btn {
          flex: 1;
          padding: 20rpx 16rpx;
          border-radius: 16rpx;
          font-size: 26rpx;
          border: none;
          text-align: center;
          
          &.primary {
            background: #52c41a;
            color: white;
          }
          
          &.secondary {
            background: #f0f0f0;
            color: #666;
          }
          
          &.success {
            background: #1890ff;
            color: white;
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

.device-status-content {
  padding: 20rpx 0;
  text-align: center;
  .status-section {
    .status-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30rpx;
      
      .status-text {
        margin-left: 12rpx;
        font-size: 30rpx;
        font-weight: 500;
      }
      
      &.online .status-text {
        color: #52c41a;
      }
      
      &.offline .status-text {
        color: #ff4d4f;
      }
    }
    
    .info-list {
      .info-item {
        display: flex;
        margin-bottom: 16rpx;
        text-align: left;
        align-items: left;
        
        .label {
          font-size: 28rpx;
          color: #666;
          width: 140rpx;
          flex-shrink: 0;
        }
        
        .value {
          font-size: 28rpx;
          color: #333;
          flex: 1;
        }
      }
    }
  }
  
  .error-section {
    text-align: center;
    padding: 20rpx 0;
    
    .error-text {
      font-size: 28rpx;
      color: #ff4d4f;
    }
  }
}
</style> 