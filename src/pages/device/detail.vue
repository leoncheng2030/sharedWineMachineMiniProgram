<template>
  <view class="device-detail-page">
    
    <!-- 页面加载状态 -->
    <view v-if="pageLoading" class="loading-container">
      <up-loading-icon mode="circle" size="40"></up-loading-icon>
      <text class="loading-text">正在加载设备信息...</text>
    </view>
    
    <!-- 登录提示界面 -->
    <view v-else-if="loginRequired" class="login-required-container">
      <up-icon name="lock" size="80" color="#ccc"></up-icon>
      <text class="login-title">需要登录</text>
      <text class="login-desc">查看设备详情需要先登录您的账户</text>
      <up-button 
        type="primary" 
        @click="showAuthModal = true"
        custom-style="margin-top: 40rpx; width: 300rpx;">
        立即登录
      </up-button>
    </view>
    
        <!-- 设备详情内容 -->
    <view v-else>
      <!-- 酒品信息 - 主角，放在最前面并增强视觉效果 -->
    <view class="wine-hero-card">
      <view class="wine-hero-content">
        <image :src="wineInfo.image" class="wine-hero-image" mode="aspectFill" />
        <view class="wine-hero-info">
          <view class="wine-name-section">
            <text class="wine-hero-name">[{{ wineInfo.brand }}]{{ wineInfo.name }}</text>
          </view>
          <view class="wine-details-section">
            <text class="wine-type">{{ wineInfo.type }} | {{ wineInfo.alcoholContent }}°</text>
            <view class="wine-status-row">
              <text class="stock-text">库存：{{ wineInfo.stock }}ml</text>
            </view>
            <text class="wine-price">¥{{ wineInfo.unitPrice }}/ml</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 容量规格选择 - 紧跟酒品信息 -->
    <view class="capacity-selection-card">
      <view class="card-header">
        <up-icon name="grid-fill" size="20" color="#007aff"></up-icon>
        <text class="card-title">选择容量</text>
      </view>

      <view v-if="wineInfo.capacities && wineInfo.capacities.length > 0" class="capacity-grid">
        <view v-for="capacity in wineInfo.capacities" :key="capacity.id" class="capacity-item"
          :class="{ 'selected': selectedCapacity?.id === capacity.id }" @click="selectCapacity(capacity)">
          <view class="capacity-size">{{ capacity.size }}</view>
        </view>
      </view>

      <view v-else class="no-capacity-available">
        <up-icon name="info-circle" size="40" color="#ccc"></up-icon>
        <text class="no-capacity-text">暂无可选容量</text>
        <text class="no-capacity-desc">请联系门店管理员配置容量规格</text>
      </view>

      <view v-if="wineInfo.capacities && wineInfo.capacities.length > 0" class="capacity-tips">
        <text class="tips-text">💡 选择合适的容量，现打现喝更新鲜</text>
      </view>
    </view>

    <!-- 设备信息卡片 - 简化为配角 -->
    <view class="device-info-card">
      <view class="card-header">
        <up-icon name="setting-fill" size="18" color="#666"></up-icon>
        <text class="card-title secondary">设备信息</text>
        <view class="device-status-mini" :class="deviceInfo.status" @click="handleBluetoothCheck">
          {{ getStatusText(deviceInfo.status) }}
        </view>
      </view>

      <view class="device-simple-info">
        <view class="device-row">
          <view class="device-item">
            <up-icon name="home-fill" size="16" color="#999"></up-icon>
            <text class="device-name-simple">{{ deviceInfo.name }}</text>
          </view>
          <view class="bluetooth-check-button" @click="handleBluetoothCheck" :class="{ 'checking': isBluetoothChecking }">
            <up-icon :name="getBluetoothCheckIcon()" size="16" :color="getBluetoothCheckColor()"></up-icon>
            <text class="bluetooth-check-text">{{ getBluetoothCheckText() }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 门店信息卡片 - 简化为配角 -->
    <view class="store-info-card">
      <view class="card-header">
        <up-icon name="home-fill" size="18" color="#666"></up-icon>
        <text class="card-title secondary">门店信息</text>
      </view>

      <view class="store-simple-details">
        <view class="store-main-row">
          <view class="store-item">
            <up-icon name="home-fill" size="16" color="#999"></up-icon>
            <text class="store-name-simple">{{ storeInfo.name }}</text>
          </view>
          <view class="store-item phone-item" @click="callStore">
            <up-icon name="phone-fill" size="16" color="#007aff"></up-icon>
            <text class="store-phone-simple">{{ storeInfo.phone }}</text>
          </view>
        </view>
        <view class="store-hours-row">
          <up-icon name="clock-fill" size="14" color="#999"></up-icon>
          <text class="store-hours-simple">营业时间：{{ storeInfo.hours }}</text>
        </view>
        <view class="store-address-row">
          <up-icon name="map-pin" size="14" color="#999"></up-icon>
          <text class="store-address-simple">{{ storeInfo.address }}</text>
        </view>
      </view>
    </view>

  </view>

  <!-- 底部购买按钮 -->
  <view class="purchase-footer">
    <view v-if="selectedCapacity" class="purchase-info">
      <view class="capacity-info-row">
        <text class="capacity-text">{{ selectedCapacity.size }} · {{ selectedCapacity.description }}</text>
      </view>
      <view class="price-calculation-row">
        <text class="price-calculation">¥{{ wineInfo.unitPrice }}/ml × {{ parseCapacitySize(selectedCapacity.size) }}ml</text>
      </view>
      <view class="price-info-row">
        <text class="price-label">总价：</text>
        <text class="total-price">¥{{ totalAmount }}</text>
      </view>
    </view>

    <view v-else class="purchase-info">
      <view class="no-selection-row">
        <text class="no-selection-text">
          {{ (!wineInfo.capacities || wineInfo.capacities.length === 0) ? '暂无可选容量' : '请选择容量' }}
        </text>
      </view>
    </view>

    <view class="purchase-button">
      <up-button :disabled="!canPurchase" :loading="loading" type="primary" size="large"
        custom-style="width: 100%; height: 88rpx; font-size: 32rpx; font-weight: bold;" @click="handlePurchase">
        {{ getPayButtonText() }}
      </up-button>
    </view>
  </view>

  <!-- 实名认证弹窗 -->
  <up-modal :show="showIdVerifyModal" :title="idVerifyConfig.title" :content="idVerifyContent"
    :show-cancel-button="true" confirm-text="去认证" cancel-text="取消" @confirm="goToIdVerify" @cancel="cancelIdVerify"
    @close="cancelIdVerify"></up-modal>

  <!-- 支付确认弹窗 -->
  <up-modal :show="showPayConfirm" title="确认支付" :content="payConfirmContent" :show-cancel-button="true"
    @confirm="confirmPay" @cancel="() => showPayConfirm = false" @close="() => showPayConfirm = false"></up-modal>

  <!-- 登录授权弹窗 -->
  <AuthModal :show="showAuthModal" @loginSuccess="onLoginSuccess" />
  </view>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {onLoad, onShow} from '@dcloudio/uni-app'
import {useAuth} from '@/hooks/useAuth'
import AuthModal from '@/components/authModal/index.vue'
import DeviceApi from '@/api/device'
import {OrderApi, type OrderCreateParam} from '@/api/order'
import {checkDeviceOnline} from '@/utils/ble'

// 类型定义 - 匹配API返回的数据结构
interface DeviceInfo {
  id: string
  name: string
  location: string
  distance: string
  image: string
  status: 'online' | 'offline' | 'maintenance'
  connectionStatus?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN'
  checkResult?: string
  lastCheckTime?: string
  deviceCode: string
}

// API返回的设备数据类型
interface ApiDeviceData {
  id: string
  deviceCode: string
  name: string
  location: string
  distance: string
  image: string
  status: string
  connectionStatus?: 'ONLINE' | 'OFFLINE' | 'UNKNOWN'
  checkResult?: string
  lastCheckTime?: string
  storeInfo: {
    name: string
    hours: string
    phone: string
    address: string
  }
  wineInfo: {
    id: string
    name: string
    brand: string
    type: string
    alcoholContent: number
    image: string
    unitPrice: number
    stock: number
    capacities?: Array<{
      id: string
      size: string
      sortCode: number
    }>
  }
}

interface StoreInfo {
  name: string
  hours: string
  phone: string
  address: string
}

interface Capacity {
  id: string
  size: string
  description: string
  price: number
  stock: number
  sortCode?: number
}

interface Wine {
  id: string
  name: string
  brand: string
  type: string
  alcoholContent: number
  image: string
  unitPrice: number
  stock: number
  capacities: Capacity[]
}

interface IdVerifyConfig {
  enabled: boolean
  title: string
  content: string
  minAge: number
}

// 响应式数据
const deviceInfo = ref<DeviceInfo>({
  id: '',
  name: '',
  location: '',
  distance: '',
  image: '',
  status: 'offline',
  deviceCode: ''
})

// 页面加载状态
const pageLoading = ref(true)
const loginRequired = ref(false)

const storeInfo = ref<StoreInfo>({
  name: '',
  hours: '',
  phone: '',
  address: ''
})

const wineInfo = ref<Wine>({
  id: '',
  name: '',
  brand: '',
  type: '',
  alcoholContent: 0,
  image: '',
  unitPrice: 0,
  stock: 0,
  capacities: []
})

const selectedCapacity = ref<Capacity | null>(null)
const loading = ref(false)
const showPayConfirm = ref(false)

// 蓝牙检测相关状态
const isBluetoothChecking = ref(false)
const lastBluetoothCheckTime = ref<Date | null>(null)

// 实名认证相关 - 暂时跳过实名认证，默认所有用户都已认证
const showIdVerifyModal = ref(false)
const idVerifyConfig = ref<IdVerifyConfig>({
  enabled: false, // 暂时关闭实名认证功能
  title: '实名认证提醒',
  content: '为了保护未成年人健康成长，我们需要确认您已年满18周岁。请完成实名认证，让我们一起守护青少年的美好未来。',
  minAge: 18
})
const isIdVerified = ref(true) // 用户实名认证状态，默认已认证
const hasShownIdVerifyModal = ref(false) // 是否已显示过认证弹窗

// 认证相关
const { isLoggedIn, requireAuth, showAuthModal, handleLoginSuccess } = useAuth()

// 存储设备ID，用于登录成功后加载
const pendingDeviceId = ref<string>('')

// 总价 - 响应式数据
const totalAmount = ref(0)

// 当选择容量变化时，重新计算总价
const updateTotalAmount = () => {
  if (!selectedCapacity.value || !wineInfo.value) {
    totalAmount.value = 0
    return
  }
  
  // 解析容量数值（如 "100ml" -> 100）
  const capacityInMl = parseCapacitySize(selectedCapacity.value.size)
  const unitPrice = wineInfo.value.unitPrice || 0
  
  // 计算总价：单价(元/ml) × 容量(ml) = 总价(元)
  totalAmount.value = Number((unitPrice * capacityInMl).toFixed(2))
}

const canPurchase = computed(() => {
  // 基本条件检查：需要有酒品信息、有可选容量、已选择容量、业务状态为在线且蓝牙连接正常
  return wineInfo.value &&
      wineInfo.value.capacities &&
      wineInfo.value.capacities.length > 0 &&
      selectedCapacity.value &&
      deviceInfo.value.status === 'online' &&
      (deviceInfo.value.connectionStatus === 'ONLINE' || deviceInfo.value.connectionStatus === undefined)
})

const payConfirmContent = computed(() => {
  if (!wineInfo.value || !selectedCapacity.value) return ''
  return `${wineInfo.value.name}\n${selectedCapacity.value.size} × 1杯\n总计：¥${totalAmount.value}\n\n请准备好接酒容器`
})

const idVerifyContent = computed(() => {
  return `🛡️ ${idVerifyConfig.value.content}`
})

// 页面加载
onLoad((options) => {
  // 获取设备ID - 支持从扫码或列表页面跳转
  const deviceId = options?.deviceId || options?.id || options?.qrCode
  
  if (deviceId) {
    // 先检查登录状态，再加载设备详情
    checkAuthAndLoadDevice(deviceId)
  } else {
    uni.showToast({
      title: '设备ID缺失',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

onMounted(() => {
  // 页面加载完成后检查实名认证（只有登录用户才需要检查）
  if (isLoggedIn.value) {
    checkIdVerification()
  }
})

onShow(() => {
  // 页面显示时检查实名认证（只有登录用户才需要检查）
  if (isLoggedIn.value) {
    checkIdVerification()
  }
})

// 检查实名认证状态 - 暂时跳过，默认所有用户都已认证
const checkIdVerification = async () => {
  // 暂时跳过实名认证检查，直接设置为已认证状态
  isIdVerified.value = true


}



// 去实名认证
const goToIdVerify = () => {
  showIdVerifyModal.value = false

  // 跳转到实名认证页面
  uni.navigateTo({
    url: '/pages/user/id-verify',
    fail: (error) => {
      console.error('跳转实名认证页面失败:', error)
      // 如果页面不存在，可以使用webview方式
      uni.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent('https://example.com/id-verify')}&title=实名认证`
      })
    }
  })
}

// 取消实名认证
const cancelIdVerify = () => {
  showIdVerifyModal.value = false
}

// 处理登录成功
const onLoginSuccess = async () => {
  console.log('登录成功回调，检查是否有待处理的设备ID:', pendingDeviceId.value)
  
  // 调用原有的登录成功处理
  handleLoginSuccess()
  
  // 如果有待处理的设备ID，立即加载设备详情
  if (pendingDeviceId.value) {
    console.log('登录成功，加载待处理的设备详情:', pendingDeviceId.value)
    
    try {
      loginRequired.value = false
      pageLoading.value = true
      await loadDeviceDetail(pendingDeviceId.value)
      pendingDeviceId.value = '' // 清除待处理的设备ID
      pageLoading.value = false
    } catch (error) {
      console.error('登录成功后加载设备详情失败:', error)
      pageLoading.value = false
      uni.showToast({
        title: '加载设备信息失败',
        icon: 'none'
      })
    }
  }
}





// 检查蓝牙设备是否在线
const checkBluetoothDeviceOnline = async (deviceId: string, deviceData: ApiDeviceData) => {
  try {
    // 将设备ID转换为数字类型（蓝牙工具类需要数字ID）
    const numericDeviceId = parseInt(deviceId)
    if (isNaN(numericDeviceId)) {
      return
    }

    // 使用简化的蓝牙检查函数
    const isOnline = await checkDeviceOnline(numericDeviceId)

    // 同时更新连接状态和业务状态
    if (isOnline) {
      deviceData.connectionStatus = 'ONLINE'
      deviceData.checkResult = '刚刚检测为蓝牙在线'
      // 蓝牙在线时，设备业务状态也设为在线
      deviceData.status = 'online'
      
      // 调用后端API更新连接状态
      await DeviceApi.updateDeviceConnectionStatus(deviceData.id, 'ONLINE', '刚刚检测为蓝牙在线')
      
      // 显示设备在线提示
      uni.showToast({
        title: '设备蓝牙在线',
        icon: 'success',
        duration: 2000
      })
    } else {
      deviceData.connectionStatus = 'OFFLINE'
      deviceData.checkResult = '刚刚检测为蓝牙离线'
      // 蓝牙离线时，设备业务状态也设为离线
      deviceData.status = 'offline'
      
      // 调用后端API更新连接状态
      await DeviceApi.updateDeviceConnectionStatus(deviceData.id, 'OFFLINE', '刚刚检测为蓝牙离线')
    }

  } catch (error: any) {
    console.error('蓝牙设备检查过程中发生异常:', error)
    // 异常情况下，设置为未知状态
    deviceData.connectionStatus = 'UNKNOWN'
    deviceData.checkResult = '检测失败，请重试'
    // 检测失败时，设备业务状态设为离线（安全起见）
    deviceData.status = 'offline'
    
    try {
      await DeviceApi.updateDeviceConnectionStatus(deviceData.id, 'UNKNOWN', '检测失败，请重试')
    } catch (updateError) {
      console.error('更新设备连接状态失败:', updateError)
    }
  }
}



// 检查认证状态并加载设备详情
const checkAuthAndLoadDevice = async (deviceId: string) => {
  // 检查用户登录状态
  if (!isLoggedIn.value) {
    console.log('用户未登录，显示登录提示')
    
    // 设置登录必需状态和停止页面加载
    loginRequired.value = true
    pageLoading.value = false
    pendingDeviceId.value = deviceId
    
    // 显示登录提示
    uni.showModal({
      title: '需要登录',
      content: '查看设备详情需要先登录，是否立即登录？',
      showCancel: true,
      confirmText: '立即登录',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 尝试登录
            await requireAuth()
            
            // 如果requireAuth没有显示弹窗，手动显示
            if (!isLoggedIn.value && !showAuthModal.value) {
              showAuthModal.value = true
            }
            
            // 登录成功后加载设备详情
            if (isLoggedIn.value) {
              console.log('登录成功，开始加载设备详情')
              loginRequired.value = false
              pageLoading.value = true
              await loadDeviceDetail(deviceId)
              pendingDeviceId.value = '' // 清除待处理的设备ID
              pageLoading.value = false
            }
          } catch (error) {
            console.error('登录失败:', error)
            uni.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            })
          }
        } else {
          // 用户取消登录，返回上一页
          uni.navigateBack()
        }
      }
    })
    return
  }
  
  // 用户已登录，直接加载设备详情
  console.log('用户已登录，直接加载设备详情')
  pageLoading.value = true
  await loadDeviceDetail(deviceId)
  pageLoading.value = false
}

// 加载设备详情
const loadDeviceDetail = async (deviceId: string) => {
  try {
    // 调用后台API获取设备详情
    const deviceData = await DeviceApi.getDeviceDetail(deviceId) as unknown as ApiDeviceData

    // 检查蓝牙设备是否在线
    // await checkBluetoothDeviceOnline(deviceData.deviceCode, deviceData)

    // 设置设备信息
    deviceInfo.value = {
      id: deviceData.id,
      deviceCode: deviceData.deviceCode,
      name: deviceData.name || '智能散酒机',
      location: deviceData.location || '位置信息暂无',
      distance: deviceData.distance || '距离计算中...',
      image: deviceData.image || '/static/images/bulk_wine_device.jpg',
      status: (deviceData.status?.toLowerCase() as 'online' | 'offline' | 'maintenance') || 'offline'
    }

    // 直接使用API返回的门店信息
    if (deviceData.storeInfo) {
      storeInfo.value = {
        name: deviceData.storeInfo.name || '门店信息暂无',
        hours: deviceData.storeInfo.hours || '营业时间待更新',
        phone: deviceData.storeInfo.phone || '400-123-4567',
        address: deviceData.storeInfo.address || '地址信息暂无'
      }
    } else {
      storeInfo.value = {
        name: '门店信息暂无',
        hours: '营业时间待更新',
        phone: '400-123-4567',
        address: '地址信息暂无'
      }
    }

    // 直接使用API返回的酒品信息
    if (deviceData.wineInfo) {
      // 注意：deviceData.wineInfo.price 是某个特定容量的总价格，不是单价
      // 我们需要根据后端返回的容量配置来计算单价，或者使用默认单价
      
      // 查询真实库存
      let realStock = 0;
      try {
        realStock = await DeviceApi.getStockQuantity(deviceData.id, deviceData.wineInfo.id);
        console.log('查询到真实库存:', realStock);
      } catch (error) {
        console.error('查询库存失败，使用默认值:', error);
        realStock = 5000; // 查询失败时使用默认值
      }
      
      // 使用后台返回的容量信息（从wineInfo中获取）
      let capacities: Capacity[] = [];
      if (deviceData.wineInfo.capacities && Array.isArray(deviceData.wineInfo.capacities)) {
        capacities = deviceData.wineInfo.capacities.map((cap: any) => ({
          id: cap.id,
          size: cap.size, // 后台已经格式化为 "100ml" 这样的格式
          description: getCapacityDescription(cap.size), // 根据容量生成描述
          price: 0, // 价格将由前端实时计算，不存储固定值
          stock: realStock, // 使用真实库存
          sortCode: cap.sortCode || 0 // 排序码
                 })).sort((a: Capacity, b: Capacity) => (a.sortCode || 0) - (b.sortCode || 0)); // 按排序码排序
      }
      
      // 如果后台没有返回容量信息，不使用默认容量，保持空数组
      // 这样前端会显示"暂无可选容量"的提示
      

      
      wineInfo.value = {
        id: deviceData.wineInfo.id,
        name: deviceData.wineInfo.name || '散酒产品',
        brand: deviceData.wineInfo.brand || '品牌待更新',
        type: deviceData.wineInfo.type || '浓香型白酒',
        alcoholContent: deviceData.wineInfo.alcoholContent || 52,
        image: deviceData.wineInfo.image || '/static/images/bulk_wine.jpg',
        unitPrice: deviceData.wineInfo.unitPrice, // 显示单价
        stock: realStock, // 使用真实库存
        capacities: capacities
      }
      
      // 加载完酒品信息后，如果已选择容量，更新总价
      if (selectedCapacity.value) {
        updateTotalAmount()
      }
    } else {
      // 没有绑定酒品时的默认信息
      wineInfo.value = {
        id: 'default_wine',
        name: '暂无绑定酒品',
        brand: '待绑定',
        type: '散酒',
        alcoholContent: 0,
        image: '/static/images/bulk_wine.jpg',
        unitPrice: 0,
        stock: 0,
        capacities: []
      }
    }

  } catch (error) {
    console.error('加载设备详情失败:', error)
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })

    // 加载失败时显示错误状态
    deviceInfo.value = {
      id: deviceId,
      deviceCode: "",
      name: '设备信息加载失败',
      location: '位置信息获取失败',
      distance: '距离未知',
      image: '/static/images/bulk_wine_device.jpg',
      status: 'offline'
    }
  }
}

// 选择容量
const selectCapacity = (capacity: Capacity) => {
  selectedCapacity.value = capacity
  // 选择容量后立即更新总价
  updateTotalAmount()
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'online': '在线',
    'offline': '离线',
    'maintenance': '维护中'
  }
  return statusMap[status] || '未知'
}

const getSelectedInfo = () => {
  if (!wineInfo.value) return '酒品信息加载中'
  if (!selectedCapacity.value) return '请选择容量'
  return `${wineInfo.value.name} ${selectedCapacity.value.size} × 1杯`
}

const getPayButtonText = () => {
  if (!wineInfo.value) return '酒品信息加载中'
  
  // 检查是否有可选容量
  if (!wineInfo.value.capacities || wineInfo.value.capacities.length === 0) return '暂无可选容量'
  
  if (!selectedCapacity.value) return '请选择容量'
  
  // 🔧 暂时跳过设备状态检查，专注于调试订单流程
  // 检查业务状态
  // if (deviceInfo.value.status !== 'online') return '设备暂停营业'
  
  // 检查蓝牙连接状态
  // if (deviceInfo.value.connectionStatus === 'OFFLINE') return '设备蓝牙离线'
  // if (deviceInfo.value.connectionStatus === 'UNKNOWN') return '请检测设备连接'

  // 如果用户未登录，显示登录提示
  if (!isLoggedIn.value) return '登录购买'

  // 如果启用实名认证且用户未认证，显示认证提示
  if (idVerifyConfig.value.enabled && !isIdVerified.value) return '需要实名认证'

  return '立即购买'
}

const handlePurchase = async () => {
  // 1. 首先检查是否选择了容量等基本条件
  if (!wineInfo.value) {
    uni.showToast({ title: '酒品信息加载中', icon: 'none' })
    return
  }

  if (!selectedCapacity.value) {
    uni.showToast({ title: '请选择容量', icon: 'none' })
    return
  }

  // 🔧 暂时跳过设备检查，专注于调试订单流程
  console.log('⚠️ 设备检查已暂时跳过，专注于调试订单流程')
  
  // 强制设置设备状态为在线以便继续流程
  deviceInfo.value.status = 'online'
  deviceInfo.value.connectionStatus = 'ONLINE'
  deviceInfo.value.checkResult = '设备检查已跳过（调试模式）'

  // 直接继续购买流程，跳过所有设备检查
  continueWithPurchase()
}

// 继续购买流程（设备状态已确认在线）
const continueWithPurchase = async () => {
  // 1. 检查登录状态
  if (!isLoggedIn.value) {
    try {
      await requireAuth()

      // 如果requireAuth没有显示弹窗，手动显示
      if (!isLoggedIn.value && !showAuthModal.value) {
        showAuthModal.value = true
      }

      // 登录成功后，立即检查实名认证状态
      if (isLoggedIn.value) {
        await checkIdVerification()
      } else {
        return
      }
    } catch (error) {
      console.error('登录过程出错:', error)
      return
    }
  }

  // 2. 检查库存是否充足
  if (!wineInfo.value || !selectedCapacity.value) {
    uni.showToast({ title: '请选择容量', icon: 'none' })
    return
  }

  const requiredQuantity = parseCapacitySize(selectedCapacity.value.size)
  
  try {
    uni.showLoading({ title: '检查库存...' })
    
    const isStockSufficient = await DeviceApi.checkStockSufficient(
      deviceInfo.value.id,
      wineInfo.value.id,
      requiredQuantity
    )
    
    uni.hideLoading()
    
    if (!isStockSufficient) {
      uni.showModal({
        title: '库存不足',
        content: `当前库存不足${requiredQuantity}ml，请选择其他容量或联系门店补货`,
        showCancel: false,
        confirmText: '确定'
      })
      return
    }
    
    // 库存充足，更新显示的库存信息
    const currentStock = await DeviceApi.getStockQuantity(deviceInfo.value.id, wineInfo.value.id)
    if (wineInfo.value) {
      wineInfo.value.stock = currentStock
      // 同时更新容量选项的库存显示
      wineInfo.value.capacities = wineInfo.value.capacities.map(cap => ({
        ...cap,
        stock: currentStock
      }))
    }
    
  } catch (error) {
    uni.hideLoading()
    console.error('检查库存失败:', error)
    uni.showToast({ title: '检查库存失败，请重试', icon: 'none' })
    return
  }

  // 3. 检查实名认证状态（用户已登录的情况下）- 暂时跳过
  // 实名认证检查已跳过，直接进入下一步

  // 4. 所有条件满足，显示支付确认弹窗
  showPayConfirm.value = true
}

const confirmPay = async () => {
  if (!wineInfo.value || !selectedCapacity.value) return

  loading.value = true
  try {
    // 准备订单创建参数
    const orderCreateParam: OrderCreateParam = {
      deviceId: deviceInfo.value.id,
      wineId: wineInfo.value.id,
      amount: parseCapacitySize(selectedCapacity.value.size), // 将容量规格转换为出酒量(ml)
      unitPrice: wineInfo.value.unitPrice,
      remark: `购买${wineInfo.value.name} - ${selectedCapacity.value.description}`,
      latitude: undefined, // 如果需要位置信息，可以在这里获取
      longitude: undefined
    }

    // 调用后端API创建订单
    const orderId = await OrderApi.createOrder(orderCreateParam)

    // 关闭支付确认弹窗
    showPayConfirm.value = false

    // 显示创建成功提示
    uni.showToast({
      title: '订单创建成功',
      icon: 'success',
      duration: 2000
    })

    // 跳转到订单详情页面
    setTimeout(() => {
      uni.navigateTo({
        url: `/pages/order/detail?orderId=${orderId}`,
        fail: (error) => {
          console.error('跳转订单详情页面失败:', error)
          // 如果跳转失败，跳转到订单列表页面
          uni.navigateTo({
            url: '/pages/order/list'
          })
        }
      })
    }, 2000)

  } catch (error: any) {
    console.error('创建订单失败:', error)
    uni.showToast({
      title: error?.message || '创建订单失败',
      icon: 'none',
      duration: 3000
    })
  } finally {
    loading.value = false
  }
}

// 解析容量规格，提取数字部分（如 "100ml" -> 100）
const parseCapacitySize = (sizeStr: string): number => {
  const match = sizeStr.match(/(\d+)/)
  return match ? parseInt(match[1]) : 0
}

// 根据容量生成描述
const getCapacityDescription = (size: string): string => {
  const capacity = parseCapacitySize(size)
  if (capacity <= 100) return '小杯装'
  if (capacity <= 250) return '中杯装'
  if (capacity <= 500) return '大杯装'
  return '自带容器'
}

// 计算单价（元/ml）
const calculateUnitPrice = (totalPrice: number, amount: number): number => {
  if (amount <= 0) return 0
  return Number((totalPrice / amount).toFixed(4))
}

// 支付相关函数已移除，现在直接创建订单

const callStore = () => {
  uni.makePhoneCall({
    phoneNumber: storeInfo.value.phone
  })
}

// 手动蓝牙检测处理
const handleBluetoothCheck = async () => {
  if (isBluetoothChecking.value) {
    return
  }

  isBluetoothChecking.value = true

  try {
    // 显示检测提示
    uni.showLoading({ 
      title: '检测蓝牙连接...',
      mask: true 
    })

    const deviceId = parseInt(deviceInfo.value.deviceCode)
    if (isNaN(deviceId)) {
      throw new Error('设备ID无效')
    }

    // 使用简化的蓝牙检查函数
    const isOnline = await checkDeviceOnline(deviceId)

    // 记录检测时间
    lastBluetoothCheckTime.value = new Date()

    // 隐藏加载提示
    uni.hideLoading()

    if (isOnline) {
      deviceInfo.value.connectionStatus = 'ONLINE'
      deviceInfo.value.checkResult = '刚刚检测为蓝牙在线'
      deviceInfo.value.lastCheckTime = new Date().toISOString()
      // 蓝牙在线时，设备业务状态也设为在线
      deviceInfo.value.status = 'online'
      
      // 更新后端状态
      await DeviceApi.updateDeviceConnectionStatus(deviceInfo.value.id, 'ONLINE', '刚刚检测为蓝牙在线')
      
      uni.showToast({
        title: '设备蓝牙在线',
        icon: 'success',
        duration: 3000
      })
      
    } else {
      deviceInfo.value.connectionStatus = 'OFFLINE'
      deviceInfo.value.checkResult = '刚刚检测为蓝牙离线'
      deviceInfo.value.lastCheckTime = new Date().toISOString()
      // 蓝牙离线时，设备业务状态也设为离线
      deviceInfo.value.status = 'offline'
      
      // 更新后端状态
      await DeviceApi.updateDeviceConnectionStatus(deviceInfo.value.id, 'OFFLINE', '刚刚检测为蓝牙离线')
      
      uni.showModal({
        title: '设备蓝牙检测失败',
        content: '设备蓝牙离线或不在范围内，请确保设备已开启并在蓝牙范围内',
        showCancel: true,
        confirmText: '重试',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 用户选择重试，短暂延迟后重新检测
            setTimeout(() => {
              handleBluetoothCheck()
            }, 1000)
          }
        }
      })
    }

  } catch (error: any) {
    console.error('手动蓝牙检测异常:', error)
    
    deviceInfo.value.connectionStatus = 'UNKNOWN'
    deviceInfo.value.checkResult = '检测失败，请重试'
    deviceInfo.value.lastCheckTime = new Date().toISOString()
    // 检测失败时，设备业务状态设为离线（安全起见）
    deviceInfo.value.status = 'offline'
    
    // 尝试更新后端状态
    try {
      await DeviceApi.updateDeviceConnectionStatus(deviceInfo.value.id, 'UNKNOWN', '检测失败，请重试')
    } catch (updateError) {
      console.error('更新设备连接状态失败:', updateError)
    }
    
    uni.hideLoading()
    uni.showToast({
      title: error?.message || '检测失败',
      icon: 'none',
      duration: 2000
    })
    
  } finally {
    isBluetoothChecking.value = false
  }
}

// 获取蓝牙检测按钮图标
const getBluetoothCheckIcon = () => {
  if (isBluetoothChecking.value) {
    return 'loading'
  }
  
  switch (deviceInfo.value.connectionStatus) {
    case 'ONLINE':
      return 'checkmark-circle-fill'
    case 'OFFLINE':
      return 'close-circle-fill'
    case 'UNKNOWN':
      return 'help-circle-fill'
    default:
      return 'refresh'
  }
}

// 获取蓝牙检测按钮颜色
const getBluetoothCheckColor = () => {
  if (isBluetoothChecking.value) {
    return '#007aff'
  }
  
  switch (deviceInfo.value.connectionStatus) {
    case 'ONLINE':
      return '#52c41a'
    case 'OFFLINE':
      return '#ff4d4f'
    case 'UNKNOWN':
      return '#faad14'
    default:
      return '#999'
  }
}

// 获取蓝牙检测按钮文本
const getBluetoothCheckText = () => {
  if (isBluetoothChecking.value) {
    return '检测中...'
  }
  
  // 优先使用后端返回的检测结果
  if (deviceInfo.value.checkResult) {
    return deviceInfo.value.checkResult
  }
  
  // 如果有最后检测时间，计算时间差
  const checkTime = deviceInfo.value.lastCheckTime ? new Date(deviceInfo.value.lastCheckTime) : lastBluetoothCheckTime.value
  if (checkTime) {
    const now = new Date()
    const timeDiff = Math.floor((now.getTime() - checkTime.getTime()) / 1000)
    if (timeDiff < 30) {
      return `${timeDiff}秒前检测`
    } else if (timeDiff < 60) {
      return '刚刚检测'
    } else if (timeDiff < 300) { // 5分钟
      return `${Math.floor(timeDiff / 60)}分钟前检测`
    } else {
      return '点击重新检测'
    }
  }
  
  return '点击检测'
}
</script>

<style lang="scss" scoped>
.device-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 280rpx;
}

.wine-hero-card {
  background: white;
  padding: 40rpx 24rpx;
  margin-bottom: 16rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);

  .wine-hero-content {
    display: flex;
    gap: 32rpx;
    align-items: flex-start;
  }

  .wine-hero-image {
    width: 180rpx;
    height: 180rpx;
    border-radius: 16rpx;
    flex-shrink: 0;
  }

  .wine-hero-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .wine-name-section {
    .wine-hero-name {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      line-height: 1.4;
      display: block;
      margin-bottom: 8rpx;
    }

    .wine-hero-brand {
      font-size: 30rpx;
      color: #666;
      line-height: 1.3;
      display: block;
    }
  }

  .wine-details-section {
    .wine-type {
      font-size: 26rpx;
      color: #999;
      line-height: 1.3;
      display: block;
      margin-bottom: 12rpx;
    }

    .wine-status-row {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 12rpx;

      .stock-text {
        font-size: 26rpx;
        color: #666;
      }

      .stock-status {
        padding: 8rpx 16rpx;
        border-radius: 24rpx;
        font-size: 24rpx;
        font-weight: 500;

        &.in-stock {
          background: #f6ffed;
          color: #52c41a;
          border: 1rpx solid #b7eb8f;
        }

        &.out-stock {
          background: #fff2f0;
          color: #ff4d4f;
          border: 1rpx solid #ffb3b3;
        }
      }
    }

    .wine-price {
      font-size: 28rpx;
      color: #ff4d4f;
      font-weight: bold;
      display: block;
    }
  }
}

.capacity-selection-card {
  background: white;
  margin: 16rpx 24rpx;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .card-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 32rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #f5f5f5;

    .card-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
}

.capacity-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;

  .capacity-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12rpx 12rpx;
    border: 2rpx solid #f0f0f0;
    border-radius: 16rpx;
    background: #fff;
    transition: all 0.2s ease;
    min-height: 80rpx;

    &.selected {
      border-color: #007aff;
      background: #f0f8ff;
      box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.15);
    }

    .capacity-size {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
      line-height: 1;
      text-align: center;
    }
  }
}

.capacity-tips {
  text-align: center;

  .tips-text {
    font-size: 24rpx;
    color: #999;
    line-height: 1.3;
  }
}

.no-capacity-available {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 32rpx;
  text-align: center;
  
  .no-capacity-text {
    font-size: 28rpx;
    color: #666;
    font-weight: 500;
    margin: 16rpx 0 8rpx;
  }
  
  .no-capacity-desc {
    font-size: 24rpx;
    color: #999;
    line-height: 1.4;
  }
}

.device-info-card,
.store-info-card {
  background: white;
  margin: 16rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.03);

  .card-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 20rpx;
    padding-bottom: 12rpx;
    border-bottom: 1rpx solid #f8f8f8;

    .card-title {
      font-size: 28rpx;
      font-weight: 500;
      color: #666;

      &.secondary {
        color: #999;
      }
    }

    .device-status-mini {
      margin-left: auto;
      padding: 4rpx 12rpx;
      border-radius: 16rpx;
      font-size: 20rpx;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;

      &:active {
        opacity: 0.8;
        transform: scale(0.95);
      }

      &.online {
        background: #52c41a;
        
        &:hover {
          background: #73d13d;
        }
      }

      &.offline {
        background: #ff4d4f;
        
        &:hover {
          background: #ff7875;
        }
      }

      &.maintenance {
        background: #faad14;
        
        &:hover {
          background: #ffc53d;
        }
      }
    }
  }
}

.device-simple-info {
  .device-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    .device-item {
      display: flex;
      align-items: center;
      gap: 8rpx;
      flex: 1;
    }

    .device-name-simple {
      font-size: 26rpx;
      color: #333;
      font-weight: 500;
    }

    .device-location-simple {
      font-size: 24rpx;
      color: #666;
    }

    .bluetooth-check-button {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      background: #f8f8f8;
      border: 1rpx solid #e8e8e8;
      transition: all 0.3s ease;
      cursor: pointer;
      min-width: 140rpx;
      justify-content: center;

      &:active {
        opacity: 0.7;
        transform: scale(0.95);
      }

      &.checking {
        background: #e6f3ff;
        border-color: #91d5ff;
        
        .bluetooth-check-text {
          color: #007aff;
        }
      }

      .bluetooth-check-text {
        font-size: 22rpx;
        color: #666;
        font-weight: 500;
        white-space: nowrap;
      }
    }
  }

  .device-distance-row {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .device-distance-simple {
      font-size: 22rpx;
      color: #999;
    }
  }
}

.store-simple-details {
  .store-main-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16rpx;

    .store-item {
      display: flex;
      align-items: center;
      gap: 8rpx;
      flex: 1;

      &:first-child {
        margin-right: 16rpx;
      }

      &.phone-item {
        justify-content: flex-end;
        cursor: pointer;
        transition: opacity 0.2s ease;

        &:active {
          opacity: 0.7;
        }
      }

      &:last-child {
        cursor: pointer;
        transition: opacity 0.2s ease;

        &:active {
          opacity: 0.7;
        }
      }
    }

    .store-name-simple {
      font-size: 26rpx;
      color: #333;
      font-weight: 500;
    }

    .store-phone-simple {
      font-size: 24rpx;
      color: #007aff;
    }
  }

  .store-hours-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 12rpx;

    .store-hours-simple {
      font-size: 24rpx;
      color: #666;
    }
  }

  .store-address-row {
    display: flex;
    align-items: flex-start;
    gap: 8rpx;

    .store-address-simple {
      font-size: 22rpx;
      color: #999;
      line-height: 1.4;
      flex: 1;
    }
  }
}

.purchase-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 24rpx 30rpx 34rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
  border-top: 1rpx solid #f0f0f0;

  .purchase-info {
    margin-bottom: 20rpx;

    .capacity-info-row {
      margin-bottom: 8rpx;

      .capacity-text {
        font-size: 28rpx;
        color: #333;
        line-height: 1.3;
        font-weight: 500;
      }
    }

    .price-calculation-row {
      margin-bottom: 8rpx;

      .price-calculation {
        font-size: 24rpx;
        color: #666;
        line-height: 1.3;
      }
    }

    .price-info-row {
      display: flex;
      align-items: baseline;
      gap: 8rpx;

      .price-label {
        font-size: 28rpx;
        color: #666;
        font-weight: 400;
      }

      .total-price {
        font-size: 36rpx;
        font-weight: bold;
        color: #ff4d4f;
        line-height: 1;
      }
    }

    .no-selection-row {
      text-align: center;
      padding: 16rpx 0;

      .no-selection-text {
        font-size: 28rpx;
        color: #999;
        line-height: 1.3;
      }
    }
  }

  .purchase-button {
    width: 100%;
  }
  }
  </style>