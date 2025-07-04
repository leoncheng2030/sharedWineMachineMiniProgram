<template>
  <view class="withdraw-page">
    <!-- 账户余额信息 -->
    <view class="balance-info">
      <view class="balance-card">
        <view class="balance-label">可提现余额</view>
        <view class="balance-amount">¥{{ formatMoney(userInfo?.availableBalance) }}</view>
        <view class="balance-tip">冻结余额：¥{{ formatMoney(userInfo?.frozenBalance) }}</view>
      </view>
    </view>

    <!-- 提现表单 -->
    <view class="withdraw-form">
      <view class="form-section">
        <view class="section-title">提现金额</view>
        <view class="amount-input-wrapper">
          <text class="currency-symbol">¥</text>
          <input 
            v-model="withdrawAmount" 
            type="digit"
            placeholder="请输入提现金额"
            class="amount-input"
            @input="onAmountInput"
            @blur="validateAmount"
          />
        </view>
        <view v-if="amountError" class="error-message">{{ amountError }}</view>
        
        <!-- 快捷金额按钮 -->
        <view class="quick-amounts">
          <view 
            v-for="amount in quickAmounts" 
            :key="amount"
            class="quick-amount-btn"
            :class="{ active: withdrawAmount === amount.toString() }"
            @click="selectQuickAmount(amount)"
          >
            {{ amount }}元
          </view>
          <view 
            class="quick-amount-btn all"
            :class="{ active: isAllAmount }"
            @click="selectAllAmount"
          >
            全部
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">提现方式</view>
        <view class="withdraw-methods">
          <view 
            v-for="method in withdrawMethods" 
            :key="method.id"
            class="method-item"
            :class="{ active: selectedMethod === method.id }"
            @click="selectMethod(method.id)"
          >
            <view class="method-icon">{{ method.icon }}</view>
            <view class="method-info">
              <view class="method-name">{{ method.name }}</view>
              <view class="method-desc">{{ method.desc }}</view>
            </view>
            <view class="method-check">
              <text v-if="selectedMethod === method.id">✓</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 银行卡信息输入（如果选择银行卡） -->
      <view v-if="selectedMethod === 'bank'" class="form-section">
        <view class="section-title">银行卡信息</view>
        <view class="bank-inputs">
          <view class="input-group">
            <text class="input-label">持卡人姓名</text>
            <input 
              v-model="bankInfo.cardHolder" 
              placeholder="请输入持卡人姓名"
              class="text-input"
            />
          </view>
          <view class="input-group">
            <text class="input-label">银行卡号</text>
            <input 
              v-model="bankInfo.cardNumber" 
              type="number"
              placeholder="请输入银行卡号"
              class="text-input"
              @input="formatCardNumber"
            />
          </view>
          <view class="input-group">
            <text class="input-label">开户银行</text>
            <input 
              v-model="bankInfo.bankName" 
              placeholder="请输入开户银行"
              class="text-input"
            />
          </view>
        </view>
      </view>

      <!-- 费用说明 -->
      <view class="fee-info">
        <view class="fee-title">费用说明</view>
        <view class="fee-details">
          <view class="fee-item">
            <text class="fee-label">提现金额</text>
            <text class="fee-value">¥{{ formatMoney(withdrawAmount) }}</text>
          </view>
          <view class="fee-item">
            <text class="fee-label">手续费</text>
            <text class="fee-value">¥{{ formatMoney(calculatedFee) }}</text>
          </view>
          <view class="fee-item total">
            <text class="fee-label">实际到账</text>
            <text class="fee-value">¥{{ formatMoney(actualAmount) }}</text>
          </view>
        </view>
        <view class="fee-note">
          <text>• 单笔提现最低{{ minWithdrawAmount }}元，最高{{ maxWithdrawAmount }}元</text>
          <text>• 工作日当天到账，节假日顺延</text>
          <text>• 手续费按提现金额的{{ (feeRate * 100).toFixed(1) }}%收取，最低{{ minFee }}元</text>
        </view>
      </view>
    </view>

    <!-- 提现按钮 -->
    <view class="withdraw-actions">
      <view 
        class="withdraw-btn"
        :class="{ disabled: !canWithdraw }"
        @click="submitWithdraw"
      >
        确认提现
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/hooks'
import { StatusBar } from '@/components'
import { onLoad } from '@dcloudio/uni-app'

