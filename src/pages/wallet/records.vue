<template>
  <view class="records-page">
    <!-- 筛选tabs -->
    <view class="tabs-container">
      <up-tabs 
        :list="filterTabsList" 
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

    <!-- 页面内容 -->
    <view class="page-content">
      <!-- 筛选条件 -->
      <view class="filter-section">
        <view class="filter-controls">
          <view class="date-filter" @click="showDatePicker">
            <up-icon name="calendar" size="16" color="#52c41a"></up-icon>
            <text class="filter-text">{{ currentDateText }}</text>
            <up-icon name="arrow-down" size="12" color="#52c41a"></up-icon>
          </view>
        </view>
      </view>

      <!-- 统计信息 -->
      <view class="stats-summary">
        <view class="summary-item">
          <view class="summary-label">收入总额</view>
          <view class="summary-value income">+¥{{ formatMoney(summaryData.totalIncome) }}</view>
        </view>
        <view class="summary-item">
          <view class="summary-label">支出总额</view>
          <view class="summary-value expense">-¥{{ formatMoney(summaryData.totalExpense) }}</view>
        </view>
        <view class="summary-item">
          <view class="summary-label">净收益</view>
          <view class="summary-value" :class="summaryData.netAmount >= 0 ? 'income' : 'expense'">
            {{ summaryData.netAmount >= 0 ? '+' : '' }}¥{{ formatMoney(summaryData.netAmount) }}
          </view>
        </view>
      </view>

      <!-- 交易记录列表 -->
      <view class="records-list">
        <view v-if="loading" class="loading-state">
          <text>加载中...</text>
        </view>
        
        <EmptyState 
          v-else-if="filteredRecords.length === 0"
          type="transaction"
        />
        
        <view v-else>
          <!-- 按日期分组显示 -->
          <view v-for="group in groupedRecords" :key="group.date" class="date-group">
            <view class="date-header">
              <text class="date-text">{{ group.date }}</text>
              <text class="date-summary">{{ group.count }}笔</text>
            </view>
            
            <view class="records-container">
              <view 
                v-for="record in group.records" 
                :key="record.id"
                class="record-item"
                @click="viewRecordDetail(record)"
              >
                <view class="record-icon" :class="flowTypeMap[record.flowType]?.type || 'default'">
                  <up-icon :name="getRecordIcon(record.flowType)" size="20" :color="getRecordIconColor(record.flowType)"></up-icon>
                </view>
                
                <view class="record-info">
                  <view class="record-title">{{ getFlowTypeText(record.flowType) }}</view>
                  <view class="record-desc">{{ record.description }}</view>
                  <view class="record-time">{{ formatTime(record.createTime) }}</view>
                </view>
                
                <view class="record-amount-section">
                  <view class="record-amount" :class="flowTypeMap[record.flowType]?.type || 'default'">
                    {{ getAmountPrefix(record.flowType) }}¥{{ formatMoney(record.amount) }}
                  </view>
                  <view class="record-status" :class="record.status.toLowerCase()">
                    {{ getStatusText(record.status) }}
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
        <text>加载更多</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/hooks'
import { StatusBar, EmptyState } from '@/components'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { WalletApi, type AccountFlowRecord, type FlowStatistics } from '@/api/wallet'

// 使用认证系统
const { isLoggedIn, userInfo, requireAuth } = useAuth()

// 响应式数据
const loading = ref(false)
const currentFilter = ref('all')
const currentDateRange = ref('month')
const records = ref<AccountFlowRecord[]>([])
const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(20)
const statisticsData = ref<FlowStatistics>({
  totalIncome: 0,
  totalExpense: 0,
  netAmount: 0,
  todayIncome: 0,
  todayExpense: 0,
  monthIncome: 0,
  monthExpense: 0
})

// 筛选选项
const filterTabs = ref([
  { label: '全部', value: 'all' },
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' },
  { label: '提现', value: 'withdraw' }
])

