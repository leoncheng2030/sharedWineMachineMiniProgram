<template>
    <view class="w-full home-bg">

        <div class="main">
            <!-- 轮播图区域 -->
            <view class="swiper-container">
                <up-swiper
                    :list="swiperList"
                    keyName="image"
                    :autoplay="true"
                    :interval="3000"
                    :duration="500"
                    indicatorMode="dot"
                    height="150"
                    radius="10"
                    @click="handleSwiperClick"
                ></up-swiper>
            </view>

            <!-- 四宫格导航 -->
            <view class="grid-nav">
                <view class="nav-grid">
                    <view class="nav-item" @click="handleScanCode">
                        <view class="nav-icon scan-icon">
                            <up-icon name="scan" size="32" color="#007aff"></up-icon>
                        </view>
                        <text class="nav-text">扫码购买</text>
                    </view>
                    <view class="nav-item" @click="goToDeviceList">
                        <view class="nav-icon device-icon">
                            <up-icon name="home" size="32" color="#52c41a"></up-icon>
                        </view>
                        <text class="nav-text">附近设备</text>
                    </view>
                    <view class="nav-item" @click="goToOrders">
                        <view class="nav-icon order-icon">
                            <up-icon name="list" size="32" color="#faad14"></up-icon>
                        </view>
                        <text class="nav-text">我的订单</text>
                    </view>
                    <view class="nav-item" @click="goToWallet">
                        <view class="nav-icon wallet-icon">
                            <up-icon name="rmb-circle" size="32" color="#ff4757"></up-icon>
                        </view>
                        <text class="nav-text">我的钱包</text>
                    </view>
                </view>
            </view>

            <!-- 商品瀑布流 -->
            <view class="waterfall-container">
                <view class="section-title">
                    <text class="title-left">热门推荐</text>
                    <text class="title-right" @click="handleMoreClick">更多 ></text>
                </view>
                <up-waterfall 
                    v-model="productList"
                    ref="uWaterfall"
                    addTime="200"
                    idKey="id"
                >
                    <template v-slot:left="{leftList}">
                        <view 
                            class="waterfall-item" 
                            v-for="(item, index) in leftList" 
                            :key="index"
                            @click="handleProductClick(item)"
                        >
                            <up-image 
                                :src="item.imageUrl" 
                                width="100%" 
                                height="300rpx"
                                radius="16"
                                mode="aspectFill"
                            ></up-image>
                            <view class="product-info">
                                <text class="product-title">{{ item.productName }}</text>
                                <view class="product-meta">
                                    <text class="product-brand">{{ item.brand }}</text>
                                    <text class="product-alcohol">{{ item.alcoholContent }}°</text>
                                    <text class="product-volume">{{ item.volume }}ml</text>
                                </view>
                                <view class="product-price">
                                    <text class="current-price">¥{{ item.currentPrice?.toFixed(2) || '0.00' }}</text>
                                    <text v-if="item.suggestedPrice && item.suggestedPrice > (item.currentPrice || 0)" class="original-price">¥{{ item.suggestedPrice.toFixed(2) }}</text>
                                </view>
                            </view>
                        </view>
                    </template>
                    <template v-slot:right="{rightList}">
                        <view 
                            class="waterfall-item" 
                            v-for="(item, index) in rightList" 
                            :key="index"
                            @click="handleProductClick(item)"
                        >
                            <up-image 
                                :src="item.imageUrl" 
                                width="100%" 
                                height="300rpx"
                                radius="16"
                                mode="aspectFill"
                            ></up-image>
                            <view class="product-info">
                                <text class="product-title">{{ item.productName }}</text>
                                <view class="product-meta">
                                    <text class="product-brand">{{ item.brand }}</text>
                                    <text class="product-alcohol">{{ item.alcoholContent }}°</text>
                                    <text class="product-volume">{{ item.volume }}ml</text>
                                </view>
                                <view class="product-price">
                                    <text class="current-price">¥{{ item.currentPrice?.toFixed(2) || '0.00' }}</text>
                                    <text v-if="item.suggestedPrice && item.suggestedPrice > (item.currentPrice || 0)" class="original-price">¥{{ item.suggestedPrice.toFixed(2) }}</text>
                                </view>
                            </view>
                        </view>
                    </template>
                </up-waterfall>
            </view>
            
            <view class="divider pb-10">
                <CustomDivider />
            </view>
        </div>
        
        <up-back-top 
            :scrollTop="scrollTops" 
            :customStyle="{
                backgroundColor: '#FFF',
                color: '#000',
                boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
            }"
        ></up-back-top>
    </view>
    <AndPrivacy v-if="config" />
