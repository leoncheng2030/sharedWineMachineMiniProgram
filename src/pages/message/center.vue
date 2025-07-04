<template>
  <view class="message-center-page">
    <!-- 消息类型筛选 -->
    <view class="tabs-container">
      <up-tabs 
        :list="tabList" 
        :current="currentTabIndex" 
        @change="handleTabChange"
        :scrollable="false"
        lineColor="#007aff"
        lineHeight="2"
        lineWidth="40"
        activeColor="#007aff"
        inactiveColor="#666"
        gutter="20"
        height="88"
        fontSize="26"
        :itemStyle="{ padding: '0 15rpx', height: '88rpx', margin: 0 }"
        :style="{ margin: 0, padding: 0 }"
      ></up-tabs>
    </view>

    <!-- 操作栏 -->
    <view class="action-bar">
      <view class="left-actions">
        <up-checkbox-group v-model="selectAllValue" @change="toggleSelectAll">
          <up-checkbox
            name="selectAll"
            activeColor="#007aff"
            iconSize="16"
            labelSize="14"
          >
            全选
          </up-checkbox>
        </up-checkbox-group>
      </view>
      <view class="right-actions">
        <up-button 
          type="primary" 
          size="mini" 
          :disabled="selectedMessages.length === 0"
          @click="markAllAsRead"
        >
          标记已读
        </up-button>
        <up-button 
          type="error" 
          size="mini" 
          :disabled="selectedMessages.length === 0"
          @click="deleteSelected"
        >
          删除
        </up-button>
      </view>
    </view>

    <!-- 消息列表 -->
    <view class="message-list">
      <view v-if="messageList.length === 0" class="empty-state">
        <image src="/static/images/暂无数据.svg" class="empty-icon" mode="aspectFit" />
        <text class="empty-text">暂无消息</text>
      </view>
      
      <up-checkbox-group v-else v-model="selectedMessages" @change="handleMessageSelectionChange">
        <view 
          class="message-item" 
          :class="{ 
            unread: !message.isRead, 
            selected: selectedMessages.includes(message.id) 
          }"
          v-for="message in messageList" 
          :key="message.id"
          @click="handleMessageClick(message)"
        >
          <!-- 选择框 -->
          <view class="message-checkbox" @click.stop="toggleMessageSelect(message.id)">
            <up-checkbox
              :name="message.id"
              activeColor="#007aff"
              iconSize="16"
            />
          </view>
          <!-- 消息内容 -->
          <view class="message-content">
            <view class="message-header">
              <text class="message-title">{{ message.title }}</text>
              <text class="message-time">{{ formatTime(message.createTime) }}</text>
            </view>
            <text class="message-summary">{{ message.content }}</text>
            <view v-if="message.extra" class="message-extra">
              <text class="extra-text">{{ message.extra }}</text>
            </view>
          </view>


        </view>
      </up-checkbox-group>
    </view>

    <!-- 加载更多 -->
    <view v-if="hasMore" class="load-more">
      <up-button 
        type="info" 
        fill="none" 
        size="normal"
        :loading="loading"
        @click="loadMore"
      >
        {{ loading ? '加载中...' : '加载更多' }}
      </up-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Message {
  id: string
  type: 'system' | 'order' | 'activity' | 'notice'
  title: string
  content: string
  extra?: string
  isRead: boolean
  createTime: string
}