// up-tabs需要的数据格式
const filterTabsList = computed(() => {
  return filterTabs.value.map(tab => ({ name: tab.label }))
})

// 当前选中的tab索引
const currentTabIndex = computed(() => {
  return filterTabs.value.findIndex(tab => tab.value === currentFilter.value)
})

// 日期筛选选项
const dateRanges = ref([
  { label: '本月', value: 'month' },
  { label: '最近3个月', value: '3months' },
  { label: '最近6个月', value: '6months' },
  { label: '全部', value: 'all' }
])

// 流水类型映射
const flowTypeMap: Record<string, { label: string; type: 'income' | 'expense' }> = {
  'COMMISSION': { label: '佣金收入', type: 'income' },
  'WITHDRAW': { label: '提现支出', type: 'expense' },
  'REFUND': { label: '退款', type: 'income' },
  'TRANSFER': { label: '转账', type: 'expense' },
  'ADJUST': { label: '余额调整', type: 'income' }
}

// 页面加载
onLoad(async () => {
  console.log('📊 交易记录页面加载，当前登录状态:', isLoggedIn.value)
  
  if (!isLoggedIn.value) {
    // 如果未登录，显示登录提示并返回
    uni.showModal({
      title: '需要登录',
      content: '请先登录后再查看交易记录',
      showCancel: false,
      success: () => {
        uni.navigateBack()
      }
    })
  }
})

onMounted(async () => {
  if (isLoggedIn.value) {
    await loadRecords()
  }
})

// 触底加载更多
onReachBottom(() => {
  if (hasMore.value && !loading.value) {
    loadMore()
  }
})

// 计算属性
const currentDateText = computed(() => {
  const range = dateRanges.value.find(r => r.value === currentDateRange.value)
  return range ? range.label : '本月'
})

const filteredRecords = computed(() => {
  let filtered = records.value
  
  // 按类型筛选
  if (currentFilter.value !== 'all') {
    if (currentFilter.value === 'expense') {
      filtered = filtered.filter(r => {
        const typeInfo = flowTypeMap[r.flowType]
        return typeInfo?.type === 'expense'
      })
    } else if (currentFilter.value === 'income') {
      filtered = filtered.filter(r => {
        const typeInfo = flowTypeMap[r.flowType]
        return typeInfo?.type === 'income'
      })
    } else if (currentFilter.value === 'withdraw') {
      filtered = filtered.filter(r => r.flowType === 'WITHDRAW')
    }
  }
  
  return filtered
})

const groupedRecords = computed(() => {
  const groups: { [key: string]: any[] } = {}
  
  filteredRecords.value.forEach(record => {
    const date = formatDate(record.createTime)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(record)
  })
  
  return Object.keys(groups)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map(date => ({
      date,
      count: groups[date].length,
      records: groups[date].sort((a, b) => 
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      )
    }))
})

const summaryData = computed(() => {
  const income = filteredRecords.value
    .filter(r => {
      const typeInfo = flowTypeMap[r.flowType]
      return typeInfo?.type === 'income'
    })
    .reduce((sum, r) => sum + r.amount, 0)
  
  const expense = filteredRecords.value
    .filter(r => {
      const typeInfo = flowTypeMap[r.flowType]
      return typeInfo?.type === 'expense'
    })
    .reduce((sum, r) => sum + r.amount, 0)
  
  return {
    totalIncome: income,
    totalExpense: expense,
    netAmount: income - expense
  }
})

/**
 * 加载交易记录
 */
