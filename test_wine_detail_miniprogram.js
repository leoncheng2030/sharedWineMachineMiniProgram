// 模拟小程序环境的酒品详情API测试
// 这个文件模拟了小程序中的API调用过程

// 模拟uni-app的request方法
const mockUniRequest = (options) => {
    return new Promise((resolve, reject) => {
        const { url, method = 'GET', data, header = {} } = options;
        const baseUrl = 'http://localhost:8080';
        const fullUrl = baseUrl + url;
        
        console.log(`[模拟uni.request] ${method} ${fullUrl}`);
        console.log('[请求头]', header);
        if (data) console.log('[请求数据]', data);
        
        // 使用fetch模拟uni.request
        fetch(fullUrl, {
            method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...header
            },
            body: data ? JSON.stringify(data) : undefined
        })
        .then(response => {
            console.log(`[响应状态] ${response.status} ${response.statusText}`);
            return response.json();
        })
        .then(result => {
            console.log('[API响应]', result);
            
            // 模拟uni.request的成功回调格式
            resolve({
                data: result,
                statusCode: 200,
                header: {},
                cookies: []
            });
        })
        .catch(error => {
            console.error('[请求失败]', error);
            
            // 模拟uni.request的失败回调格式
            reject({
                errMsg: error.message,
                errno: -1
            });
        });
    });
};

// 模拟request工具函数
const request = {
    get: async function(url, data) {
        try {
            const response = await mockUniRequest({
                url: data ? `${url}?${new URLSearchParams(data).toString()}` : url,
                method: 'GET',
                header: {
                    'Accept': 'application/json'
                }
            });
            
            const result = response.data;
            
            // 检查业务响应码
            if (result.code === 200) {
                return result.data;
            } else {
                throw new Error(result.msg || '请求失败');
            }
        } catch (error) {
            console.error('Request Error:', error);
            throw error;
        }
    }
};

// 酒品API类（与实际代码一致）
class WineApi {
    /**
     * 获取酒品详情
     * @param productId 酒品ID
     * @returns 酒品详细信息
     */
    static async getWineDetail(productId) {
        return await request.get(`/miniprogram/wine/detail/${productId}`);
    }
    
    /**
     * 获取热门酒品
     * @param limit 数量限制，默认20个
     * @returns 热门酒品列表
     */
    static async getHotWines(limit = 20) {
        return await request.get(`/miniprogram/wine/hot?limit=${limit}`);
    }
    
    /**
     * 获取推荐酒品
     * @param limit 数量限制，默认10个
     * @returns 推荐酒品列表
     */
    static async getRecommendedWines(limit = 10) {
        return await request.get(`/miniprogram/wine/recommended?limit=${limit}`);
    }
}

// 测试函数
async function testWineDetailAPI() {
    console.log('=== 开始测试酒品详情API ===\n');
    
    const testCases = [
        {
            name: '测试获取酒品详情 - wine001（五粮液）',
            test: () => WineApi.getWineDetail('wine001')
        },
        {
            name: '测试获取酒品详情 - wine002（茅台）',
            test: () => WineApi.getWineDetail('wine002')
        },
        {
            name: '测试获取酒品详情 - 不存在的商品',
            test: () => WineApi.getWineDetail('wine999')
        },
        {
            name: '测试获取热门酒品列表',
            test: () => WineApi.getHotWines(5)
        },
        {
            name: '测试获取推荐酒品列表',
            test: () => WineApi.getRecommendedWines(3)
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n--- ${testCase.name} ---`);
        try {
            const result = await testCase.test();
            console.log('✅ 测试成功');
            
            if (Array.isArray(result)) {
                console.log(`📋 返回列表，共 ${result.length} 个商品`);
                result.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.productName} - ¥${item.currentPrice}`);
                });
            } else {
                console.log('📦 商品详情:');
                console.log(`  商品名称: ${result.productName}`);
                console.log(`  商品编码: ${result.productCode}`);
                console.log(`  品牌: ${result.brand}`);
                console.log(`  当前价格: ¥${result.currentPrice}`);
                console.log(`  建议零售价: ¥${result.suggestedPrice || '未设置'}`);
                console.log(`  酒精度: ${result.alcoholContent}°`);
                console.log(`  净含量: ${result.volume}ml`);
                console.log(`  产地: ${result.origin || '未知'}`);
                console.log(`  生产厂家: ${result.manufacturer || '未知'}`);
                console.log(`  商品描述: ${result.description || '无描述'}`);
            }
        } catch (error) {
            console.log('❌ 测试失败');
            console.log(`  错误信息: ${error.message}`);
        }
    }
    
    console.log('\n=== 酒品详情API测试完成 ===');
}