</template>

<script setup lang="ts">
import { useConfigStore } from "@/store";
import { onPageScroll } from "@dcloudio/uni-app";
import { storeToRefs } from "pinia";
import { computed, reactive, toRefs, ref, onMounted } from "vue";
import { throttle } from "lodash-es";
import AndPrivacy from "@/components/andPrivacy/index.vue";
import { useGetUser, useShareAppMessage } from "@/hooks/user";
import { useGetConfig } from "@/hooks";
import navImg from "@/static/images/bg_hometop.png";
import HomeApi, { type SlideshowItem } from "@/api/home";
import { WineApi, type WineProduct } from "@/api/wine";

useGetUser();
useShareAppMessage();
useGetConfig();

const configStore = useConfigStore();
const { config } = storeToRefs(configStore);

// 轮播图数据
const swiperList = ref<SlideshowItem[]>([]);

// 加载轮播图数据
const loadSlideshowData = async () => {
    try {
        uni.showLoading({ title: '加载中...' });
        const slideshowData = await HomeApi.getMiniHomeBanner();
        
        if (slideshowData && slideshowData.length > 0) {
            swiperList.value = slideshowData.map(item => ({
                ...item,
                // 确保图片路径正确
                image: item.image || "/static/images/bg_hometop.png"
            }));
        } else {
            // 如果没有数据，使用默认轮播图
            setDefaultSwiperData();
        }
    } catch (error) {
        console.error('加载轮播图失败:', error);
        // 加载失败时使用默认数据
        setDefaultSwiperData();
        uni.showToast({
            title: '轮播图加载失败，使用默认数据',
            icon: 'none',
            duration: 2000
        });
    } finally {
        uni.hideLoading();
    }
};

// 设置默认轮播图数据
const setDefaultSwiperData = () => {
    swiperList.value = [
        {
            id: "default1",
            image: "/static/images/bg_hometop.png",
            title: "默认轮播图1",
            link: ""
        },
        {
            id: "default2",
            image: "/static/images/home_seckill_bg.png",
            title: "默认轮播图2",
            link: ""
        },
        {
            id: "default3",
            image: "/static/images/pintuan_bg.png",
            title: "默认轮播图3",
            link: ""
        }
    ];
};

// 四宫格导航数据
const gridList = ref([
    {
        icon: "/static/images/icon_home.png",
        title: "首页",
        type: "home"
    },
    {
        icon: "/static/images/icon_search.png",
        title: "搜索",
        type: "search"
    },
    {
        icon: "/static/images/icon_like.png",
        title: "收藏",
        type: "favorite"
    },
    {
        icon: "/static/images/icon_user.png",
        title: "我的",
        type: "user"
    }
]);

// 酒品商品数据
const productList = ref<WineProduct[]>([]);

// 计算左右两列数据
const leftColumnData = computed(() => {
    return productList.value.filter((_, index) => index % 2 === 0);
});

const rightColumnData = computed(() => {
    return productList.value.filter((_, index) => index % 2 === 1);
});

const showLogo = computed(() => config.value?.index_setting?.showLogo && config.value?.index_setting?.showLogo == "1");
const navBackground = computed(() => {
    if (config.value && config.value.index_setting && config.value.index_setting.index_top_bg) {
        return config.value.index_setting.index_top_bg;
    } else {
        return navImg;
    }
});

const defaultData = reactive({
    navBg: true,
    disabled: false,
    scrollTops: 0,
});

const { navBg, scrollTops, disabled } = toRefs(defaultData);
const logo = computed(() => {
    return config.value?.logo;
});

const pageScroll = throttle((e: Page.PageScrollOption) => {
    const top = uni.upx2px(80);
    const { scrollTop } = e;
    defaultData.scrollTops = scrollTop;

    if (defaultData.disabled) return;
    defaultData.navBg = scrollTop < top;
}, 500);

onPageScroll(pageScroll);

const searchHandle = () => {
    uni.showToast({
        title: "搜索功能待开发",
        icon: "none"
    });
};

const handleGridClick = (item: any) => {
    uni.showToast({
        title: `点击了${item.title}`,
        icon: "none"
    });
};

const handleProductClick = (item: WineProduct) => {
    // 跳转到酒品详情页面
    uni.navigateTo({
        url: `/pages/wine/detail?id=${item.id}&productName=${encodeURIComponent(item.productName)}`
    });
};

