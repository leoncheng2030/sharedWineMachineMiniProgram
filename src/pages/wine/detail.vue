<template>
  <view class="wine-detail-page">
    <view v-if="loading" class="loading-container">
      <up-loading-icon mode="circle"></up-loading-icon>
      <text class="loading-text">加载中...</text>
    </view>
    
    <view v-else-if="!wineProduct" class="error-container">
      <image src="/static/images/goods_null.png" class="error-image"></image>
      <text class="error-text">酒品信息不存在</text>
      <up-button type="primary" @tap="goBack">返回</up-button>
    </view>
    
    <view v-else class="wine-content">
      <!-- 酒品图片轮播 -->
      <view class="wine-gallery">
        <swiper 
          class="wine-swiper" 
          :indicator-dots="images.length > 1"
          indicator-color="rgba(255,255,255,0.5)"
          indicator-active-color="#fff"
          :autoplay="false"
          :circular="true"
        >
          <swiper-item v-for="(image, index) in images" :key="index">
            <image 
              :src="image" 
              class="wine-image"
              mode="aspectFill"
              @tap="previewImage(index)"
            ></image>
          </swiper-item>
        </swiper>
        
        <!-- 收藏按钮 -->
        <view class="collect-btn" @tap="toggleCollect">
          <up-icon 
            :name="isCollected ? 'heart-fill' : 'heart'" 
            size="20" 
            :color="isCollected ? '#ff4757' : '#fff'"
          ></up-icon>
        </view>
      </view>
      
      <!-- 酒品基本信息 -->
      <view class="wine-info">
        <view class="wine-header">
          <text class="wine-name">{{ wineProduct.productName }}</text>
          <view class="wine-code">
            <text class="code-text">编码：{{ wineProduct.productCode }}</text>
          </view>
        </view>
        
        <view class="wine-price">
          <view class="current-price">
            <text class="price-symbol">¥</text>
            <text class="price-integer">{{ Math.floor(wineProduct.currentPrice || 0) }}</text>
            <text class="price-decimal">.{{ ((wineProduct.currentPrice || 0) % 1 * 100).toFixed(0).padStart(2, '0') }}</text>
          </view>
          <text 
            v-if="wineProduct.suggestedPrice && wineProduct.suggestedPrice > (wineProduct.currentPrice || 0)" 
            class="original-price"
          >
            ¥{{ wineProduct.suggestedPrice.toFixed(2) }}
          </text>
          <view 
            v-if="wineProduct.suggestedPrice && wineProduct.suggestedPrice > (wineProduct.currentPrice || 0)"
            class="discount-tag"
          >
            {{ Math.round((wineProduct.currentPrice || 0) / wineProduct.suggestedPrice * 10) }}折
          </view>
        </view>
        
        <view class="wine-meta">
          <view class="meta-row">
            <text class="meta-label">品牌：</text>
            <text class="meta-value">{{ wineProduct.brand || '未知品牌' }}</text>
          </view>
          <view class="meta-row">
            <text class="meta-label">酒精度：</text>
            <text class="meta-value">{{ wineProduct.alcoholContent }}°</text>
          </view>
          <view class="meta-row">
            <text class="meta-label">净含量：</text>
            <text class="meta-value">{{ wineProduct.volume }}ml</text>
          </view>
          <view class="meta-row">
            <text class="meta-label">分类：</text>
            <text class="meta-value">{{ wineProduct.categoryName || '未分类' }}</text>
          </view>
          <view v-if="wineProduct.origin" class="meta-row">
            <text class="meta-label">产地：</text>
            <text class="meta-value">{{ wineProduct.origin }}</text>
          </view>
          <view v-if="wineProduct.manufacturer" class="meta-row">
            <text class="meta-label">生产厂家：</text>
            <text class="meta-value">{{ wineProduct.manufacturer }}</text>
          </view>
        </view>
      </view>
      
      <!-- 商品描述 -->
      <view v-if="wineProduct.description" class="wine-description">
        <view class="section-title">
          <text class="title-text">商品描述</text>
        </view>
        <view class="description-content">
          <text class="description-text">{{ wineProduct.description }}</text>
        </view>
      </view>
      
      <!-- 购买须知 -->
      <view class="purchase-notice">
        <view class="section-title">
          <text class="title-text">购买须知</text>
        </view>
        <view class="notice-content">
          <view class="notice-item">
            <up-icon name="checkmark" size="14" color="#52c41a"></up-icon>
            <text class="notice-text">本商品为酒类产品，未成年人禁止购买</text>
          </view>
          <view class="notice-item">
            <up-icon name="checkmark" size="14" color="#52c41a"></up-icon>
            <text class="notice-text">请适量饮酒，饮酒不开车，开车不饮酒</text>
          </view>
          <view class="notice-item">
            <up-icon name="checkmark" size="14" color="#52c41a"></up-icon>
            <text class="notice-text">商品以实物为准，图片仅供参考</text>
          </view>
          <view class="notice-item">
            <up-icon name="checkmark" size="14" color="#52c41a"></up-icon>
            <text class="notice-text">如有质量问题，请联系客服处理</text>
          </view>
        </view>
      </view>
      
      <!-- 推荐商品 -->
      <view v-if="recommendProducts.length > 0" class="recommend-section">
        <view class="section-title">
          <text class="title-text">相关推荐</text>
        </view>
        <scroll-view class="recommend-scroll" scroll-x>
          <view class="recommend-list">
            <view 
              v-for="product in recommendProducts" 
              :key="product.id"
              class="recommend-item"
              @tap="goToProduct(product.id)"
            >
              <image 
                :src="product.imageUrl || '/static/images/bg_member_grade.png'" 
                class="recommend-image"
                mode="aspectFill"
              ></image>
              <text class="recommend-name">{{ product.productName }}</text>
              <text class="recommend-price">¥{{ (product.currentPrice || 0).toFixed(2) }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
    
    <!-- 底部购买栏 -->
    <view v-if="wineProduct" class="bottom-bar">
      <view class="bar-left">
        <view class="contact-btn" @tap="contactService">
          <up-icon name="chat" size="20" color="#666"></up-icon>
          <text class="contact-text">客服</text>
        </view>
        <view class="share-btn" @tap="shareProduct">
          <up-icon name="share" size="20" color="#666"></up-icon>
          <text class="share-text">分享</text>
        </view>
      </view>
      <view class="bar-right">
        <up-button 
          type="warning" 
          class="buy-btn"
          @tap="buyNow"
        >
          立即购买
        </up-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { WineApi, type WineProduct, type WineProductDetail } from '@/api/wine';

// 页面参数
const props = defineProps<{
  id?: string;
  productName?: string;
}>();

// 响应式数据
const loading = ref(true);
const wineProduct = ref<WineProductDetail | null>(null);
const isCollected = ref(false);
const recommendProducts = ref<WineProduct[]>([]);

// 计算属性
const images = computed(() => {
  if (wineProduct.value?.imageUrl) {
    return [wineProduct.value.imageUrl];
  }
  return ['/static/images/bg_member_grade.png'];
});

// 页面加载
onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  const options = currentPage?.options || {};
  
  const productId = props.id || options.id;
  const productName = props.productName || options.productName;
  
  if (productId) {
    loadWineDetail(productId);
    loadRecommendProducts();
  } else {
    loading.value = false;
    uni.showToast({
      title: '商品ID不能为空',
      icon: 'none'
    });
  }
});

