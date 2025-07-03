# Component Documentation - 自助售酒机小程序端

## Overview
This document provides detailed documentation for all UI components used in the wine vending machine mini-program.

## Table of Contents
- [Core Components](#core-components)
- [Layout Components](#layout-components)
- [Form Components](#form-components)
- [Display Components](#display-components)
- [Navigation Components](#navigation-components)
- [Utility Components](#utility-components)

---

## Core Components

### `<App />`
The root application component that handles global state and routing.

**Props:**
- None (Root component)

**State Management:**
- User authentication state
- Current machine connection
- Global loading states
- Error handling

**Example:**
```javascript
// app.js
import App from './components/App';

App({
  globalData: {
    userInfo: null,
    currentMachine: null
  }
});
```

### `<PageContainer />`
Wrapper component for all pages with consistent layout and error boundaries.

**Props:**
- `title` (String): Page title
- `showNavBar` (Boolean): Whether to show navigation bar
- `loading` (Boolean): Show loading spinner
- `error` (String): Error message to display

**Example:**
```javascript
<PageContainer 
  title="酒品选择"
  showNavBar={true}
  loading={isLoading}
  error={errorMessage}
>
  {/* Page content */}
</PageContainer>
```

---

## Layout Components

### `<Header />`
Top navigation header with title and action buttons.

**Props:**
- `title` (String): Header title
- `showBack` (Boolean): Show back button
- `rightAction` (Object): Right side action button
  - `text` (String): Button text
  - `icon` (String): Icon name
  - `onPress` (Function): Click handler

**Example:**
```javascript
<Header 
  title="我的订单"
  showBack={true}
  rightAction={{
    text: "帮助",
    icon: "help",
    onPress: () => showHelp()
  }}
/>
```

### `<TabBar />`
Bottom tab navigation component.

**Props:**
- `activeTab` (String): Current active tab
- `onTabChange` (Function): Tab change handler
- `tabs` (Array): Tab configuration

**Example:**
```javascript
<TabBar 
  activeTab="home"
  onTabChange={(tab) => navigateToTab(tab)}
  tabs={[
    { id: 'home', label: '首页', icon: 'home' },
    { id: 'orders', label: '订单', icon: 'order' },
    { id: 'profile', label: '我的', icon: 'user' }
  ]}
/>
```

### `<Grid />`
Responsive grid layout component.

**Props:**
- `columns` (Number): Number of columns (default: 2)
- `gap` (Number): Gap between items in rpx
- `children` (ReactNode): Grid items

**Example:**
```javascript
<Grid columns={2} gap={20}>
  <ProductCard product={product1} />
  <ProductCard product={product2} />
  <ProductCard product={product3} />
  <ProductCard product={product4} />
</Grid>
```

---

## Form Components

### `<LoginForm />`
User authentication form with phone and SMS verification.

**Props:**
- `onLoginSuccess` (Function): Success callback
- `onLoginError` (Function): Error callback

**Example:**
```javascript
<LoginForm 
  onLoginSuccess={(user) => {
    console.log('User logged in:', user);
    redirectToHome();
  }}
  onLoginError={(error) => {
    showToast(error.message);
  }}
/>
```

### `<PhoneInput />`
Phone number input with validation.

**Props:**
- `value` (String): Current phone number
- `onChange` (Function): Value change handler
- `placeholder` (String): Input placeholder
- `disabled` (Boolean): Whether input is disabled

**Example:**
```javascript
<PhoneInput 
  value={phone}
  onChange={(value) => setPhone(value)}
  placeholder="请输入手机号"
  disabled={isLoading}
/>
```

### `<VerificationCode />`
SMS verification code input with countdown timer.

**Props:**
- `phone` (String): Phone number for sending SMS
- `onCodeChange` (Function): Code change handler
- `onSendCode` (Function): Send code handler

**Example:**
```javascript
<VerificationCode 
  phone="13800138000"
  onCodeChange={(code) => setVerificationCode(code)}
  onSendCode={() => sendSMSCode()}
/>
```

### `<QuantitySelector />`
Product quantity selection component.

**Props:**
- `value` (Number): Current quantity
- `min` (Number): Minimum quantity (default: 1)
- `max` (Number): Maximum quantity
- `onChange` (Function): Quantity change handler

**Example:**
```javascript
<QuantitySelector 
  value={quantity}
  min={1}
  max={product.stock}
  onChange={(qty) => setQuantity(qty)}
/>
```

---

## Display Components

### `<ProductCard />`
Product display card with image, name, price, and action button.

**Props:**
- `product` (Object): Product data
  - `id` (String): Product ID
  - `name` (String): Product name
  - `price` (Number): Product price
  - `image` (String): Product image URL
  - `stock` (Number): Available stock
- `onSelect` (Function): Selection handler
- `selected` (Boolean): Whether product is selected

**Example:**
```javascript
<ProductCard 
  product={{
    id: 'P001',
    name: '法国波尔多红酒',
    price: 298.00,
    image: '/images/bordeaux.jpg',
    stock: 3
  }}
  onSelect={(product) => selectProduct(product)}
  selected={selectedProduct?.id === 'P001'}
/>
```

### `<MachineInfo />`
Displays current machine information and status.

**Props:**
- `machine` (Object): Machine data
  - `id` (String): Machine ID
  - `location` (String): Machine location
  - `status` (String): Machine status
- `showDetails` (Boolean): Show detailed information

**Example:**
```javascript
<MachineInfo 
  machine={{
    id: 'WM001',
    location: '万达广场1楼南门',
    status: 'online'
  }}
  showDetails={true}
/>
```

### `<OrderCard />`
Order display card for order history.

**Props:**
- `order` (Object): Order data
- `onViewDetails` (Function): View details handler
- `showStatus` (Boolean): Show order status

**Example:**
```javascript
<OrderCard 
  order={{
    id: 'ORD123',
    productName: '法国波尔多红酒',
    quantity: 1,
    total: 298.00,
    status: 'completed',
    createTime: '2025-07-03 12:30:00'
  }}
  onViewDetails={(order) => showOrderDetails(order)}
  showStatus={true}
/>
```

### `<PriceDisplay />`
Formatted price display component.

**Props:**
- `price` (Number): Price value
- `currency` (String): Currency symbol (default: '¥')
- `size` (String): Text size ('small', 'medium', 'large')

**Example:**
```javascript
<PriceDisplay 
  price={298.00}
  currency="¥"
  size="large"
/>
```

---

## Navigation Components

### `<BackButton />`
Back navigation button.

**Props:**
- `onPress` (Function): Custom back handler
- `text` (String): Button text (default: '返回')

**Example:**
```javascript
<BackButton 
  onPress={() => customBackHandler()}
  text="返回上一步"
/>
```

### `<NavigationMenu />`
Sliding navigation menu.

**Props:**
- `visible` (Boolean): Menu visibility
- `onClose` (Function): Close handler
- `menuItems` (Array): Menu items configuration

**Example:**
```javascript
<NavigationMenu 
  visible={showMenu}
  onClose={() => setShowMenu(false)}
  menuItems={[
    { label: '帮助中心', icon: 'help', action: () => showHelp() },
    { label: '联系客服', icon: 'service', action: () => contactService() }
  ]}
/>
```

---

## Utility Components

### `<LoadingSpinner />`
Loading indicator component.

**Props:**
- `size` (String): Spinner size ('small', 'medium', 'large')
- `text` (String): Loading text
- `overlay` (Boolean): Show overlay background

**Example:**
```javascript
<LoadingSpinner 
  size="medium"
  text="正在加载..."
  overlay={true}
/>
```

### `<Toast />`
Toast notification component.

**Props:**
- `message` (String): Toast message
- `type` (String): Toast type ('success', 'error', 'warning', 'info')
- `duration` (Number): Display duration in ms
- `onClose` (Function): Close handler

**Example:**
```javascript
<Toast 
  message="操作成功"
  type="success"
  duration={3000}
  onClose={() => hideToast()}
/>
```

### `<Modal />`
Modal dialog component.

**Props:**
- `visible` (Boolean): Modal visibility
- `title` (String): Modal title
- `closable` (Boolean): Show close button
- `onClose` (Function): Close handler
- `children` (ReactNode): Modal content

**Example:**
```javascript
<Modal 
  visible={showModal}
  title="确认购买"
  closable={true}
  onClose={() => setShowModal(false)}
>
  <Text>确定要购买此商品吗？</Text>
  <View className="modal-actions">
    <Button onPress={() => confirmPurchase()}>确认</Button>
    <Button onPress={() => setShowModal(false)}>取消</Button>
  </View>
</Modal>
```

### `<QRScanner />`
QR code scanning component.

**Props:**
- `onScanSuccess` (Function): Scan success handler
- `onScanError` (Function): Scan error handler
- `scanType` (String): Scan type ('machine', 'payment')

**Example:**
```javascript
<QRScanner 
  onScanSuccess={(result) => {
    console.log('QR Code:', result);
    handleMachineConnection(result);
  }}
  onScanError={(error) => {
    console.error('Scan failed:', error);
    showToast('扫码失败，请重试');
  }}
  scanType="machine"
/>
```

### `<ImageUploader />`
Image upload component with preview.

**Props:**
- `onUpload` (Function): Upload handler
- `maxSize` (Number): Max file size in MB
- `accept` (String): Accepted file types

**Example:**
```javascript
<ImageUploader 
  onUpload={(file) => uploadImage(file)}
  maxSize={5}
  accept="image/*"
/>
```

---

## Component States

### Loading States
All components support loading states for better UX:

```javascript
// Loading state example
const [loading, setLoading] = useState(false);

<ProductCard 
  product={product}
  loading={loading}
  onSelect={async (product) => {
    setLoading(true);
    try {
      await selectProduct(product);
    } finally {
      setLoading(false);
    }
  }}
/>
```

### Error States
Components handle and display errors gracefully:

```javascript
// Error state example
const [error, setError] = useState(null);

<PageContainer error={error}>
  {/* Page content */}
</PageContainer>
```

### Empty States
Components show appropriate empty states:

```javascript
// Empty state example
<Grid>
  {products.length === 0 ? (
    <EmptyState 
      message="暂无商品"
      action={{
        text: "刷新",
        onPress: () => refreshProducts()
      }}
    />
  ) : (
    products.map(product => (
      <ProductCard key={product.id} product={product} />
    ))
  )}
</Grid>
```

---

## Styling Guidelines

### CSS Classes
Components use consistent CSS class naming:

```css
/* Component structure */
.component-name {}
.component-name__element {}
.component-name__element--modifier {}

/* Examples */
.product-card {}
.product-card__image {}
.product-card__title {}
.product-card__price {}
.product-card--selected {}
```

### Theme Variables
Use theme variables for consistent styling:

```css
/* Theme colors */
--primary-color: #d32f2f;
--secondary-color: #757575;
--success-color: #388e3c;
--error-color: #d32f2f;
--warning-color: #f57c00;

/* Typography */
--font-size-small: 24rpx;
--font-size-medium: 28rpx;
--font-size-large: 32rpx;

/* Spacing */
--spacing-xs: 8rpx;
--spacing-sm: 16rpx;
--spacing-md: 24rpx;
--spacing-lg: 32rpx;
--spacing-xl: 48rpx;
```

---

## Accessibility

All components follow accessibility best practices:

1. **Proper labeling**: All interactive elements have descriptive labels
2. **Focus management**: Logical tab order and focus indicators
3. **Color contrast**: Sufficient contrast ratios for text and backgrounds
4. **Screen reader support**: Proper semantic markup and ARIA attributes

## Testing

Component testing examples:

```javascript
// Example component test
import { render, fireEvent } from '@testing-library/react';
import ProductCard from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: 'P001',
    name: 'Test Wine',
    price: 100.00,
    image: '/test.jpg'
  };

  it('renders product information correctly', () => {
    const { getByText } = render(
      <ProductCard product={mockProduct} />
    );
    
    expect(getByText('Test Wine')).toBeInTheDocument();
    expect(getByText('¥100.00')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    const { container } = render(
      <ProductCard product={mockProduct} onSelect={onSelect} />
    );
    
    fireEvent.click(container.firstChild);
    expect(onSelect).toHaveBeenCalledWith(mockProduct);
  });
});
```