const loadRecords = async (reset = true) => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    if (reset) {
      page.value = 1
      records.value = []
    }
    
    // 构建查询参数
    const params = {
      pageNum: page.value,
      pageSize: pageSize.value,
      flowType: currentFilter.value === 'withdraw' ? 'WITHDRAW' : undefined,
      sortField: 'createTime',
      sortOrder: 'DESC'
    }
    
    // 调用API获取交易记录和统计数据
    const [recordsResult, statisticsResult] = await Promise.all([
      WalletApi.getFlowRecords(params),
      WalletApi.getFlowStatistics()
    ])
    
    if (reset) {
      records.value = recordsResult.records
    } else {
      records.value.push(...recordsResult.records)
    }
    
    // 更新统计数据
    statisticsData.value = statisticsResult
    
    hasMore.value = recordsResult.records.length === pageSize.value
    
    console.log('📊 交易记录加载成功:', {
      total: recordsResult.total,
      records: recordsResult.records.length,
      hasMore: hasMore.value
    })
    
  } catch (error) {
    console.error('加载交易记录失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 切换筛选条件
 */
const switchFilter = async (filterValue: string) => {
  if (currentFilter.value === filterValue) return
  
  currentFilter.value = filterValue
  await loadRecords(true)
}

/**
 * 处理tab点击事件
 */
const handleTabChange = async (item: any, index: number) => {
  const filterValue = filterTabs.value[index]?.value
  if (filterValue) {
    await switchFilter(filterValue)
  }
}

/**
 * 显示日期选择器
 */
const showDatePicker = () => {
  uni.showActionSheet({
    itemList: dateRanges.value.map(r => r.label),
    success: async (res) => {
      const selectedRange = dateRanges.value[res.tapIndex]
      if (selectedRange && currentDateRange.value !== selectedRange.value) {
        currentDateRange.value = selectedRange.value
        await loadRecords(true)
      }
    }
  })
}

/**
 * 加载更多
 */
const loadMore = async () => {
  page.value++
  await loadRecords(false)
}

/**
 * 查看记录详情
 */
const viewRecordDetail = (record: any) => {
  uni.navigateTo({
    url: `/pages/wallet/record-detail?id=${record.id}`
  })
}

/**
 * 格式化金额
 */
const formatMoney = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toFixed(2)
}

/**
 * 格式化日期
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  
  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    })
  }
}

/**
 * 格式化时间
 */
const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 获取记录图标
 */
const getRecordIcon = (flowType: string): string => {
  switch (flowType) {
    case 'COMMISSION':
      return 'plus-circle-fill'
    case 'WITHDRAW':
      return 'rmb-circle-fill'
    case 'REFUND':
      return 'reload'
    case 'TRANSFER':
      return 'swap'
    case 'ADJUST':
      return 'edit-pen-fill'
    default:
      return 'account-fill'
  }
}

/**
 * 获取记录图标颜色
 */
const getRecordIconColor = (flowType: string): string => {
  const typeInfo = flowTypeMap[flowType]
  if (typeInfo?.type === 'income') {
    return '#52c41a'
  } else if (typeInfo?.type === 'expense') {
    return '#ff4d4f'
  }
  return '#666666'
}

/**
 * 获取金额前缀
 */
const getAmountPrefix = (flowType: string): string => {
  const typeInfo = flowTypeMap[flowType]
  return typeInfo?.type === 'income' ? '+' : '-'
}

/**
 * 获取流水类型显示文本
 */
const getFlowTypeText = (flowType: string): string => {
  return flowTypeMap[flowType]?.label || flowType
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
      return '成功'
    case 'PENDING':
      return '处理中'
    case 'FAILED':
      return '失败'
    case 'CANCELLED':
      return '已取消'
    default:
      return status || '未知'
  }
}

/**
 * 返回上一页
 */
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.records-page {
  min-height: 100vh;
  background: #f8f8f8;
  margin: 0;
  padding: 0;
}

.tabs-container {
  background: white;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
  margin: 0;
  padding: 0;
  
  /* 确保tabs平均分配宽度 */
  :deep(.u-tabs__wrapper__scroll-view) {
    width: 100% !important;
  }
  
  :deep(.u-tabs__wrapper__scroll-view__content) {
    width: 100% !important;
    display: flex !important;
  }
  
  :deep(.u-tabs__wrapper__nav__item) {
    flex: 1 !important;
    text-align: center !important;
  }
}

