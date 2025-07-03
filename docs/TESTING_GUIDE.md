# Testing Guide - 自助售酒机小程序端

## Overview
This guide provides comprehensive testing strategies, tools, and best practices for ensuring the quality and reliability of the wine vending machine mini-program.

## Table of Contents
- [Testing Strategy](#testing-strategy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Testing Tools and Setup](#testing-tools-and-setup)
- [Best Practices](#best-practices)

---

## Testing Strategy

### Testing Pyramid

```
    /\         E2E Tests (Few)
   /  \        - Critical user journeys
  /____\       - Full system integration
 /      \      
/________\     Integration Tests (Some)
|        |     - Component integration
|        |     - API integration
|________|     
|        |     Unit Tests (Many)
|        |     - Functions & utilities
|        |     - Component logic
|________|     - Business logic
```

### Test Coverage Goals
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Key user flows verified

---

## Unit Testing

### Framework Setup

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/app.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Testing Utilities

```javascript
// tests/utils/validation.test.js
import { 
  validatePhone, 
  validatePrice, 
  validateOrderData,
  formatCurrency 
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('validatePhone', () => {
    it('validates correct Chinese mobile numbers', () => {
      const validNumbers = [
        '13800138000',
        '15912345678',
        '18612345678',
        '17712345678'
      ];

      validNumbers.forEach(number => {
        expect(validatePhone(number)).toBe(true);
      });
    });

    it('rejects invalid phone numbers', () => {
      const invalidNumbers = [
        '',
        '123',
        '1234567890',
        '12345678901',
        'abc',
        '138001380001' // too long
      ];

      invalidNumbers.forEach(number => {
        expect(validatePhone(number)).toBe(false);
      });
    });
  });

  describe('validatePrice', () => {
    it('validates positive prices', () => {
      expect(validatePrice(0.01)).toBe(true);
      expect(validatePrice(100)).toBe(true);
      expect(validatePrice(999.99)).toBe(true);
    });

    it('rejects invalid prices', () => {
      expect(validatePrice(0)).toBe(false);
      expect(validatePrice(-1)).toBe(false);
      expect(validatePrice('abc')).toBe(false);
      expect(validatePrice(null)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('formats prices correctly', () => {
      expect(formatCurrency(100)).toBe('¥100.00');
      expect(formatCurrency(99.9)).toBe('¥99.90');
      expect(formatCurrency(0.01)).toBe('¥0.01');
    });
  });
});
```

### Testing Services

```javascript
// tests/services/auth.test.js
import authService from '@/services/auth';
import * as storage from '@/utils/storage';
import { mockWxRequest } from '../mocks/wx';

// Mock dependencies
jest.mock('@/utils/storage');
jest.mock('@/utils/request');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWxRequest.mockClear();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: 12345,
          phone: '13800138000',
          nickname: 'Test User'
        }
      };

      mockWxRequest.mockResolvedValueOnce({ data: mockResponse });

      const credentials = {
        phone: '13800138000',
        code: '123456'
      };

      const result = await authService.login(credentials);

      expect(result).toEqual(mockResponse);
      expect(storage.setItem).toHaveBeenCalledWith('userToken', 'mock-jwt-token');
      expect(storage.setItem).toHaveBeenCalledWith('userInfo', mockResponse.user);
    });

    it('should handle login errors gracefully', async () => {
      const mockError = new Error('Invalid verification code');
      mockWxRequest.mockRejectedValueOnce(mockError);

      const credentials = {
        phone: '13800138000',
        code: 'invalid'
      };

      await expect(authService.login(credentials))
        .rejects.toThrow('Invalid verification code');
    });
  });

  describe('logout', () => {
    it('should clear user data on logout', async () => {
      await authService.logout();

      expect(storage.removeItem).toHaveBeenCalledWith('userToken');
      expect(storage.removeItem).toHaveBeenCalledWith('userInfo');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user has valid token', () => {
      storage.getItem.mockReturnValue('valid-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      storage.getItem.mockReturnValue(null);
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});
```

### Testing Components

```javascript
// tests/components/ProductCard.test.js
import { render, fireEvent } from '@testing-library/react';
import ProductCard from '@/components/product-card';

const mockProduct = {
  id: 'P001',
  name: '法国波尔多红酒',
  price: 298.00,
  image: '/images/wine.jpg',
  stock: 5,
  description: '优质法国红酒'
};

describe('ProductCard Component', () => {
  it('renders product information correctly', () => {
    const { getByText, getByRole } = render(
      <ProductCard product={mockProduct} />
    );

    expect(getByText('法国波尔多红酒')).toBeInTheDocument();
    expect(getByText('¥298.00')).toBeInTheDocument();
    expect(getByText('库存: 5')).toBeInTheDocument();
    
    const image = getByRole('img');
    expect(image).toHaveAttribute('src', '/images/wine.jpg');
  });

  it('calls onSelect when product is clicked', () => {
    const onSelect = jest.fn();
    const { container } = render(
      <ProductCard product={mockProduct} onSelect={onSelect} />
    );

    fireEvent.click(container.firstChild);
    expect(onSelect).toHaveBeenCalledWith(mockProduct);
  });

  it('shows out of stock state when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    const { getByText } = render(
      <ProductCard product={outOfStockProduct} />
    );

    expect(getByText('暂时缺货')).toBeInTheDocument();
  });

  it('applies selected styling when selected prop is true', () => {
    const { container } = render(
      <ProductCard product={mockProduct} selected={true} />
    );

    expect(container.firstChild).toHaveClass('product-card--selected');
  });
});
```

---

## Integration Testing

### API Integration Tests

```javascript
// tests/integration/orderFlow.test.js
import { render, fireEvent, waitFor } from '@testing-library/react';
import OrderFlow from '@/pages/order';
import * as productService from '@/services/product';
import * as orderService from '@/services/order';

jest.mock('@/services/product');
jest.mock('@/services/order');

describe('Order Flow Integration', () => {
  const mockMachine = {
    id: 'WM001',
    location: '测试地点',
    status: 'online'
  };

  const mockProducts = [
    {
      id: 'P001',
      name: '红酒A',
      price: 128.00,
      stock: 3
    },
    {
      id: 'P002',
      name: '红酒B', 
      price: 158.00,
      stock: 2
    }
  ];

  beforeEach(() => {
    productService.getProductList.mockResolvedValue(mockProducts);
    orderService.createOrder.mockResolvedValue({
      id: 'ORDER123',
      status: 'pending'
    });
  });

  it('should complete full order flow', async () => {
    const { getByText, getByTestId } = render(
      <OrderFlow machine={mockMachine} />
    );

    // Wait for products to load
    await waitFor(() => {
      expect(getByText('红酒A')).toBeInTheDocument();
    });

    // Select product
    fireEvent.click(getByText('红酒A'));

    // Verify selection
    expect(getByTestId('selected-product')).toHaveTextContent('红酒A');

    // Set quantity
    const quantityInput = getByTestId('quantity-input');
    fireEvent.change(quantityInput, { target: { value: '2' } });

    // Confirm order
    fireEvent.click(getByText('确认订单'));

    // Verify order creation
    await waitFor(() => {
      expect(orderService.createOrder).toHaveBeenCalledWith({
        machineId: 'WM001',
        productId: 'P001',
        quantity: 2
      });
    });
  });
});
```

### Component Integration Tests

```javascript
// tests/integration/paymentFlow.test.js
import { render, fireEvent, waitFor } from '@testing-library/react';
import PaymentPage from '@/pages/payment';
import * as paymentService from '@/services/payment';

jest.mock('@/services/payment');

describe('Payment Flow Integration', () => {
  const mockOrder = {
    id: 'ORDER123',
    productName: '红酒A',
    quantity: 1,
    total: 128.00
  };

  it('should handle WeChat Pay flow', async () => {
    paymentService.initiatePayment.mockResolvedValue({
      success: true,
      paymentParams: {
        timeStamp: '1234567890',
        nonceStr: 'abc123',
        package: 'prepay_id=123',
        signType: 'MD5',
        paySign: 'sign123'
      }
    });

    const { getByText } = render(
      <PaymentPage order={mockOrder} />
    );

    // Click WeChat Pay button
    fireEvent.click(getByText('微信支付'));

    await waitFor(() => {
      expect(paymentService.initiatePayment).toHaveBeenCalledWith(
        'ORDER123',
        'wechat'
      );
    });
  });
});
```

---

## End-to-End Testing

### E2E Test Setup

```javascript
// tests/e2e/setup.js
const puppeteer = require('puppeteer');

module.exports = async () => {
  const browser = await puppeteer.launch({
    headless: process.env.CI === 'true',
    devtools: !process.env.CI,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  global.browser = browser;
};
```

### Critical User Journey Tests

```javascript
// tests/e2e/completeOrder.test.js
describe('Complete Order Journey', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await page.goto('http://localhost:3000');
  });

  afterAll(async () => {
    await page.close();
  });

  it('should complete order from scan to payment', async () => {
    // 1. Login
    await page.click('[data-testid="login-button"]');
    await page.type('[data-testid="phone-input"]', '13800138000');
    await page.type('[data-testid="code-input"]', '123456');
    await page.click('[data-testid="login-submit"]');

    // Wait for navigation
    await page.waitForSelector('[data-testid="home-page"]');

    // 2. Scan QR Code (simulate)
    await page.click('[data-testid="scan-button"]');
    await page.evaluate(() => {
      // Simulate QR scan result
      window.mockScanResult = {
        machineId: 'WM001',
        location: '测试地点'
      };
    });

    // 3. Select Product
    await page.waitForSelector('[data-testid="product-list"]');
    await page.click('[data-testid="product-P001"]');

    // 4. Confirm Order
    await page.click('[data-testid="confirm-order"]');

    // 5. Payment
    await page.waitForSelector('[data-testid="payment-page"]');
    await page.click('[data-testid="wechat-pay"]');

    // 6. Verify Success
    await page.waitForSelector('[data-testid="success-page"]');
    const successMessage = await page.$eval(
      '[data-testid="success-message"]',
      el => el.textContent
    );

    expect(successMessage).toContain('订单完成');
  });
});
```

---

## Performance Testing

### Load Testing

```javascript
// tests/performance/loadTest.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  // Test login endpoint
  const loginResponse = http.post('https://api.example.com/auth/login', {
    phone: '13800138000',
    code: '123456'
  });

  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test product list endpoint
  const token = JSON.parse(loginResponse.body).token;
  const productsResponse = http.get('https://api.example.com/products', {
    headers: { Authorization: `Bearer ${token}` }
  });

  check(productsResponse, {
    'products status is 200': (r) => r.status === 200,
    'products response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
```

### Memory and Performance Tests

```javascript
// tests/performance/memoryTest.test.js
describe('Memory Usage Tests', () => {
  it('should not have memory leaks in component lifecycle', async () => {
    const initialMemory = performance.memory.usedJSHeapSize;
    
    // Mount and unmount component multiple times
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<ProductCard product={mockProduct} />);
      unmount();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal
    expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB
  });

  it('should render product list efficiently', () => {
    const startTime = performance.now();
    
    const products = Array.from({ length: 1000 }, (_, i) => ({
      id: `P${i}`,
      name: `Product ${i}`,
      price: 100 + i
    }));

    render(<ProductList products={products} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time
    expect(renderTime).toBeLessThan(100); // Less than 100ms
  });
});
```

---

## Security Testing

### Input Validation Tests

```javascript
// tests/security/inputValidation.test.js
import { validateUserInput, sanitizeInput } from '@/utils/security';

describe('Security - Input Validation', () => {
  describe('SQL Injection Protection', () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "1' UNION SELECT * FROM users--"
    ];

    maliciousInputs.forEach(input => {
      it(`should reject SQL injection attempt: ${input}`, () => {
        expect(validateUserInput(input)).toBe(false);
      });
    });
  });

  describe('XSS Protection', () => {
    const xssInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')" />',
      'onmouseover="alert(\'xss\')"'
    ];

    xssInputs.forEach(input => {
      it(`should sanitize XSS attempt: ${input}`, () => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror');
      });
    });
  });
});
```

### Authentication Security Tests

```javascript
// tests/security/authSecurity.test.js
describe('Authentication Security', () => {
  it('should not expose sensitive data in tokens', () => {
    const token = authService.generateToken({
      id: 123,
      phone: '13800138000',
      password: 'secretpassword'
    });

    const decoded = jwt.decode(token);
    
    expect(decoded.password).toBeUndefined();
    expect(decoded.phone).toBeDefined();
    expect(decoded.id).toBeDefined();
  });

  it('should validate token expiration', () => {
    const expiredToken = authService.generateToken(
      { id: 123 },
      { expiresIn: '-1h' } // Expired token
    );

    expect(authService.validateToken(expiredToken)).toBe(false);
  });

  it('should prevent brute force attacks', async () => {
    const attempts = [];
    
    // Simulate multiple failed login attempts
    for (let i = 0; i < 10; i++) {
      attempts.push(
        authService.login({
          phone: '13800138000',
          code: 'wrong'
        }).catch(() => {})
      );
    }

    await Promise.all(attempts);

    // Should be rate limited after multiple failures
    await expect(
      authService.login({
        phone: '13800138000',
        code: '123456'
      })
    ).rejects.toThrow('Too many login attempts');
  });
});
```

---

## Testing Tools and Setup

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --config=jest.e2e.config.js",
    "test:performance": "k6 run tests/performance/loadTest.js",
    "test:security": "jest tests/security",
    "test:all": "npm run test && npm run test:e2e && npm run test:security"
  }
}
```

### Test Environment Setup

```javascript
// tests/setup.js
import '@testing-library/jest-dom';

