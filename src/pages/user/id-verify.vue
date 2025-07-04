<template>
  <view class="id-verify-page">
    <view class="header-section">
      <view class="header-icon">
        <up-icon name="account-fill" size="80" color="#007aff"></up-icon>
      </view>
      <text class="header-title">实名认证</text>
      <text class="header-subtitle">为了保护未成年人健康成长，请配合完成身份验证</text>
    </view>

    <view class="form-section">
      <view class="form-item">
        <text class="form-label">真实姓名</text>
        <up-input 
          v-model="formData.realName"
          placeholder="请输入您的真实姓名"
          :clearable="true"
        ></up-input>
      </view>

      <view class="form-item">
        <text class="form-label">身份证号码</text>
        <up-input 
          v-model="formData.idCard"
          placeholder="请输入身份证号码"
          :clearable="true"
          maxlength="18"
        ></up-input>
      </view>

      <view class="tips-section">
        <view class="tips-item">
          <up-icon name="info-circle-fill" size="16" color="#999"></up-icon>
          <text class="tips-text">我们将严格保护您的个人信息安全</text>
        </view>
        <view class="tips-item">
          <up-icon name="warning-fill" size="16" color="#ff9500"></up-icon>
          <text class="tips-text">年满18周岁方可购买，共同守护青少年健康</text>
        </view>
      </view>
    </view>

    <view class="button-section">
      <up-button 
        type="primary"
        size="large"
        :loading="loading"
        :disabled="!canSubmit"
        custom-style="width: 100%; height: 88rpx; font-size: 32rpx; font-weight: bold; margin-bottom: 20rpx;"
        @click="submitVerify"
      >
        提交认证
      </up-button>
      
      <up-button 
        type="info"
        size="large"
        plain
        custom-style="width: 100%; height: 88rpx; font-size: 28rpx;"
        @click="goBack"
      >
        稍后再说
      </up-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 表单数据
const formData = ref({
  realName: '',
  idCard: ''
})

const loading = ref(false)

// 计算属性
const canSubmit = computed(() => {
  return formData.value.realName.trim() && 
         formData.value.idCard.trim() && 
         isValidIdCard(formData.value.idCard)
})

// 身份证号码验证
const isValidIdCard = (idCard: string): boolean => {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return reg.test(idCard)
}

// 计算年龄
const calculateAge = (idCard: string): number => {
  if (!isValidIdCard(idCard)) return 0
  
  const year = parseInt(idCard.substring(6, 10))
  const month = parseInt(idCard.substring(10, 12))
  const day = parseInt(idCard.substring(12, 14))
  
  const today = new Date()
  const birthDate = new Date(year, month - 1, day)
  
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// 提交认证
const submitVerify = async () => {
  if (!canSubmit.value) return
  
  // 检查年龄
  const age = calculateAge(formData.value.idCard)
  if (age < 18) {
    uni.showToast({
      title: '未满18周岁，无法购买酒类商品',
      icon: 'none',
      duration: 3000
    })
    return
  }
  
  loading.value = true
  
  try {
    // 模拟API调用
    await mockIdVerifyAPI({
      realName: formData.value.realName,
      idCard: formData.value.idCard
    })
    
    uni.showToast({
      title: '认证成功',
      icon: 'success'
    })
    
    // 延迟返回上一页
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    
  } catch (error) {
    console.error('实名认证失败:', error)
    uni.showToast({
      title: '认证失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 模拟实名认证API
const mockIdVerifyAPI = async (data: {realName: string, idCard: string}): Promise<any> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟成功
      resolve({
        success: true,
        verified: true,
        age: calculateAge(data.idCard)
      })
    }, 2000)
  })
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.id-verify-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx 30rpx;
}

.header-section {
  text-align: center;
  padding: 60rpx 0;
  
  .header-icon {
    margin-bottom: 30rpx;
  }
  
  .header-title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 16rpx;
  }
  
  .header-subtitle {
    display: block;
    font-size: 26rpx;
    color: #666;
    line-height: 1.4;
  }
}

.form-section {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 40rpx;
  
  .form-item {
    margin-bottom: 40rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .form-label {
      display: block;
      font-size: 28rpx;
      color: #333;
      margin-bottom: 16rpx;
      font-weight: 500;
    }
  }
  
  .tips-section {
    margin-top: 40rpx;
    padding-top: 30rpx;
    border-top: 1rpx solid #f0f0f0;
    
    .tips-item {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 16rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .tips-text {
        font-size: 24rpx;
        color: #666;
        line-height: 1.4;
      }
    }
  }
}

.button-section {
  padding: 0 30rpx;
}
</style> 