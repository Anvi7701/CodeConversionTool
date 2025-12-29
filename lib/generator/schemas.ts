export type TemplateId =
  | 'users' | 'products' | 'orders' | 'blogPosts'
  | 'comments' | 'events' | 'transactions' | 'inventory'
  | 'loginSessions' | 'jwtTokens' | 'oauthCredentials' | 'apiKeys' | 'roles' | 'permissions' | 'userRoles'
  | 'bankAccounts' | 'creditCards' | 'loanApplications' | 'paymentGateways' | 'invoices'
  | 'shoppingCarts' | 'coupons' | 'reviews' | 'socialProfiles' | 'messages' | 'notifications'
  | 'appointments' | 'reminders' | 'tickets'
  | 'patients' | 'prescriptions' | 'labReports'
  // Logistics & Inventory
  | 'warehouses' | 'shipments' | 'trackingUpdates'
  // Tech & DevOps
  | 'apiResponses' | 'errorLogs' | 'systemMetrics' | 'configFiles'
  // Business Domains
  | 'insuranceClaims' | 'policyDetails' | 'employees' | 'payrolls';

export interface GeneratorOptions {
  seed?: number;
  locale?: 'en' | 'hi' | 'en_IN';
  pretty?: boolean;           // output formatting
  fields?: string[];          // optional include list
  sentenceStyle?: 'technical' | 'marketing' | 'simple';
}

export type FieldSpec = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  unique?: boolean;
  nullable?: boolean;
  enum?: string[];
  example?: any;
  ref?: { template: TemplateId, field: string }; // foreign key
};

export type TemplateSchema = {
  id: TemplateId;
  title: string;
  description: string;
  fields: FieldSpec[];
};