const handleSwiperClick = (index: number) => {
    const item = swiperList.value[index];
    
    // 如果有跳转链接，进行跳转
    if (item.link) {
        if (item.link.startsWith('http')) {
            // 外部链接，使用webview页面打开
            uni.navigateTo({
                url: `/pages/webview/webview?url=${encodeURIComponent(item.link)}&title=${encodeURIComponent(item.title)}`
            });
        } else if (item.link.startsWith('/')) {
            // 内部页面跳转
            uni.navigateTo({
                url: item.link
            });
        } else {
            // 其他情况提示
            uni.showToast({
                title: `点击了轮播图：${item.title}`,
                icon: "none"
            });
        }
    } else {
        uni.showToast({
            title: `点击了轮播图：${item.title}`,
            icon: "none"
        });
    }
};

const getGridIcon = (type: string) => {
    const iconMap: Record<string, string> = {
        home: 'home',
        search: 'search',
        favorite: 'heart',
        user: 'account'
    };
    return iconMap[type] || 'home';
};

const handleMoreClick = () => {
    uni.showToast({
        title: "查看更多商品",
        icon: "none"
    });
};

// 扫码购买
const handleScanCode = () => {
    uni.scanCode({
        success: (res) => {
            console.log('扫码结果:', res);
            // 跳转到设备详情页面，传递二维码内容
            uni.navigateTo({
                url: `/pages/device/detail?qrCode=${encodeURIComponent(res.result)}`
            });
        },
        fail: (error) => {
            console.error('扫码失败:', error);
            uni.showToast({
                title: '扫码失败',
                icon: 'none'
            });
        }
    });
};

// 跳转到设备列表
const goToDeviceList = () => {
    uni.navigateTo({
        url: '/pages/device/list'
    });
};

// 跳转到订单列表
const goToOrders = () => {
    uni.navigateTo({
        url: '/pages/order/list'
    });
};

// 跳转到钱包
const goToWallet = () => {
    uni.navigateTo({
        url: '/pages/wallet/wallet'
    });
};

// 加载热门酒品数据
const loadWineProducts = async () => {
    try {
        console.log('开始加载热门酒品数据...');
        const wineData = await WineApi.getHotWines(20);
        
        if (wineData && wineData.length > 0) {
            productList.value = wineData.map(item => ({
                ...item,
                // 确保图片路径正确，如果没有图片则使用默认图片
                imageUrl: item.imageUrl || "/static/images/bg_member_grade.png"
            }));
            console.log('热门酒品数据加载成功:', productList.value.length, '个商品');
        } else {
            console.warn('热门酒品数据为空，使用默认数据');
            setDefaultProductData();
        }
    } catch (error) {
        console.error('加载热门酒品失败:', error);
        // 加载失败时使用默认数据
        setDefaultProductData();
        uni.showToast({
            title: '商品加载失败，使用默认数据',
            icon: 'none',
            duration: 2000
        });
    }
};

// 设置默认商品数据
const setDefaultProductData = () => {
    productList.value = [
        {
            id: "default1",
            productCode: "DEFAULT001",
            productName: "精美酒品1",
            imageUrl: "/static/images/bg_member_grade.png",
            currentPrice: 99.00,
            suggestedPrice: 199.00,
            brand: "默认品牌",
            alcoholContent: 42.0,
            volume: 500
        },
        {
            id: "default2",
            productCode: "DEFAULT002", 
            productName: "热销酒品2",
            imageUrl: "/static/images/coupon_bg.png",
            currentPrice: 158.00,
            brand: "默认品牌",
            alcoholContent: 38.0,
            volume: 750
        },
        {
            id: "default3",
            productCode: "DEFAULT003",
            productName: "推荐酒品3", 
            imageUrl: "/static/images/home_bg_coupon.png",
            currentPrice: 88.00,
            suggestedPrice: 128.00,
            brand: "默认品牌",
            alcoholContent: 45.0,
            volume: 500
        },
        {
            id: "default4",
            productCode: "DEFAULT004",
            productName: "特价酒品4",
            imageUrl: "/static/images/bg_packet_img.png", 
            currentPrice: 66.00,
            suggestedPrice: 99.00,
            brand: "默认品牌",
            alcoholContent: 40.0,
            volume: 500
        },
        {
            id: "default5",
            productCode: "DEFAULT005",
            productName: "限时优惠酒品5",
            imageUrl: "/static/images/vip_grade_bg.png",
            currentPrice: 188.00,
            suggestedPrice: 288.00,
            brand: "默认品牌",
            alcoholContent: 52.0,
            volume: 750
        },
        {
            id: "default6",
            productCode: "DEFAULT006",
            productName: "新品上市酒品6",
            imageUrl: "/static/images/sing_bg.png",
            currentPrice: 299.00,
            brand: "默认品牌",
            alcoholContent: 48.0,
            volume: 1000
        }
    ] as WineProduct[];
};

