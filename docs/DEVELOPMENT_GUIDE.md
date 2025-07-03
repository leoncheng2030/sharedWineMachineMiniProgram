# Development Guide - 自助售酒机小程序端

## Overview
This guide provides comprehensive instructions for developing, building, and maintaining the wine vending machine mini-program.

## Table of Contents
- [Project Setup](#project-setup)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Building and Deployment](#building-and-deployment)
- [Troubleshooting](#troubleshooting)

---

## Project Setup

### Prerequisites
- Node.js (v16 or higher)
- WeChat Developer Tools
- Git
- NPM or Yarn package manager

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/sharedWineMachineMiniProgram.git
cd sharedWineMachineMiniProgram
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Configure environment:**
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

4. **WeChat Developer Tools setup:**
- Download and install WeChat Developer Tools
- Import the project directory
- Configure AppID in `project.config.json`

---

## Development Environment

### Required Environment Variables

```bash
# .env.local
MINI_PROGRAM_APP_ID=your_app_id
API_BASE_URL=https://api.example.com
WECHAT_PAY_MERCHANT_ID=your_merchant_id
WECHAT_PAY_KEY=your_pay_key
```

### WeChat Developer Tools Configuration

```json
// project.config.json
{
  "appid": "your_app_id",
  "projectname": "WineMachine",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram"
}
```

---

## Project Structure

```
src/
├── app.js                 # Application entry point
├── app.json              # Global configuration
├── app.wxss              # Global styles
├── pages/                # Page components
│   ├── index/            # Home page
│   ├── login/            # Login page
│   ├── products/         # Product selection
│   ├── order/            # Order confirmation
│   ├── payment/          # Payment processing
│   └── profile/          # User profile
├── components/           # Reusable components
│   ├── machine-scanner/  # QR scanner component
│   ├── product-card/     # Product display
│   ├── order-summary/    # Order summary
│   └── payment-modal/    # Payment modal
├── services/             # API services
│   ├── auth.js           # Authentication
│   ├── machine.js        # Machine management
│   ├── product.js        # Product management
│   ├── order.js          # Order management
│   └── payment.js        # Payment processing
├── utils/                # Utility functions
│   ├── request.js        # HTTP request wrapper
│   ├── storage.js        # Local storage helper
│   ├── validation.js     # Input validation
│   └── formatters.js     # Data formatters
├── assets/               # Static assets
│   ├── images/           # Image files
│   ├── icons/            # Icon files
│   └── fonts/            # Font files
└── styles/               # Shared styles
    ├── variables.wxss    # CSS variables
    ├── mixins.wxss       # CSS mixins
    └── theme.wxss        # Theme styles
```

---

## Development Workflow

### Starting Development

1. **Start the development server:**
```bash
npm run dev
# or
yarn dev
```

2. **Open WeChat Developer Tools**
3. **Import the project directory**
4. **Enable live reload for faster development**

### Feature Development Process

1. **Create feature branch:**
```bash
git checkout -b feature/new-feature-name
```

2. **Develop the feature:**
   - Write component code
   - Add corresponding styles
   - Implement API integration
   - Add unit tests

3. **Test the feature:**
```bash
npm run test
npm run lint
```

4. **Submit pull request:**
```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/new-feature-name
```

### Page Development

#### Creating a New Page

1. **Create page directory:**
```bash
mkdir src/pages/new-page
```

2. **Create page files:**
```javascript
// src/pages/new-page/index.js
Page({
  data: {
    // Page data
  },
  
  onLoad() {
    // Page initialization
  },
  
  // Page methods
});
```

```json
// src/pages/new-page/index.json
{
  "navigationBarTitleText": "Page Title",
  "usingComponents": {
    "custom-component": "/components/custom-component/index"
  }
}
```

```xml
<!-- src/pages/new-page/index.wxml -->
<view class="page-container">
  <!-- Page content -->
</view>
```

```css
/* src/pages/new-page/index.wxss */
.page-container {
  padding: 32rpx;
}
```

3. **Register page in app.json:**
```json
{
  "pages": [
    "pages/index/index",
    "pages/new-page/index"
  ]
}
```

#### Component Development

1. **Create component directory:**
```bash
mkdir src/components/new-component
```

2. **Create component files:**
```javascript
// src/components/new-component/index.js
Component({
  properties: {
    // Component properties
  },
  
  data: {
    // Component data
  },
  
  methods: {
    // Component methods
  }
});
```

```json
// src/components/new-component/index.json
{
  "component": true,
  "usingComponents": {}
}
```

---

## Coding Standards

### JavaScript/ES6+ Guidelines

1. **Use ES6+ features:**
```javascript
// Good: Arrow functions
const processOrder = (order) => {
  return order.total * 1.1; // Add tax
};

// Good: Destructuring
const { id, name, price } = product;

// Good: Template literals
const message = `Order ${orderId} has been confirmed`;
```

2. **Error handling:**
```javascript
// Always handle async operations
try {
  const result = await api.createOrder(orderData);
  this.handleSuccess(result);
} catch (error) {
  this.handleError(error);
}
```

3. **Function naming:**
```javascript
// Use descriptive names
const validatePhoneNumber = (phone) => { /* ... */ };
const formatCurrency = (amount) => { /* ... */ };
const calculateOrderTotal = (items) => { /* ... */ };
```

### WXML Guidelines

1. **Use semantic elements:**
```xml
<!-- Good -->
<view class="product-list">
  <view class="product-item" wx:for="{{products}}" wx:key="id">
    <image class="product-image" src="{{item.image}}" />
    <text class="product-name">{{item.name}}</text>
    <text class="product-price">¥{{item.price}}</text>
  </view>
</view>
```

2. **Event binding:**
```xml
<!-- Good: Use data attributes for parameters -->
<button 
  bindtap="onProductSelect" 
  data-product-id="{{item.id}}"
>
  选择商品
</button>
```

### WXSS Guidelines

1. **Use CSS custom properties:**
```css
/* Define in app.wxss */
:root {
  --primary-color: #d32f2f;
  --secondary-color: #757575;
  --border-radius: 8rpx;
}

/* Use in components */
.button-primary {
  background-color: var(--primary-color);
  border-radius: var(--border-radius);
}
```

2. **BEM methodology:**
```css
.product-card {}
.product-card__image {}
.product-card__title {}
.product-card__price {}
.product-card--selected {}
```

3. **Responsive design:**
```css
.container {
  width: 100%;
  max-width: 750rpx;
  margin: 0 auto;
}

@media (max-width: 600rpx) {
  .container {
    padding: 16rpx;
  }
}
```

---

## Testing

### Unit Testing

```javascript
// tests/utils/validation.test.js
import { validatePhone, validatePrice } from '../../src/utils/validation';

describe('Validation Utils', () => {
  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('13800138000')).toBe(true);
      expect(validatePhone('15912345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
    });
  });

  describe('validatePrice', () => {
    it('should validate positive numbers', () => {
      expect(validatePrice(100)).toBe(true);
      expect(validatePrice(99.99)).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(validatePrice(0)).toBe(false);
      expect(validatePrice(-10)).toBe(false);
    });
  });
});
```

### Integration Testing

```javascript
// tests/services/auth.test.js
import authService from '../../src/services/auth';

describe('Auth Service', () => {
  beforeEach(() => {
    // Setup test environment
  });

  it('should login successfully with valid credentials', async () => {
    const credentials = {
      phone: '13800138000',
      code: '123456'
    };

    const result = await authService.login(credentials);
    
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
  });

  it('should handle login errors gracefully', async () => {
    const credentials = {
      phone: '13800138000',
      code: 'invalid'
    };

    await expect(authService.login(credentials))
      .rejects.toThrow('Invalid verification code');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- validation.test.js
```

---

## Building and Deployment

### Build Process

1. **Production build:**
```bash
npm run build:prod
```

2. **Development build:**
```bash
npm run build:dev
```

3. **Build configuration:**
```javascript
// build/webpack.config.js
module.exports = {
  mode: process.env.NODE_ENV,
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'app.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};
```

### Deployment

#### WeChat Mini Program Deployment

1. **Upload to WeChat:**
   - Open WeChat Developer Tools
   - Click "Upload" button
   - Enter version number and description
   - Submit for review

2. **Release process:**
   - Submit for review
   - Wait for approval
   - Release to production

#### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Mini Program

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build:prod
    
    - name: Deploy
      run: npm run deploy
```

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Problem:** Build fails with module not found error
```bash
Error: Cannot resolve module 'components/custom-component'
```

**Solution:**
- Check file paths in imports
- Verify component registration in JSON files
- Ensure proper component directory structure

#### 2. API Connection Issues

**Problem:** Network requests fail in development
```javascript
Error: Request failed with status 404
```

**Solution:**
- Check API base URL configuration
- Verify request headers and authentication
- Enable request debugging in WeChat Developer Tools

#### 3. Payment Integration Issues

**Problem:** WeChat Pay initialization fails
```javascript
Error: Payment parameters invalid
```

**Solution:**
- Verify merchant ID and key configuration
- Check payment parameter format
- Ensure proper SSL certificate setup

#### 4. Performance Issues

**Problem:** App loads slowly or crashes
**Solution:**
- Optimize image sizes and formats
- Implement lazy loading for components
- Use data caching strategies
- Monitor memory usage

### Debug Tools

1. **WeChat Developer Tools Console:**
   - View console logs and errors
   - Inspect network requests
   - Monitor performance metrics

2. **Remote debugging:**
```javascript
// Enable debug mode
wx.setEnableDebug({
  enableDebug: true
});
```

3. **Performance monitoring:**
```javascript
// Monitor page load time
const startTime = Date.now();
wx.onPageLoad(() => {
  const loadTime = Date.now() - startTime;
  console.log(`Page loaded in ${loadTime}ms`);
});
```

### Getting Help

1. **Documentation:**
   - [WeChat Mini Program Official Docs](https://developers.weixin.qq.com/miniprogram/dev/)
   - [Project Wiki](./wiki)

2. **Support channels:**
   - Internal Slack channel: #wine-machine-dev
   - Email: dev-support@example.com
   - GitHub Issues

3. **Code review process:**
   - All code must be reviewed before merging
   - Use descriptive commit messages
   - Include tests for new features

---

## Best Practices

1. **Performance:**
   - Minimize bundle size
   - Optimize images
   - Use efficient data structures
   - Implement proper caching

2. **Security:**
   - Validate all user inputs
   - Use HTTPS for all API calls
   - Store sensitive data securely
   - Implement proper authentication

3. **User Experience:**
   - Provide loading states
   - Handle errors gracefully
   - Use consistent UI patterns
   - Test on different devices

4. **Maintainability:**
   - Write clear, documented code
   - Use consistent naming conventions
   - Implement proper error logging
   - Keep dependencies up to date