export const Schemas: Record<TemplateId, TemplateSchema> = {
  users: {
    id: 'users',
    title: 'Users',
    description: 'User profiles with personal information',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'name', type: 'string' },
      { name: 'email', type: 'string', unique: true },
      { name: 'phone', type: 'string' },
      { name: 'address', type: 'object' },
      { name: 'createdAt', type: 'date' },
      { name: 'isActive', type: 'boolean' }
    ]
  },
  products: {
    id: 'products',
    title: 'Products',
    description: 'E commerce product catalog',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'title', type: 'string' },
      { name: 'sku', type: 'string', unique: true },
      { name: 'price', type: 'number' },
      { name: 'currency', type: 'string', enum: ['INR','USD','EUR'] },
      { name: 'category', type: 'string' },
      { name: 'inventoryQty', type: 'number' },
      { name: 'tags', type: 'array' }
    ]
  },
  orders: {
    id: 'orders',
    title: 'Orders',
    description: 'E commerce order records',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'items', type: 'array' },
      { name: 'subtotal', type: 'number' },
      { name: 'tax', type: 'number' },
      { name: 'total', type: 'number' },
      { name: 'status', type: 'string', enum: ['processing','delivered','cancelled'] },
      { name: 'createdAt', type: 'date' }
    ]
  },
  blogPosts: {
    id: 'blogPosts',
    title: 'Blog Posts',
    description: 'Blog posts with content and metadata',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'authorId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'title', type: 'string' },
      { name: 'slug', type: 'string', unique: true },
      { name: 'content', type: 'string' },
      { name: 'tags', type: 'array' },
      { name: 'publishedAt', type: 'date', nullable: true }
    ]
  },
  comments: {
    id: 'comments',
    title: 'Comments',
    description: 'User comments and feedback',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'postId', type: 'string', ref: { template: 'blogPosts', field: 'id' } },
      { name: 'authorId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'text', type: 'string' },
      { name: 'createdAt', type: 'date' }
    ]
  },
  events: {
    id: 'events',
    title: 'Events',
    description: 'Calendar events and schedules',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'title', type: 'string' },
      { name: 'start', type: 'date' },
      { name: 'end', type: 'date' },
      { name: 'location', type: 'string' }
    ]
  },
  transactions: {
    id: 'transactions',
    title: 'Transactions',
    description: 'Financial transaction records',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'amount', type: 'number' },
      { name: 'currency', type: 'string', enum: ['INR','USD','EUR'] },
      { name: 'type', type: 'string', enum: ['debit','credit','refund'] },
      { name: 'createdAt', type: 'date' }
    ]
  },
  inventory: {
    id: 'inventory',
    title: 'Inventory',
    description: 'Warehouse inventory tracking',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'productId', type: 'string', ref: { template: 'products', field: 'id' } },
      { name: 'location', type: 'string' },
      { name: 'qty', type: 'number' },
      { name: 'updatedAt', type: 'date' }
    ]
  },

  // Logistics & Inventory
  warehouses: {
    id: 'warehouses',
    title: 'Warehouses',
    description: 'Fulfillment centers with capacity and location',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'name', type: 'string' },
      { name: 'code', type: 'string', unique: true },
      { name: 'location', type: 'string' },
      { name: 'capacity', type: 'number' },
      { name: 'active', type: 'boolean' },
      { name: 'updatedAt', type: 'date' }
    ]
  },
  shipments: {
    id: 'shipments',
    title: 'Shipments',
    description: 'Order shipments with carrier and status',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'orderId', type: 'string', ref: { template: 'orders', field: 'id' } },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'originWarehouseId', type: 'string', ref: { template: 'warehouses', field: 'id' } },
      { name: 'destinationWarehouseId', type: 'string', ref: { template: 'warehouses', field: 'id' } },
      { name: 'carrier', type: 'string', enum: ['UPS','FedEx','DHL','USPS','BlueDart','Delhivery'] },
      { name: 'trackingNumber', type: 'string', unique: true },
      { name: 'status', type: 'string', enum: ['pending','in_transit','delivered','delayed','cancelled','returned'] },
      { name: 'items', type: 'array' },
      { name: 'shippedAt', type: 'date' },
      { name: 'deliveredAt', type: 'date', nullable: true }
    ]
  },
  trackingUpdates: {
    id: 'trackingUpdates',
    title: 'Tracking Updates',
    description: 'Shipment tracking events with status and location',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'shipmentId', type: 'string', ref: { template: 'shipments', field: 'id' } },
      { name: 'status', type: 'string', enum: ['pending','in_transit','delivered','delayed','cancelled','returned'] },
      { name: 'location', type: 'string' },
      { name: 'message', type: 'string' },
      { name: 'createdAt', type: 'date' }
    ]
  },

  // Tech & DevOps
  apiResponses: {
    id: 'apiResponses',
    title: 'API Responses',
    description: 'HTTP API responses with status, timing, and payload',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'endpoint', type: 'string' },
      { name: 'method', type: 'string', enum: ['GET','POST','PUT','PATCH','DELETE'] },
      { name: 'statusCode', type: 'number' },
      { name: 'headers', type: 'object' },
      { name: 'body', type: 'object' },
      { name: 'responseTimeMs', type: 'number' },
      { name: 'timestamp', type: 'date' },
      { name: 'requestId', type: 'string' }
    ]
  },
  errorLogs: {
    id: 'errorLogs',
    title: 'Error Logs',
    description: 'Structured application logs and error stacks',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'level', type: 'string', enum: ['error','warn','info','debug'] },
      { name: 'serviceName', type: 'string' },
      { name: 'env', type: 'string', enum: ['dev','stage','prod'] },
      { name: 'message', type: 'string' },
      { name: 'stack', type: 'string', nullable: true },
      { name: 'context', type: 'object' },
      { name: 'timestamp', type: 'date' },
      { name: 'requestId', type: 'string', nullable: true }
    ]
  },
  systemMetrics: {
    id: 'systemMetrics',
    title: 'System Metrics',
    description: 'Operational metrics for services and nodes',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'serviceName', type: 'string' },
      { name: 'metric', type: 'string', enum: ['CPU_USAGE','MEMORY_USAGE','REQ_RATE','LATENCY_MS','ERROR_RATE'] },
      { name: 'value', type: 'number' },
      { name: 'unit', type: 'string' },
      { name: 'capturedAt', type: 'date' },
      { name: 'node', type: 'string' },
      { name: 'tags', type: 'array' }
    ]
  },
  configFiles: {
    id: 'configFiles',
    title: 'Config Files',
    description: 'Service configuration files in multiple formats',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'serviceName', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'format', type: 'string', enum: ['json','yaml','toml','ini'] },
      { name: 'content', type: 'string' },
      { name: 'createdAt', type: 'date' },
      { name: 'updatedAt', type: 'date' },
      { name: 'active', type: 'boolean' }
    ]
  },

  // Business Domains
  policyDetails: {
    id: 'policyDetails',
    title: 'Policy Details',
    description: 'Insurance policies with coverage, premium and status',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'policyNumber', type: 'string', unique: true },
      { name: 'provider', type: 'string' },
      { name: 'type', type: 'string', enum: ['health','life','auto','home','travel','business'] },
      { name: 'premium', type: 'number' },
      { name: 'coverageAmount', type: 'number' },
      { name: 'startDate', type: 'date' },
      { name: 'endDate', type: 'date' },
      { name: 'status', type: 'string', enum: ['active','lapsed','cancelled','expired'] }
    ]
  },
  insuranceClaims: {
    id: 'insuranceClaims',
    title: 'Insurance Claims',
    description: 'Claims linked to policies and users',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'policyId', type: 'string', ref: { template: 'policyDetails', field: 'id' } },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'claimNumber', type: 'string', unique: true },
      { name: 'incidentDate', type: 'date' },
      { name: 'claimDate', type: 'date' },
      { name: 'amountClaimed', type: 'number' },
      { name: 'amountApproved', type: 'number' },
      { name: 'status', type: 'string', enum: ['submitted','in_review','approved','rejected','paid'] },
      { name: 'description', type: 'string' }
    ]
  },
  employees: {
    id: 'employees',
    title: 'Employee Records',
    description: 'Employee profiles mapped to users with HR details',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'employeeCode', type: 'string', unique: true },
      { name: 'department', type: 'string' },
      { name: 'role', type: 'string' },
      { name: 'location', type: 'string' },
      { name: 'dateOfJoining', type: 'date' },
      { name: 'status', type: 'string', enum: ['active','on_leave','terminated'] },
      { name: 'salaryAnnual', type: 'number' },
      { name: 'managerEmployeeCode', type: 'string', nullable: true }
    ]
  },
  payrolls: {
    id: 'payrolls',
    title: 'HR Payroll',
    description: 'Monthly payroll with gross, tax, deductions and net',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'employeeId', type: 'string', ref: { template: 'employees', field: 'id' } },
      { name: 'periodStart', type: 'date' },
      { name: 'periodEnd', type: 'date' },
      { name: 'grossPay', type: 'number' },
      { name: 'tax', type: 'number' },
      { name: 'deductions', type: 'number' },
      { name: 'netPay', type: 'number' },
      { name: 'currency', type: 'string', enum: ['INR','USD','EUR'] },
      { name: 'paidAt', type: 'date' },
      { name: 'paymentMethod', type: 'string', enum: ['bank_transfer','cheque','cash','wallet'] },
      { name: 'status', type: 'string', enum: ['processed','paid','failed'] }
    ]
  },

  // Security & Authentication
  permissions: {
    id: 'permissions',
    title: 'Permissions',
    description: 'Atomic capabilities like read:users, write:orders',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'name', type: 'string', unique: true },
      { name: 'description', type: 'string' }
    ]
  },
  roles: {
    id: 'roles',
    title: 'Roles',
    description: 'Role definitions with permission sets',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'name', type: 'string', unique: true },
      { name: 'permissionIds', type: 'array' }
    ]
  },
  userRoles: {
    id: 'userRoles',
    title: 'User Roles',
    description: 'Assignments mapping users to roles',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'roleId', type: 'string', ref: { template: 'roles', field: 'id' } },
      { name: 'assignedAt', type: 'date' }
    ]
  },
  loginSessions: {
    id: 'loginSessions',
    title: 'Login Sessions',
    description: 'User sessions with device and IP',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'ip', type: 'string' },
      { name: 'userAgent', type: 'string' },
      { name: 'createdAt', type: 'date' },
      { name: 'expiresAt', type: 'date' },
      { name: 'active', type: 'boolean' }
    ]
  },
  jwtTokens: {
    id: 'jwtTokens',
    title: 'JWT Tokens',
    description: 'JSON Web Tokens issued for users',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'token', type: 'string', unique: true },
      { name: 'issuedAt', type: 'date' },
      { name: 'expiresAt', type: 'date' },
      { name: 'revoked', type: 'boolean' }
    ]
  },
  oauthCredentials: {
    id: 'oauthCredentials',
    title: 'OAuth Credentials',
    description: 'OAuth client and token pairs per provider',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'provider', type: 'string', enum: ['google','github','microsoft','facebook','twitter'] },
      { name: 'clientId', type: 'string', unique: true },
      { name: 'clientSecret', type: 'string' },
      { name: 'accessToken', type: 'string', unique: true },
      { name: 'refreshToken', type: 'string' },
      { name: 'scope', type: 'array' },
      { name: 'expiresAt', type: 'date' }
    ]
  },
  apiKeys: {
    id: 'apiKeys',
    title: 'API Keys',
    description: 'Service API keys associated with users',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'name', type: 'string' },
      { name: 'key', type: 'string', unique: true },
      { name: 'createdAt', type: 'date' },
      { name: 'lastUsedAt', type: 'date' },
      { name: 'active', type: 'boolean' }
    ]
  },

  // Financial & Banking
  bankAccounts: {
    id: 'bankAccounts',
    title: 'Bank Accounts',
    description: 'Customer bank accounts with IBAN/IFSC and balances',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'bankName', type: 'string' },
      { name: 'accountType', type: 'string', enum: ['checking','savings','salary','business'] },
      { name: 'accountNumber', type: 'string', unique: true },
      { name: 'ifscOrIban', type: 'string' },
      { name: 'currency', type: 'string', enum: ['INR','USD','EUR'] },
      { name: 'balance', type: 'number' },
      { name: 'createdAt', type: 'date' }
    ]
  },
  creditCards: {
    id: 'creditCards',
    title: 'Credit Cards',
    description: 'Masked card numbers, brand, limit and status',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'brand', type: 'string', enum: ['Visa','Mastercard','Amex','RuPay','Discover'] },
      { name: 'last4', type: 'string' },
      { name: 'token', type: 'string', unique: true },
      { name: 'expiry', type: 'string' },
      { name: 'creditLimit', type: 'number' },
      { name: 'active', type: 'boolean' }
    ]
  },
  loanApplications: {
    id: 'loanApplications',
    title: 'Loan Applications',
    description: 'Applications with amount, term and status',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'type', type: 'string', enum: ['home','auto','personal','education','business'] },
      { name: 'amount', type: 'number' },
      { name: 'termMonths', type: 'number' },
      { name: 'status', type: 'string', enum: ['submitted','in_review','approved','rejected'] },
      { name: 'submittedAt', type: 'date' },
      { name: 'decisionAt', type: 'date' }
    ]
  },
  paymentGateways: {
    id: 'paymentGateways',
    title: 'Payment Gateways',
    description: 'Gateway credentials and supported currencies',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'provider', type: 'string', enum: ['Stripe','Razorpay','PayPal','Square','Adyen'] },
      { name: 'merchantId', type: 'string', unique: true },
      { name: 'apiKey', type: 'string' },
      { name: 'webhookSecret', type: 'string' },
      { name: 'callbackUrl', type: 'string' },
      { name: 'supportedCurrencies', type: 'array' },
      { name: 'environment', type: 'string', enum: ['test','live'] }
    ]
  },
  invoices: {
    id: 'invoices',
    title: 'Invoices',
    description: 'Customer invoices with items and totals',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'items', type: 'array' },
      { name: 'subtotal', type: 'number' },
      { name: 'tax', type: 'number' },
      { name: 'total', type: 'number' },
      { name: 'currency', type: 'string', enum: ['INR','USD','EUR'] },
      { name: 'status', type: 'string', enum: ['draft','issued','paid','overdue','cancelled'] },
      { name: 'issuedAt', type: 'date' },
      { name: 'dueAt', type: 'date' }
    ]
  },

  // E-commerce & Retail
  shoppingCarts: {
    id: 'shoppingCarts',
    title: 'Shopping Carts',
    description: 'Active carts with items and totals',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'items', type: 'array' },
      { name: 'subtotal', type: 'number' },
      { name: 'tax', type: 'number' },
      { name: 'total', type: 'number' },
      { name: 'currency', type: 'string', enum: ['INR','USD','EUR'] },
      { name: 'updatedAt', type: 'date' }
    ]
  },
  coupons: {
    id: 'coupons',
    title: 'Coupons & Discounts',
    description: 'Codes with value, usage limits and validity',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'code', type: 'string', unique: true },
      { name: 'discountType', type: 'string', enum: ['percent','fixed'] },
      { name: 'value', type: 'number' },
      { name: 'currency', type: 'string', enum: ['INR','USD','EUR'] },
      { name: 'validFrom', type: 'date' },
      { name: 'validTo', type: 'date' },
      { name: 'usageLimit', type: 'number' },
      { name: 'usedCount', type: 'number' },
      { name: 'active', type: 'boolean' }
    ]
  },

  // Content & Social
  reviews: {
    id: 'reviews',
    title: 'Reviews & Ratings',
    description: 'Product reviews with ratings and text',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'productId', type: 'string', ref: { template: 'products', field: 'id' } },
      { name: 'rating', type: 'number' },
      { name: 'title', type: 'string' },
      { name: 'text', type: 'string' },
      { name: 'helpfulVotes', type: 'number' },
      { name: 'createdAt', type: 'date' }
    ]
  },
  socialProfiles: {
    id: 'socialProfiles',
    title: 'Social Media Profiles',
    description: 'User profiles on social platforms',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'platform', type: 'string', enum: ['twitter','facebook','instagram','linkedin','youtube','tiktok'] },
      { name: 'handle', type: 'string' },
      { name: 'url', type: 'string' },
      { name: 'followers', type: 'number' },
      { name: 'following', type: 'number' },
      { name: 'verified', type: 'boolean' },
      { name: 'createdAt', type: 'date' }
    ]
  },
  messages: {
    id: 'messages',
    title: 'Messages',
    description: 'Direct messages between users',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'fromUserId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'toUserId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'content', type: 'string' },
      { name: 'status', type: 'string', enum: ['sent','delivered','read'] },
      { name: 'createdAt', type: 'date' },
      { name: 'readAt', type: 'date' }
    ]
  },
  notifications: {
    id: 'notifications',
    title: 'Notifications',
    description: 'System/user notifications with types and priority',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'type', type: 'string', enum: ['order_shipped','discount_offer','system','security_alert','message'] },
      { name: 'title', type: 'string' },
      { name: 'body', type: 'string' },
      { name: 'priority', type: 'string', enum: ['low','normal','high'] },
      { name: 'createdAt', type: 'date' },
      { name: 'read', type: 'boolean' }
    ]
  },

  // Events & Scheduling
  appointments: {
    id: 'appointments',
    title: 'Appointments',
    description: 'Scheduled appointments with start/end and status',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'title', type: 'string' },
      { name: 'start', type: 'date' },
      { name: 'end', type: 'date' },
      { name: 'location', type: 'string' },
      { name: 'status', type: 'string', enum: ['scheduled','completed','cancelled'] }
    ]
  },
  reminders: {
    id: 'reminders',
    title: 'Reminders',
    description: 'Timed reminders with repeat patterns',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'title', type: 'string' },
      { name: 'remindAt', type: 'date' },
      { name: 'repeat', type: 'string', enum: ['none','daily','weekly','monthly'] },
      { name: 'done', type: 'boolean' }
    ]
  },
  tickets: {
    id: 'tickets',
    title: 'Tickets',
    description: 'Event tickets with seat, price and status',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'eventId', type: 'string', ref: { template: 'events', field: 'id' } },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'seat', type: 'string' },
      { name: 'price', type: 'number' },
      { name: 'currency', type: 'string', enum: ['INR','USD','EUR'] },
      { name: 'status', type: 'string', enum: ['reserved','paid','cancelled'] }
    ]
  },

  // Healthcare
  patients: {
    id: 'patients',
    title: 'Patients',
    description: 'Patient profiles linked to users with medical info',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'userId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'dob', type: 'date' },
      { name: 'gender', type: 'string', enum: ['male','female','other'] },
      { name: 'bloodType', type: 'string', enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
      { name: 'allergies', type: 'array' },
      { name: 'conditions', type: 'array' },
      { name: 'active', type: 'boolean' },
      { name: 'createdAt', type: 'date' }
    ]
  },
  prescriptions: {
    id: 'prescriptions',
    title: 'Prescriptions',
    description: 'Doctor prescriptions with medications and dosage',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'patientId', type: 'string', ref: { template: 'patients', field: 'id' } },
      { name: 'doctorUserId', type: 'string', ref: { template: 'users', field: 'id' } },
      { name: 'medications', type: 'array' },
      { name: 'issuedAt', type: 'date' },
      { name: 'notes', type: 'string' }
    ]
  },
  labReports: {
    id: 'labReports',
    title: 'Lab Reports',
    description: 'Diagnostic lab reports and values',
    fields: [
      { name: 'id', type: 'string', unique: true },
      { name: 'patientId', type: 'string', ref: { template: 'patients', field: 'id' } },
      { name: 'testType', type: 'string', enum: ['CBC','Lipid Profile','HbA1c','Thyroid','Vitamin D','LFT'] },
      { name: 'values', type: 'array' },
      { name: 'reportedAt', type: 'date' },
      { name: 'notes', type: 'string' }
    ]
  }
};