// Mock WeChat Mini Program APIs
global.wx = {
  request: jest.fn(),
  scanCode: jest.fn(),
  requestPayment: jest.fn(),
  showToast: jest.fn(),
  navigateTo: jest.fn(),
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn(),
  removeStorageSync: jest.fn()
};

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
```

---

## Best Practices

### Writing Effective Tests

1. **Follow AAA Pattern:**
```javascript
it('should calculate order total correctly', () => {
  // Arrange
  const orderItems = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];

  // Act
  const total = calculateOrderTotal(orderItems);

  // Assert
  expect(total).toBe(250);
});
```

2. **Use Descriptive Test Names:**
```javascript
// Good
it('should display error message when phone number is invalid');

// Bad
it('should handle errors');
```

3. **Test Edge Cases:**
```javascript
describe('Price validation', () => {
  it('should handle zero price');
  it('should handle negative price'); 
  it('should handle very large price');
  it('should handle decimal prices');
  it('should handle null/undefined price');
});
```

### Test Data Management

```javascript
// tests/fixtures/testData.js
export const mockUsers = {
  validUser: {
    id: 12345,
    phone: '13800138000',
    nickname: 'Test User'
  },
  adminUser: {
    id: 1,
    phone: '13900139000',
    nickname: 'Admin',
    role: 'admin'
  }
};

export const mockProducts = [
  {
    id: 'P001',
    name: '法国波尔多红酒',
    price: 298.00,
    stock: 5
  },
  {
    id: 'P002',
    name: '意大利基安帝',
    price: 268.00,
    stock: 3
  }
];
```

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Run security tests
      run: npm run test:security
    
    - name: Upload coverage
      uses: codecov/codecov-action@v1
```

### Test Maintenance

1. **Regular Test Review:**
   - Remove obsolete tests
   - Update tests for changed requirements
   - Refactor duplicated test code

2. **Test Performance:**
   - Keep test execution time under 10 minutes
   - Parallelize independent tests
   - Mock expensive operations

3. **Test Documentation:**
   - Document complex test scenarios
   - Maintain test data fixtures
   - Keep test environment setup instructions updated