// 使用认证系统
const { isLoggedIn, userInfo, requireAuth, refreshUserInfo } = useAuth()

// 响应式数据
const withdrawAmount = ref('')
const amountError = ref('')
const selectedMethod = ref('wechat')
const bankInfo = ref({
  cardHolder: '',
  cardNumber: '',
  bankName: ''
})

// 提现配置
const minWithdrawAmount = ref(10)
const maxWithdrawAmount = ref(50000)
const feeRate = ref(0.006) // 0.6%
const minFee = ref(2)

// 快捷金额选项
const quickAmounts = ref([50, 100, 200, 500])

// 提现方式
const withdrawMethods = ref([
  {
    id: 'wechat',
    name: '微信零钱',
    desc: '提现到微信零钱，实时到账',
    icon: '💚'
  },
  {
    id: 'alipay',
    name: '支付宝',
    desc: '提现到支付宝账户，实时到账',
    icon: '💙'
  },
  {
    id: 'bank',
    name: '银行卡',
    desc: '提现到银行卡，1-3个工作日到账',
    icon: '🏦'
  }
])

// 页面加载
onLoad(async () => {
  console.log('💸 提现页面加载，当前登录状态:', isLoggedIn.value)
  
  if (!isLoggedIn.value) {
    // 如果未登录，显示登录提示并返回
    uni.showModal({
      title: '需要登录',
      content: '请先登录后再进行提现操作',
      showCancel: false,
      success: () => {
        uni.navigateBack()
      }
    })
  }
})

onMounted(async () => {
  if (isLoggedIn.value) {
    await refreshUserInfo()
  }
})

// 计算属性
const calculatedFee = computed(() => {
  const amount = parseFloat(withdrawAmount.value) || 0
  const fee = Math.max(amount * feeRate.value, minFee.value)
  return amount > 0 ? fee : 0
})

const actualAmount = computed(() => {
  const amount = parseFloat(withdrawAmount.value) || 0
  return Math.max(amount - calculatedFee.value, 0)
})

const isAllAmount = computed(() => {
  const amount = parseFloat(withdrawAmount.value) || 0
  const available = userInfo.value?.availableBalance || 0
  return Math.abs(amount - available) < 0.01
})

const canWithdraw = computed(() => {
  const amount = parseFloat(withdrawAmount.value) || 0
  const available = userInfo.value?.availableBalance || 0
  
  return amount >= minWithdrawAmount.value && 
         amount <= maxWithdrawAmount.value && 
         amount <= available &&
         !amountError.value &&
         selectedMethod.value &&
         (selectedMethod.value !== 'bank' || isValidBankInfo.value)
})

const isValidBankInfo = computed(() => {
  if (selectedMethod.value !== 'bank') return true
  
  return bankInfo.value.cardHolder.trim() !== '' &&
         bankInfo.value.cardNumber.trim() !== '' &&
         bankInfo.value.bankName.trim() !== ''
})

/**
 * 格式化金额
 */
const formatMoney = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '0.00'
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) {
    return '0.00'
  }
  return num.toFixed(2)
}

/**
 * 金额输入处理
 */
const onAmountInput = (e: any) => {
  let value = e.detail.value
  // 只允许数字和小数点
  value = value.replace(/[^\d.]/g, '')
  // 只允许一个小数点
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }
  // 限制小数位数
  if (parts[1] && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2)
  }
  
  withdrawAmount.value = value
  amountError.value = ''
}

/**
 * 验证金额
 */
