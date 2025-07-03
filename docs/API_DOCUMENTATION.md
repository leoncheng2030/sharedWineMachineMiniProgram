# API Documentation - 自助售酒机小程序端

## Overview
This document provides comprehensive documentation for all public APIs, functions, and components in the self-service wine vending machine mini-program.

## Table of Contents
- [Authentication APIs](#authentication-apis)
- [Machine Management APIs](#machine-management-apis)
- [Product Management APIs](#product-management-apis)
- [Order Management APIs](#order-management-apis)
- [Payment APIs](#payment-apis)
- [User Management APIs](#user-management-apis)
- [Components](#components)
- [Utilities](#utilities)

---

## Authentication APIs

### `auth.login(credentials)`
Authenticates a user with the wine vending machine system.

**Parameters:**
- `credentials` (Object): User authentication data
  - `phone` (String): User's phone number
  - `code` (String): SMS verification code

**Returns:**
- `Promise<AuthResponse>`: Authentication result

**Example:**
```javascript
const authResult = await auth.login({
  phone: '13800138000',
  code: '123456'
});

if (authResult.success) {
  console.log('Login successful:', authResult.token);
}
```

**Response Format:**
```javascript
{
  success: true,
  token: "jwt_token_here",
  user: {
    id: 12345,
    phone: "13800138000",
    nickname: "User Name"
  }
}
```

### `auth.logout()`
Logs out the current user and clears authentication data.

**Returns:**
- `Promise<void>`

**Example:**
```javascript
await auth.logout();
console.log('User logged out successfully');
```

---

## Machine Management APIs

### `machine.getMachineInfo(machineId)`
Retrieves information about a specific wine vending machine.

**Parameters:**
- `machineId` (String): Unique identifier of the machine

**Returns:**
- `Promise<MachineInfo>`: Machine details

**Example:**
```javascript
const machineInfo = await machine.getMachineInfo('WM001');
console.log('Machine location:', machineInfo.location);
```

**Response Format:**
```javascript
{
  id: "WM001",
  location: "商场A座1楼",
  status: "online",
  products: [
    {
      id: "P001",
      name: "红酒A",
      price: 128.00,
      stock: 5
    }
  ]
}
```

### `machine.scanQRCode()`
Scans QR code to identify and connect to a machine.

**Returns:**
- `Promise<MachineInfo>`: Scanned machine information

**Example:**
```javascript
try {
  const machine = await machine.scanQRCode();
  console.log('Connected to machine:', machine.id);
} catch (error) {
  console.error('QR scan failed:', error);
}
```

---

## Product Management APIs

### `product.getProductList(machineId)`
Retrieves available products from a specific machine.

**Parameters:**
- `machineId` (String): Machine identifier

**Returns:**
- `Promise<Product[]>`: Array of available products

**Example:**
```javascript
const products = await product.getProductList('WM001');
products.forEach(item => {
  console.log(`${item.name}: ¥${item.price}`);
});
```

### `product.getProductDetail(productId)`
Gets detailed information about a specific product.

**Parameters:**
- `productId` (String): Product identifier

**Returns:**
- `Promise<ProductDetail>`: Detailed product information

**Example:**
```javascript
const detail = await product.getProductDetail('P001');
console.log('Product description:', detail.description);
```

---

## Order Management APIs

### `order.createOrder(orderData)`
Creates a new order for wine purchase.

**Parameters:**
- `orderData` (Object): Order information
  - `machineId` (String): Machine ID
  - `productId` (String): Product ID
  - `quantity` (Number): Quantity to purchase

**Returns:**
- `Promise<Order>`: Created order object

**Example:**
```javascript
const order = await order.createOrder({
  machineId: 'WM001',
  productId: 'P001',
  quantity: 1
});
console.log('Order created:', order.id);
```

### `order.getOrderHistory(userId)`
Retrieves order history for a user.

**Parameters:**
- `userId` (String): User identifier

**Returns:**
- `Promise<Order[]>`: Array of user orders

**Example:**
```javascript
const history = await order.getOrderHistory('U123');
history.forEach(order => {
  console.log(`Order ${order.id}: ${order.status}`);
});
```

---

## Payment APIs

### `payment.initiatePayment(orderId, paymentMethod)`
Initiates payment process for an order.

**Parameters:**
- `orderId` (String): Order identifier
- `paymentMethod` (String): Payment method ('wechat', 'alipay')

**Returns:**
- `Promise<PaymentResponse>`: Payment initialization result

**Example:**
```javascript
const payment = await payment.initiatePayment('ORDER123', 'wechat');
if (payment.success) {
  // Redirect to payment page
  wx.requestPayment(payment.params);
}
```

### `payment.verifyPayment(orderId)`
Verifies payment status for an order.

**Parameters:**
- `orderId` (String): Order identifier

**Returns:**
- `Promise<PaymentStatus>`: Payment verification result

**Example:**
```javascript
const status = await payment.verifyPayment('ORDER123');
if (status.paid) {
  console.log('Payment confirmed');
}
```

---

## Components

### `<MachineScanner />`
QR code scanner component for machine identification.

**Props:**
- `onScanSuccess` (Function): Callback when scan succeeds
- `onScanError` (Function): Callback when scan fails

**Example:**
```javascript
<MachineScanner 
  onScanSuccess={(machineInfo) => {
    console.log('Machine found:', machineInfo);
  }}
  onScanError={(error) => {
    console.error('Scan error:', error);
  }}
/>
```

### `<ProductCard />`
Displays product information in a card format.

**Props:**
- `product` (Object): Product data
- `onSelect` (Function): Callback when product is selected

**Example:**
```javascript
<ProductCard 
  product={{
    id: 'P001',
    name: '红酒A',
    price: 128.00,
    image: '/images/wine-a.jpg'
  }}
  onSelect={(product) => {
    console.log('Selected:', product.name);
  }}
/>
```

### `<OrderSummary />`
Displays order summary and total.

**Props:**
- `order` (Object): Order data
- `onConfirm` (Function): Callback when order is confirmed

**Example:**
```javascript
<OrderSummary 
  order={{
    product: '红酒A',
    quantity: 1,
    total: 128.00
  }}
  onConfirm={(order) => {
    // Proceed to payment
  }}
/>
```

### `<PaymentModal />`
Modal component for payment processing.

**Props:**
- `visible` (Boolean): Modal visibility
- `order` (Object): Order to pay for
- `onPaymentComplete` (Function): Callback when payment completes

**Example:**
```javascript
<PaymentModal 
  visible={showPayment}
  order={currentOrder}
  onPaymentComplete={(result) => {
    if (result.success) {
      console.log('Payment successful');
    }
  }}
/>
```

---

## Utilities

### `formatPrice(price)`
Formats price for display.

**Parameters:**
- `price` (Number): Price value

**Returns:**
- `String`: Formatted price string

**Example:**
```javascript
const formattedPrice = formatPrice(128.00);
// Returns: "¥128.00"
```

### `validatePhone(phone)`
Validates phone number format.

**Parameters:**
- `phone` (String): Phone number to validate

**Returns:**
- `Boolean`: True if valid

**Example:**
```javascript
const isValid = validatePhone('13800138000');
// Returns: true
```

### `generateOrderId()`
Generates a unique order identifier.

**Returns:**
- `String`: Unique order ID

**Example:**
```javascript
const orderId = generateOrderId();
// Returns: "ORD20250703123456789"
```

---

## Error Handling

All APIs use consistent error handling patterns:

```javascript
try {
  const result = await someAPI();
  // Handle success
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error based on error.code
  switch (error.code) {
    case 'NETWORK_ERROR':
      // Handle network issues
      break;
    case 'AUTH_REQUIRED':
      // Handle authentication errors
      break;
    case 'INSUFFICIENT_STOCK':
      // Handle stock issues
      break;
    default:
      // Handle other errors
  }
}
```

## Response Codes

| Code | Description | Action Required |
|------|-------------|-----------------|
| 200 | Success | None |
| 401 | Unauthorized | Re-authenticate user |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify resource exists |
| 409 | Conflict | Handle data conflicts |
| 500 | Server Error | Retry or contact support |

---

## Getting Started

1. **Initialize the app:**
```javascript
import { initApp } from './app';

initApp({
  apiBaseUrl: 'https://api.wineterminal.com',
  appId: 'your-app-id'
});
```

2. **Set up authentication:**
```javascript
import { auth } from './services/auth';

// Check if user is already logged in
if (auth.isAuthenticated()) {
  // User is logged in
} else {
  // Redirect to login
}
```

3. **Handle machine connection:**
```javascript
import { machine } from './services/machine';

// Scan QR code to connect
const machineInfo = await machine.scanQRCode();
// Store machine info for current session
```

## Best Practices

1. **Always handle errors gracefully**
2. **Cache frequently accessed data**
3. **Validate user input before API calls**
4. **Use loading states for better UX**
5. **Implement retry logic for network calls**
6. **Follow WeChat Mini Program guidelines**

## Support

For questions or issues:
- Email: support@wineterminal.com
- Documentation: https://docs.wineterminal.com
- Issue Tracker: https://github.com/wineterminal/issues