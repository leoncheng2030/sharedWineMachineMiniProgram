/**
 * 支付相关API
 * @author wqs
 * @date 2025/01/30
 */
import { request } from './request'

// 支付方式枚举
export enum PaymentType {
  WECHAT_MINI = 'WECHAT_MINI',
  WECHAT_H5 = 'WECHAT_H5',
  WECHAT_APP = 'WECHAT_APP',
  WECHAT_NATIVE = 'WECHAT_NATIVE',
  ALIPAY = 'ALIPAY',
  ALIPAY_H5 = 'ALIPAY_H5',
  ALIPAY_APP = 'ALIPAY_APP',
  BALANCE = 'BALANCE'
}

// 支付状态枚举
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUNDED = 'PARTIAL_REFUNDED',
  EXPIRED = 'EXPIRED'
}

// 微信支付创建参数
export interface WechatPayCreateParam {
  outTradeNo: string        // 商户订单号
  totalAmount: number       // 支付金额（元）
  description: string       // 商品描述
  openid?: string          // 用户openid（小程序支付必填）
  spbillCreateIp?: string  // 客户端IP
  attach?: string          // 附加数据
  timeExpire?: number      // 订单过期时间（分钟）
  payType: PaymentType     // 支付方式
}

// 微信支付创建结果
export interface WechatPayCreateResult {
  prepayId?: string        // 预支付交易会话标识
  codeUrl?: string         // 二维码链接（NATIVE支付）
  h5Url?: string          // H5支付跳转链接
  
  // 小程序支付参数
  timeStamp?: string       // 时间戳
  nonceStr?: string        // 随机字符串
  packageValue?: string    // 数据包
  signType?: string        // 签名方式
  paySign?: string         // 签名
  
  // APP支付参数
  appid?: string          // 应用ID
  partnerid?: string      // 商户号
  sign?: string           // 签名
}

// 支付查询参数
export interface PaymentQueryParam {
  outTradeNo?: string      // 商户订单号
  transactionId?: string   // 微信支付订单号
}

// 支付查询结果
export interface PaymentQueryResult {
  outTradeNo: string       // 商户订单号
  transactionId?: string   // 微信支付订单号
  tradeState: string       // 交易状态
  tradeStateDesc?: string  // 交易状态描述
  bankType?: string        // 付款银行
  totalAmount: number      // 订单金额
  payerTotal?: number      // 用户支付金额
  currency?: string        // 货币类型
  payerCurrency?: string   // 用户货币类型
  successTime?: string     // 支付完成时间
  openid?: string         // 用户标识
}

// 退款参数
export interface RefundParam {
  outTradeNo?: string      // 商户订单号
  transactionId?: string   // 微信支付订单号
  outRefundNo: string      // 商户退款单号
  refundAmount: number     // 退款金额
  totalAmount: number      // 原订单金额
  reason?: string          // 退款原因
}

// 退款结果
export interface RefundResult {
  refundId: string         // 微信退款单号
  outRefundNo: string      // 商户退款单号
  transactionId?: string   // 微信支付订单号
  outTradeNo: string       // 商户订单号
  channel?: string         // 退款渠道
  userReceivedAccount?: string // 退款入账账户
  successTime?: string     // 退款成功时间
  createTime: string       // 退款创建时间
  status: string           // 退款状态
  totalAmount: number      // 订单金额
  refundAmount: number     // 退款金额
  currency?: string        // 货币类型
}

/**
 * 支付API类
 */
class PaymentApi {
  
  /**
   * 创建微信支付订单
   */
  createWechatPayOrder(param: WechatPayCreateParam): Promise<WechatPayCreateResult> {
    return request('/miniprogram/payment/wechat/create', param, 'POST')
  }

  /**
   * 查询支付订单状态
   */
  queryPaymentOrder(param: PaymentQueryParam): Promise<PaymentQueryResult> {
    return request('/miniprogram/payment/wechat/query', param, 'POST')
  }

  /**
   * 查询支付状态（别名方法）
   */
  queryPaymentStatus(param: PaymentQueryParam): Promise<PaymentQueryResult> {
    return this.queryPaymentOrder(param)
  }

  /**
   * 申请退款
   */
  refundOrder(param: RefundParam): Promise<RefundResult> {
    return request('/miniprogram/payment/wechat/refund', param, 'POST')
  }

  /**
   * 查询退款状态
   */
  queryRefund(refundId: string): Promise<RefundResult> {
    return request('/miniprogram/payment/wechat/refund/query', { refundId }, 'GET')
  }

  /**
   * 关闭支付订单
   */
  closeOrder(outTradeNo: string): Promise<boolean> {
    return request('/miniprogram/payment/wechat/close', { outTradeNo }, 'POST')
  }

  /**
   * 微信小程序支付
   * @param orderData 订单数据
   * @param openid 用户openid
   */
  async wechatMiniPay(orderData: {
    orderNo: string
    amount: number
    description: string
    attach?: string
  }, openid: string): Promise<void> {
    try {
      // 1. 创建支付订单
      const payParam: WechatPayCreateParam = {
        outTradeNo: orderData.orderNo,
        totalAmount: orderData.amount,
        description: orderData.description,
        openid: openid,
        payType: PaymentType.WECHAT_MINI,
        attach: orderData.attach,
        timeExpire: 30 // 30分钟过期
      }
      
      const payResult = await this.createWechatPayOrder(payParam)
      
      // 2. 调用微信支付
      return new Promise((resolve, reject) => {
        uni.requestPayment({
          provider: 'wxpay',
          orderInfo: {
            timeStamp: payResult.timeStamp!,
            nonceStr: payResult.nonceStr!,
            package: payResult.packageValue!,
            signType: payResult.signType!,
            paySign: payResult.paySign!
          },
          success: (res) => {
            console.log('支付成功', res)
            uni.showToast({
              title: '支付成功',
              icon: 'success'
            })
            resolve()
          },
          fail: (err) => {
            console.error('支付失败', err)
            if (err.errMsg?.includes('cancel')) {
              uni.showToast({
                title: '支付已取消',
                icon: 'none'
              })
            } else {
              uni.showToast({
                title: '支付失败',
                icon: 'error'
              })
            }
            reject(err)
          }
        })
      })
    } catch (error) {
      console.error('创建支付订单失败', error)
      uni.showToast({
        title: '创建支付订单失败',
        icon: 'error'
      })
      throw error
    }
  }

  /**
   * 轮询查询支付结果
   * @param outTradeNo 商户订单号
   * @param maxAttempts 最大查询次数
   * @param interval 查询间隔（毫秒）
   */
  async pollPaymentResult(
    outTradeNo: string, 
    maxAttempts: number = 10, 
    interval: number = 2000
  ): Promise<PaymentQueryResult> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await this.queryPaymentOrder({ outTradeNo })
        
        // 如果支付成功或失败，返回结果
        if (result.tradeState === 'SUCCESS' || 
            result.tradeState === 'CLOSED' || 
            result.tradeState === 'REVOKED' ||
            result.tradeState === 'PAYERROR') {
          return result
        }
        
        // 等待指定时间后继续查询
        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, interval))
        }
      } catch (error) {
        console.error(`第${i + 1}次查询支付结果失败`, error)
        if (i === maxAttempts - 1) {
          throw error
        }
      }
    }
    
    throw new Error('查询支付结果超时')
  }

  /**
   * 生成订单号
   */
  generateOrderNo(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `WQS${timestamp}${random}`
  }
}

// 导出支付API实例
export const paymentApi = new PaymentApi()

// 导出类型和枚举
export default paymentApi 