// 模拟小程序页面加载酒品详情的过程
async function simulateWineDetailPage(productId) {
    console.log(`\n=== 模拟酒品详情页面加载 (商品ID: ${productId}) ===`);
    
    try {
        // 1. 页面显示加载状态
        console.log('📱 页面状态: 显示加载中...');
        
        // 2. 调用API获取酒品详情
        console.log('🌐 开始请求酒品详情API...');
        const wineDetail = await WineApi.getWineDetail(productId);
        
        // 3. 页面渲染数据
        console.log('✅ API请求成功，开始渲染页面数据');
        console.log('🍷 酒品信息:');
        console.log(`  📝 商品名称: ${wineDetail.productName}`);
        console.log(`  🏷️ 商品编码: ${wineDetail.productCode}`);
        console.log(`  🏭 品牌: ${wineDetail.brand}`);
        console.log(`  💰 当前价格: ¥${wineDetail.currentPrice}`);
        
        if (wineDetail.suggestedPrice && wineDetail.suggestedPrice > wineDetail.currentPrice) {
            const discount = Math.round(wineDetail.currentPrice / wineDetail.suggestedPrice * 10);
            console.log(`  🏷️ 建议零售价: ¥${wineDetail.suggestedPrice} (${discount}折优惠)`);
        }
        
        console.log(`  🍺 酒精度: ${wineDetail.alcoholContent}°`);
        console.log(`  📏 净含量: ${wineDetail.volume}ml`);
        console.log(`  🌍 产地: ${wineDetail.origin || '未知'}`);
        console.log(`  🏭 生产厂家: ${wineDetail.manufacturer || '未知'}`);
        
        if (wineDetail.description) {
            console.log(`  📄 商品描述: ${wineDetail.description}`);
        }
        
        // 4. 加载推荐商品
        console.log('\n🔄 加载推荐商品...');
        const recommendProducts = await WineApi.getRecommendedWines(6);
        console.log(`📋 推荐商品列表 (${recommendProducts.length}个):`);
        recommendProducts.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.productName} - ¥${item.currentPrice}`);
        });
        
        console.log('\n✅ 酒品详情页面加载完成');
        
        return {
            success: true,
            wineDetail,
            recommendProducts
        };
        
    } catch (error) {
        console.log('❌ 页面加载失败');
        console.log(`  错误信息: ${error.message}`);
        console.log('📱 页面状态: 显示错误信息');
        
        return {
            success: false,
            error: error.message
        };
    }
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
    // 添加到全局作用域，方便在浏览器控制台中调用
    window.testWineDetailAPI = testWineDetailAPI;
    window.simulateWineDetailPage = simulateWineDetailPage;
    window.WineApi = WineApi;
    
    console.log('🚀 酒品详情API测试工具已加载');
    console.log('💡 可用函数:');
    console.log('  - testWineDetailAPI(): 运行完整的API测试');
    console.log('  - simulateWineDetailPage(productId): 模拟页面加载过程');
    console.log('  - WineApi.getWineDetail(productId): 直接调用API');
    console.log('\n示例用法:');
    console.log('  testWineDetailAPI()');
    console.log('  simulateWineDetailPage("wine001")');
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WineApi,
        testWineDetailAPI,
        simulateWineDetailPage
    };
}

// 自动运行测试（如果需要）
// testWineDetailAPI(); 