const validateAmount = () => {
  const amount = parseFloat(withdrawAmount.value) || 0
  const available = userInfo.value?.availableBalance || 0
  
  if (amount <= 0) {
    amountError.value = '请输入有效金额'
  } else if (amount < minWithdrawAmount.value) {
    amountError.value = `最低提现金额为${minWithdrawAmount.value}元`
  } else if (amount > maxWithdrawAmount.value) {
    amountError.value = `最高提现金额为${maxWithdrawAmount.value}元`
  } else if (amount > available) {
    amountError.value = '提现金额不能超过可用余额'
  } else {
    amountError.value = ''
  }
}

/**
 * 选择快捷金额
 */
const selectQuickAmount = (amount: number) => {
  withdrawAmount.value = amount.toString()
  validateAmount()
}

/**
 * 选择全部金额
 */
const selectAllAmount = () => {
  const available = userInfo.value?.availableBalance || 0
  withdrawAmount.value = available.toString()
  validateAmount()
}

/**
 * 选择提现方式
 */
const selectMethod = (methodId: string) => {
  selectedMethod.value = methodId
}

/**
 * 格式化银行卡号
 */
const formatCardNumber = (e: any) => {
  let value = e.detail.value.replace(/\D/g, '')
  // 限制长度
  if (value.length > 19) {
    value = value.substring(0, 19)
  }
  bankInfo.value.cardNumber = value
}

/**
 * 提交提现申请
 */
const submitWithdraw = async () => {
  if (!canWithdraw.value) {
    return
  }
  
  // 最终验证
  validateAmount()
  if (amountError.value) {
    return
  }
  
  try {
    uni.showModal({
      title: '确认提现',
      content: `确定要提现¥${formatMoney(withdrawAmount.value)}吗？实际到账¥${formatMoney(actualAmount.value)}`,
      confirmColor: '#52c41a',
      success: async (res) => {
        if (res.confirm) {
          await processWithdraw()
        }
      }
    })
  } catch (error) {
    console.error('提现失败:', error)
    uni.showToast({
      title: '提现失败',
      icon: 'none'
    })
  }
}

/**
 * 处理提现
 */