// 页面挂载时加载数据
onMounted(() => {
    loadSlideshowData();
    loadWineProducts();
});
</script>

<style lang="scss" scoped>
.home-bg {
    min-height: 100vh;
    background-color: #f5f5f5;
}

.main {
    padding: 0 20rpx;
}

.swiper-container {
    margin: 20rpx 0;
}

.grid-nav {
    background: white;
    border-radius: 20rpx;
    padding: 30rpx;
    margin: 20rpx 0;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.nav-grid {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
}

.nav-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10rpx;
}

.scan-icon {
    background: linear-gradient(135deg, #007aff, #5ac8fa);
}

.device-icon {
    background: linear-gradient(135deg, #52c41a, #73d13d);
}

.order-icon {
    background: linear-gradient(135deg, #faad14, #ffc53d);
}

.wallet-icon {
    background: linear-gradient(135deg, #ff4757, #ff6b7a);
}

.nav-text {
    font-size: 24rpx;
    color: #666;
}

.waterfall-container {
    margin-top: 40rpx;
}

.section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10rpx 20rpx;
}

.title-left {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.title-right {
    font-size: 26rpx;
    color: #007aff;
}

.waterfall-item {
    background: white;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.product-info {
    padding: 20rpx;
}

.product-title {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
    margin-bottom: 10rpx;
}

.product-meta {
    display: flex;
    align-items: center;
    margin-bottom: 15rpx;
    gap: 10rpx;
}

.product-brand {
    font-size: 22rpx;
    color: #666;
    background: #f5f5f5;
    padding: 4rpx 8rpx;
    border-radius: 8rpx;
}

.product-alcohol {
    font-size: 22rpx;
    color: #ff6b7a;
    background: #fff0f1;
    padding: 4rpx 8rpx;
    border-radius: 8rpx;
}

.product-volume {
    font-size: 22rpx;
    color: #52c41a;
    background: #f6ffed;
    padding: 4rpx 8rpx;
    border-radius: 8rpx;
}

.product-price {
    display: flex;
    align-items: center;
    gap: 10rpx;
}

.current-price {
    font-size: 30rpx;
    font-weight: bold;
    color: #ff4757;
}

.original-price {
    font-size: 24rpx;
    color: #999;
    text-decoration: line-through;
}

.divider {
    margin-top: 40rpx;
}

.bg {
    background-size: cover;
    background-repeat: no-repeat;
}

.logo-wrap {
    display: flex;
    align-items: center;
}

.logo {
    height: 52rpx;
    width: auto;
}

.icon-md {
    width: 48rpx;
    height: 48rpx;
}

.main {
    padding-bottom: 40rpx;
}

/* 轮播图样式 */
.swiper-container {
    margin: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

/* 四宫格导航样式 */
.grid-nav {
    background: white;
    margin: 20rpx;
    border-radius: 20rpx;
    padding: 30rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .nav-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20rpx;
    }
    
    .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20rpx 10rpx;
        border-radius: 16rpx;
        transition: all 0.3s ease;
        
        &:active {
            background: #f8f9fa;
            transform: scale(0.95);
        }
    }
    
    .nav-icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16rpx;
        
        &.scan-icon {
            background: #e6f3ff;
        }
        
        &.device-icon {
            background: #f6ffed;
        }
        
        &.order-icon {
            background: #fff7e6;
        }
        
        &.wallet-icon {
            background: #fff2f0;
        }
    }
    
    .nav-text {
        font-size: 24rpx;
        color: #333;
        text-align: center;
        line-height: 1.2;
    }
}


/* 瀑布流样式 */
.waterfall-container {
    margin: 20rpx;
}

.section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding: 20rpx 10rpx;
    width: 100%;
    min-height: 80rpx;
}

.title-left {
    font-size: 32rpx;
    color: #333;
    font-weight: bold;
    flex: 0 0 auto;
}

.title-right {
    font-size: 24rpx;
    color: #999;
    flex: 0 0 auto;
    text-align: right;
}

.waterfall-item {
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    margin-bottom: 20rpx;
    margin-left: 10rpx;
    margin-right: 10rpx;
}

.product-info {
    padding: 20rpx;
}

.product-title {
    font-size: 28rpx;
    color: #333;
    line-height: 1.4;
    margin-bottom: 16rpx;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
}

.product-price {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-top: 16rpx;
}

.current-price {
    font-size: 32rpx;
    color: #ff4757;
    font-weight: bold;
}

.original-price {
    font-size: 24rpx;
    color: #999;
    text-decoration: line-through;
}
</style>