// 状态数据
const activeTab = ref('all')
const messageList = ref<Message[]>([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const selectedMessages = ref<string[]>([])
const currentTabIndex = ref(0)
const selectAllValue = ref<string[]>([])


// 标签列表
const tabList = ref([
  { name: '全部', key: 'all', unreadCount: 0 },
  { name: '系统消息', key: 'system', unreadCount: 0 },
  { name: '订单消息', key: 'order', unreadCount: 0 },
  { name: '活动推送', key: 'activity', unreadCount: 0 },
  { name: '公告通知', key: 'notice', unreadCount: 0 }
])

// 计算属性
const isSelectAll = computed(() => {
  return messageList.value.length > 0 && selectedMessages.value.length === messageList.value.length
})

const isSelectAllChecked = computed({
  get: () => isSelectAll.value,
  set: (value: boolean) => {
    // 这个setter在change事件中会被调用
  }
})

onMounted(() => {
  // 设置导航栏标题
  uni.setNavigationBarTitle({
    title: '消息中心'
  })
  
  // 加载消息列表
  loadMessageList()
  
  // 延迟设置当前标签索引，确保组件完全初始化
  setTimeout(() => {
    const index = tabList.value.findIndex(item => item.key === activeTab.value)
    if (index !== -1) {
      currentTabIndex.value = index
    }
  }, 100)
})

/**
 * 加载消息列表
 */
const loadMessageList = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    const mockMessages: Message[] = [
      {
        id: '1',
        type: 'system',
        title: '系统维护通知',
        content: '系统将于今晚23:00-01:00进行维护升级，期间可能影响部分功能使用，请提前做好准备。',
        isRead: false,
        createTime: '2024-12-28 15:30:00'
      },
      {
        id: '2',
        type: 'order',
        title: '订单支付成功',
        content: '您的订单WQS202412280001已支付成功，请及时到设备取酒。',
        extra: '订单金额：¥158.00',
        isRead: false,
        createTime: '2024-12-28 14:20:00'
      },
      {
        id: '3',
        type: 'activity',
        title: '新人专享活动',
        content: '新用户注册即送50元优惠券，首次购买还可享受8折优惠！',
        extra: '活动截止：2024-12-31',
        isRead: true,
        createTime: '2024-12-28 10:15:00'
      },
      {
        id: '4',
        type: 'order',
        title: '取酒提醒',
        content: '您的订单商品已准备就绪，请在24小时内到设备取酒，过期将自动退款。',
        extra: '设备位置：北京市朝阳区望京SOHO',
        isRead: true,
        createTime: '2024-12-27 18:45:00'
      },
      {
        id: '5',
        type: 'notice',
        title: '服务协议更新',
        content: '我们已更新《用户服务协议》和《隐私政策》，请及时查看相关条款变更。',
        isRead: false,
        createTime: '2024-12-27 16:30:00'
      },
      {
        id: '6',
        type: 'system',
        title: '账户安全提醒',
        content: '检测到您的账户在新设备上登录，如非本人操作请及时修改密码。',
        extra: '登录时间：2024-12-27 14:20',
        isRead: true,
        createTime: '2024-12-27 14:25:00'
      }
    ]
    
    // 根据当前标签筛选数据
    console.log('当前消息类型:', activeTab.value)
    const filteredMessages = activeTab.value === 'all' 
      ? mockMessages 
      : mockMessages.filter(message => message.type === activeTab.value)
    
    console.log('筛选后消息数量:', filteredMessages.length, '原始数量:', mockMessages.length)
    
    if (page.value === 1) {
      messageList.value = filteredMessages
    } else {
      messageList.value.push(...filteredMessages)
    }
    
    // 更新标签未读计数
    updateTabUnreadCount(mockMessages)
    
    // 模拟分页
    hasMore.value = page.value < 2
    
  } catch (error) {
    console.error('加载消息列表失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 更新标签未读计数
 */
const updateTabUnreadCount = (messages: Message[]) => {
  tabList.value.forEach(tab => {
    if (tab.key === 'all') {
      tab.unreadCount = messages.filter(msg => !msg.isRead).length
    } else {
      tab.unreadCount = messages.filter(msg => msg.type === tab.key && !msg.isRead).length
    }
  })
}

/**
 * 处理标签页切换
 */
const handleTabChange = (index: number) => {
  try {
    console.log('消息中心标签切换:', index, tabList.value[index])
    if (index >= 0 && index < tabList.value.length) {
      currentTabIndex.value = index
      const tabKey = tabList.value[index].key
      console.log('切换到类型:', tabKey)
      activeTab.value = tabKey
      page.value = 1
      hasMore.value = true
      selectedMessages.value = []
      loadMessageList()
    }
  } catch (error) {
    console.error('标签页切换错误:', error)
  }
}

/**
 * 切换标签
 */
const switchTab = (tabKey: string) => {
  if (activeTab.value === tabKey) return
  
  activeTab.value = tabKey
  const index = tabList.value.findIndex(item => item.key === tabKey)
  if (index !== -1) {
    currentTabIndex.value = index
  }
  page.value = 1
  hasMore.value = true
  selectedMessages.value = []
  loadMessageList()
}

/**
 * 加载更多
 */
const loadMore = () => {
  if (loading.value || !hasMore.value) return
  
  page.value++
  loadMessageList()
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
 * 获取消息类型样式类
 */
const getMessageTypeClass = (type: string): string => {
  const classMap: Record<string, string> = {
    system: 'type-system',
    order: 'type-order',
    activity: 'type-activity',
    notice: 'type-notice'
  }
  return classMap[type] || 'type-system'
}

/**
 * 获取消息图标
 */
const getMessageIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    system: 'setting',
    order: 'bag',
    activity: 'gift',
    notice: 'bell'
  }
  return iconMap[type] || 'bell'
}

/**
 * 处理消息点击
 */
const handleMessageClick = (message: Message) => {
  // 标记为已读
  if (!message.isRead) {
    message.isRead = true
    updateTabUnreadCount(messageList.value)
  }
  
  // 跳转到消息详情页面或执行相关操作
  if (message.type === 'order') {
    // 订单消息跳转到订单详情
    uni.navigateTo({
      url: '/pages/order/detail',
      fail: () => {
        uni.showToast({
          title: '功能开发中',
          icon: 'none'
        })
      }
    })
  } else {
    // 其他消息显示详情弹窗
    uni.showModal({
      title: message.title,
      content: message.content,
      showCancel: false,
      confirmText: '知道了'
    })
  }
}

/**
 * 处理消息选择变化
 */
const handleMessageSelectionChange = (selectedIds: string[]) => {
  selectedMessages.value = selectedIds
}

/**
 * 切换消息选择状态
 */
const toggleMessageSelect = (messageId: string) => {
  const isSelected = selectedMessages.value.includes(messageId)
  const index = selectedMessages.value.indexOf(messageId)
  
  if (isSelected) {
    selectedMessages.value.splice(index, 1)
  } else {
    selectedMessages.value.push(messageId)
  }
}

/**
 * 切换全选状态
 */
const toggleSelectAll = () => {
  if (isSelectAll.value) {
    // 取消全选
    selectedMessages.value = []
  } else {
    // 全选
    selectedMessages.value = messageList.value.map(msg => msg.id)
  }
}

/**
 * 标记已读
 */
const markAllAsRead = () => {
  if (selectedMessages.value.length === 0) return
  
  messageList.value.forEach(message => {
    if (selectedMessages.value.includes(message.id)) {
      message.isRead = true
    }
  })
  
  updateTabUnreadCount(messageList.value)
  selectedMessages.value = []
  
  uni.showToast({
    title: '已标记为已读',
    icon: 'success'
  })
}

/**
 * 删除选中消息
 */
const deleteSelected = () => {
  if (selectedMessages.value.length === 0) return
  
  uni.showModal({
    title: '确认删除',
    content: `确定要删除选中的${selectedMessages.value.length}条消息吗？`,
    confirmColor: '#ff4757',
    success: (res) => {
      if (res.confirm) {
        // 删除选中的消息
        messageList.value = messageList.value.filter(
          message => !selectedMessages.value.includes(message.id)
        )
        
        updateTabUnreadCount(messageList.value)
        selectedMessages.value = []
        
        uni.showToast({
          title: '删除成功',
          icon: 'success'
        })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.message-center-page {
  min-height: 100vh;
  background: #f5f5f5;
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
}

.action-bar {
  background: white;
  padding: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
  
  .left-actions {
    display: flex;
    align-items: center;
  }
  
  .right-actions {
    display: flex;
    gap: 20rpx;
    align-items: center;
  }
}

.message-list {
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
  }
}

.message-item {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  position: relative;
  
  &.unread {
    border-left: 6rpx solid #007aff;
    
    .message-content .message-title {
      font-weight: bold;
    }
  }
  
  &.selected {
    background: #f0f8ff;
    border-color: #007aff;
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  .message-checkbox {
    flex-shrink: 0;
    padding: 4rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .message-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    &.type-system {
      background: #007aff;
    }
    
    &.type-order {
      background: #52c41a;
    }
    
    &.type-activity {
      background: #ff9500;
    }
    
    &.type-notice {
      background: #ff4757;
    }
  }
  
  .message-content {
    flex: 1;
    
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12rpx;
      
      .message-title {
        font-size: 30rpx;
        color: #333;
        line-height: 1.4;
        flex: 1;
        margin-right: 20rpx;
      }
      
      .message-time {
        font-size: 24rpx;
        color: #999;
        flex-shrink: 0;
      }
    }
    
    .message-summary {
      font-size: 26rpx;
      color: #666;
      line-height: 1.5;
      margin-bottom: 8rpx;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
    
    .message-extra {
      .extra-text {
        font-size: 24rpx;
        color: #007aff;
        background: #f0f8ff;
        padding: 6rpx 12rpx;
        border-radius: 12rpx;
        display: inline-block;
      }
    }
  }
  

}

.load-more {
  text-align: center;
  padding: 40rpx;
}
</style> 