const processWithdraw = async () => {
  uni.showLoading({ title: '提交中...' })
  
  try {
    // TODO: 调用提现API
    const withdrawData = {
      amount: parseFloat(withdrawAmount.value),
      method: selectedMethod.value,
      bankInfo: selectedMethod.value === 'bank' ? bankInfo.value : null
    }
    
    console.log('提现数据:', withdrawData)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    uni.hideLoading()
    
    uni.showModal({
      title: '提现申请成功',
      content: '您的提现申请已提交，请耐心等待处理',
      showCancel: false,
      confirmColor: '#52c41a',
      success: () => {
        // 返回钱包页面
        uni.navigateBack()
      }
    })
    
  } catch (error) {
    uni.hideLoading()
    console.error('提现处理失败:', error)
    uni.showToast({
      title: '提现失败，请重试',
      icon: 'none'
    })
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
.withdraw-page {
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

.balance-info {
  padding: 40rpx;
  
  .balance-card {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
    border-radius: 24rpx;
    padding: 40rpx;
    text-align: center;
    color: white;
    box-shadow: 0 8rpx 32rpx rgba(82, 196, 26, 0.3);
    
    .balance-label {
      font-size: 28rpx;
      opacity: 0.9;
      margin-bottom: 16rpx;
    }
    
    .balance-amount {
      font-size: 64rpx;
      font-weight: bold;
      margin-bottom: 16rpx;
    }
    
    .balance-tip {
      font-size: 24rpx;
      opacity: 0.8;
    }
  }
}

.withdraw-form {
  .form-section {
    background: white;
    margin: 20rpx 40rpx;
    border-radius: 20rpx;
    padding: 40rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 30rpx;
    }
    
    .amount-input-wrapper {
      display: flex;
      align-items: center;
      border: 2rpx solid #d9d9d9;
      border-radius: 16rpx;
      padding: 20rpx 30rpx;
      margin-bottom: 20rpx;
      
      &:focus-within {
        border-color: #52c41a;
      }
      
      .currency-symbol {
        font-size: 40rpx;
        font-weight: bold;
        color: #52c41a;
        margin-right: 16rpx;
      }
      
      .amount-input {
        flex: 1;
        font-size: 40rpx;
        font-weight: bold;
        color: #333;
        border: none;
        outline: none;
      }
    }
    
    .error-message {
      font-size: 24rpx;
      color: #ff4d4f;
      margin-bottom: 20rpx;
    }
    
    .quick-amounts {
      display: flex;
      gap: 20rpx;
      flex-wrap: wrap;
      
      .quick-amount-btn {
        padding: 16rpx 32rpx;
        border: 2rpx solid #d9d9d9;
        border-radius: 40rpx;
        font-size: 28rpx;
        color: #666;
        background: white;
        transition: all 0.3s ease;
        
        &.active {
          border-color: #52c41a;
          background: #52c41a;
          color: white;
        }
        
        &.all {
          background: #f0f5ff;
          border-color: #1890ff;
          color: #1890ff;
          
          &.active {
            background: #1890ff;
            color: white;
          }
        }
      }
    }
    
    .withdraw-methods {
      .method-item {
        display: flex;
        align-items: center;
        padding: 30rpx 0;
        border-bottom: 1rpx solid #f0f0f0;
        transition: all 0.3s ease;
        
        &:last-child {
          border-bottom: none;
        }
        
        &.active {
          background: #f6ffed;
          border-radius: 16rpx;
          padding: 30rpx 20rpx;
          border: 1rpx solid #b7eb8f;
        }
        
        .method-icon {
          font-size: 40rpx;
          margin-right: 24rpx;
        }
        
        .method-info {
          flex: 1;
          
          .method-name {
            font-size: 32rpx;
            color: #333;
            margin-bottom: 8rpx;
          }
          
          .method-desc {
            font-size: 24rpx;
            color: #666;
          }
        }
        
        .method-check {
          width: 40rpx;
          height: 40rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          
          text {
            font-size: 32rpx;
            color: #52c41a;
            font-weight: bold;
          }
        }
      }
    }
    
    .bank-inputs {
      .input-group {
        margin-bottom: 30rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .input-label {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 16rpx;
        }
        
        .text-input {
          width: 100%;
          padding: 24rpx 30rpx;
          border: 2rpx solid #d9d9d9;
          border-radius: 16rpx;
          font-size: 32rpx;
          color: #333;
          box-sizing: border-box;
          
          &:focus {
            border-color: #52c41a;
          }
        }
      }
    }
  }
}

.fee-info {
  background: white;
  margin: 20rpx 40rpx;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .fee-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 30rpx;
  }
  
  .fee-details {
    .fee-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      &.total {
        font-weight: bold;
        font-size: 32rpx;
        color: #52c41a;
        border-top: 2rpx solid #f0f0f0;
        margin-top: 20rpx;
        padding-top: 30rpx;
      }
      
      .fee-label {
        font-size: 28rpx;
        color: #666;
      }
      
      .fee-value {
        font-size: 28rpx;
        color: #333;
      }
    }
  }
  
  .fee-note {
    margin-top: 30rpx;
    padding: 20rpx;
    background: #f6ffed;
    border-radius: 12rpx;
    border: 1rpx solid #b7eb8f;
    
    text {
      display: block;
      font-size: 24rpx;
      color: #52c41a;
      line-height: 1.6;
      margin-bottom: 8rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.withdraw-actions {
  padding: 40rpx;
  
  .withdraw-btn {
    background: #52c41a;
    color: white;
    text-align: center;
    padding: 32rpx;
    border-radius: 20rpx;
    font-size: 36rpx;
    font-weight: bold;
    box-shadow: 0 8rpx 20rpx rgba(82, 196, 26, 0.3);
    transition: all 0.3s ease;
    
    &:active:not(.disabled) {
      transform: scale(0.95);
    }
    
    &.disabled {
      background: #d9d9d9;
      color: #999;
      box-shadow: none;
    }
  }
}
</style> 