// 加载酒品详情
const loadWineDetail = async (productId: string) => {
  try {
    console.log('加载酒品详情，ID:', productId);
    loading.value = true;
    
    const result = await WineApi.getWineDetail(productId);
    if (result) {
      wineProduct.value = result;
      console.log('酒品详情加载成功:', result);
    } else {
      console.warn('酒品详情为空');
    }
  } catch (error) {
    console.error('加载酒品详情失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 加载推荐商品
const loadRecommendProducts = async () => {
  try {
    const result = await WineApi.getRecommendedWines(6);
    if (result && result.length > 0) {
      recommendProducts.value = result;
    }
  } catch (error) {
    console.error('加载推荐商品失败:', error);
  }
};

// 图片预览
const previewImage = (index: number) => {
  uni.previewImage({
    urls: images.value,
    current: index
  });
};

// 切换收藏
const toggleCollect = () => {
  isCollected.value = !isCollected.value;
  uni.showToast({
    title: isCollected.value ? '已收藏' : '已取消收藏',
    icon: 'none'
  });
};

// 联系客服
const contactService = () => {
  uni.showToast({
    title: '客服功能待开发',
    icon: 'none'
  });
};

// 分享商品
const shareProduct = () => {
  uni.showShareMenu({
    withShareTicket: true,
    success: () => {
      console.log('分享成功');
    },
    fail: (error) => {
      console.error('分享失败:', error);
      uni.showToast({
        title: '分享失败',
        icon: 'none'
      });
    }
  });
};

// 立即购买
const buyNow = () => {
  if (!wineProduct.value) return;
  
  // 这里应该跳转到购买页面或者调用购买接口
  uni.showToast({
    title: '购买功能待开发',
    icon: 'none'
  });
  
  // TODO: 实现购买逻辑
  // uni.navigateTo({
  //   url: `/pages/order/create?productId=${wineProduct.value.id}`
  // });
};

// 跳转到其他商品
const goToProduct = (productId: string) => {
  uni.redirectTo({
    url: `/pages/wine/detail?id=${productId}`
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss" scoped>
.wine-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  
  .loading-text, .error-text {
    margin-top: 20rpx;
    color: #666;
    font-size: 28rpx;
  }
  
  .error-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }
}

.wine-gallery {
  position: relative;
  height: 750rpx;
  
  .wine-swiper {
    height: 100%;
    
    .wine-image {
      width: 100%;
      height: 100%;
    }
  }
  
  .collect-btn {
    position: absolute;
    top: 40rpx;
    right: 40rpx;
    width: 80rpx;
    height: 80rpx;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.wine-info {
  background: white;
  padding: 40rpx;
  margin-bottom: 20rpx;
  
  .wine-header {
    margin-bottom: 20rpx;
    
    .wine-name {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      line-height: 1.4;
    }
    
    .wine-code {
      margin-top: 10rpx;
      
      .code-text {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
  
  .wine-price {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    .current-price {
      display: flex;
      align-items: baseline;
      margin-right: 20rpx;
      
      .price-symbol {
        font-size: 28rpx;
        color: #ff4757;
        font-weight: bold;
      }
      
      .price-integer {
        font-size: 48rpx;
        color: #ff4757;
        font-weight: bold;
      }
      
      .price-decimal {
        font-size: 28rpx;
        color: #ff4757;
        font-weight: bold;
      }
    }
    
    .original-price {
      font-size: 24rpx;
      color: #999;
      text-decoration: line-through;
      margin-right: 15rpx;
    }
    
    .discount-tag {
      background: #ff4757;
      color: white;
      font-size: 20rpx;
      padding: 4rpx 8rpx;
      border-radius: 8rpx;
    }
  }
  
  .wine-meta {
    .meta-row {
      display: flex;
      align-items: center;
      margin-bottom: 15rpx;
      
      .meta-label {
        font-size: 28rpx;
        color: #666;
        width: 150rpx;
      }
      
      .meta-value {
        font-size: 28rpx;
        color: #333;
        flex: 1;
      }
    }
  }
}

.wine-description, .purchase-notice, .recommend-section {
  background: white;
  margin-bottom: 20rpx;
  
  .section-title {
    padding: 30rpx 40rpx 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .title-text {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
}

.description-content {
  padding: 30rpx 40rpx;
  
  .description-text {
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
  }
}

.notice-content {
  padding: 20rpx 40rpx 30rpx;
  
  .notice-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 15rpx;
    
    .notice-text {
      font-size: 26rpx;
      color: #666;
      margin-left: 10rpx;
      line-height: 1.5;
    }
  }
}

.recommend-scroll {
  white-space: nowrap;
  
  .recommend-list {
    display: flex;
    padding: 20rpx 40rpx 30rpx;
    
    .recommend-item {
      display: flex;
      flex-direction: column;
      width: 200rpx;
      margin-right: 20rpx;
      
      .recommend-image {
        width: 200rpx;
        height: 200rpx;
        border-radius: 12rpx;
        margin-bottom: 10rpx;
      }
      
      .recommend-name {
        font-size: 24rpx;
        color: #333;
        margin-bottom: 5rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .recommend-price {
        font-size: 26rpx;
        color: #ff4757;
        font-weight: bold;
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 40rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .bar-left {
    display: flex;
    align-items: center;
    
    .contact-btn, .share-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-right: 40rpx;
      
      .contact-text, .share-text {
        font-size: 20rpx;
        color: #666;
        margin-top: 5rpx;
      }
    }
  }
  
  .bar-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    
    .buy-btn {
      width: 300rpx;
      height: 80rpx;
      border-radius: 40rpx;
    }
  }
}
</style> 