.page-content {
  padding-top: 20rpx;
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
    
    .back-icon {
      font-size: 36rpx;
      color: #333;
    }
  }
  
  .nav-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
  
  .nav-placeholder {
    width: 80rpx;
  }
}

.filter-section {
  background: white;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  .filter-controls {
    .date-filter {
      display: flex;
      align-items: center;
      padding: 16rpx 24rpx;
      background: #f6ffed;
      border-radius: 40rpx;
      border: 1rpx solid #b7eb8f;
      width: fit-content;
      
      .filter-text {
        font-size: 28rpx;
        color: #52c41a;
        margin: 0 12rpx;
      }
    }
  }
  
  .filter-tabs {
    display: flex;
    
    .filter-tab {
      flex: 1;
      text-align: center;
      padding: 16rpx 0;
      font-size: 28rpx;
      color: #666;
      border-bottom: 3rpx solid transparent;
      transition: all 0.3s ease;
      
      &.active {
        color: #52c41a;
        border-bottom-color: #52c41a;
        font-weight: 600;
      }
    }
  }

}

.stats-summary {
  background: white;
  margin: 20rpx 20rpx 20rpx 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .summary-item {
    text-align: center;
    
    .summary-label {
      font-size: 24rpx;
      color: #666;
      margin-bottom: 8rpx;
    }
    
    .summary-value {
      font-size: 32rpx;
      font-weight: bold;
      
      &.income {
        color: #52c41a;
      }
      
      &.expense {
        color: #ff4d4f;
      }
    }
  }
}

.records-list {
  .loading-state {
    text-align: center;
    padding: 80rpx 40rpx;
    
    text {
      font-size: 28rpx;
      color: #999;
    }
  }
  

  
  .date-group {
    margin-bottom: 20rpx;
    
    .date-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx 40rpx;
      background: #f8f8f8;
      
      .date-text {
        font-size: 28rpx;
        color: #333;
        font-weight: 600;
      }
      
      .date-summary {
        font-size: 24rpx;
        color: #666;
      }
    }
    
    .records-container {
      background: white;
      
      .record-item {
        display: flex;
        align-items: center;
        padding: 30rpx 40rpx;
        border-bottom: 1rpx solid #f0f0f0;
        transition: background-color 0.3s ease;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:active {
          background-color: #f8f8f8;
        }
        
        .record-icon {
          width: 80rpx;
          height: 80rpx;
          border-radius: 40rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 24rpx;
          flex-shrink: 0;
          
          &.income {
            background: rgba(82, 196, 26, 0.1);
          }
          
          &.withdraw {
            background: rgba(24, 144, 255, 0.1);
          }
          
          &.expense {
            background: rgba(255, 77, 79, 0.1);
          }
          
          &.refund {
            background: rgba(250, 140, 22, 0.1);
          }
        }
        
        .record-info {
          flex: 1;
          
          .record-title {
            font-size: 30rpx;
            color: #333;
            margin-bottom: 8rpx;
            font-weight: 500;
          }
          
          .record-desc {
            font-size: 24rpx;
            color: #999;
            margin-bottom: 8rpx;
          }
          
          .record-time {
            font-size: 24rpx;
            color: #ccc;
          }
        }
        
        .record-amount-section {
          text-align: right;
          
          .record-amount {
            font-size: 32rpx;
            font-weight: bold;
            margin-bottom: 8rpx;
            
            &.income {
              color: #52c41a;
            }
            
            &.withdraw,
            &.expense {
              color: #ff4d4f;
            }
          }
          
          .record-status {
            font-size: 22rpx;
            padding: 4rpx 12rpx;
            border-radius: 12rpx;
            
            &.success {
              background: #f6ffed;
              color: #52c41a;
            }
            
            &.pending {
              background: #fff7e6;
              color: #fa8c16;
            }
            
            &.processing {
              background: #fff7e6;
              color: #fa8c16;
            }
            
            &.failed {
              background: #fff1f0;
              color: #ff4d4f;
            }
            
            &.cancelled {
              background: #f5f5f5;
              color: #999;
            }
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