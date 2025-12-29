import { TemplateId, GeneratorOptions } from './schemas';
import { getFaker } from './fakerAdapter';

// id cache to help uniqueness
const idCache: Record<TemplateId, Set<string>> = {
  users: new Set(), products: new Set(), orders: new Set(), blogPosts: new Set(),
  comments: new Set(), events: new Set(), transactions: new Set(), inventory: new Set(),
  // Security & Auth
  loginSessions: new Set(), jwtTokens: new Set(), oauthCredentials: new Set(), apiKeys: new Set(),
  roles: new Set(), permissions: new Set(), userRoles: new Set(),
  // Financial & Banking
  bankAccounts: new Set(), creditCards: new Set(), loanApplications: new Set(), paymentGateways: new Set(), invoices: new Set(),
  // E-commerce & Retail
  shoppingCarts: new Set(), coupons: new Set(),
  // Content & Social
  reviews: new Set(), socialProfiles: new Set(), messages: new Set(), notifications: new Set()
  ,
  // Events & Scheduling
  appointments: new Set(), reminders: new Set(), tickets: new Set(),
  // Healthcare
  patients: new Set(), prescriptions: new Set(), labReports: new Set(),
  // Logistics & Inventory
  warehouses: new Set(), shipments: new Set(), trackingUpdates: new Set(),
  // Tech & DevOps
  apiResponses: new Set(), errorLogs: new Set(), systemMetrics: new Set(), configFiles: new Set(),
  // Business Domains
  insuranceClaims: new Set(), policyDetails: new Set(), employees: new Set(), payrolls: new Set()
};

function setSeed(seed?: number, locale?: string) {
  const faker = getFaker();
  if (seed !== undefined && faker.seed) faker.seed(seed);
  if (faker.setLocale) faker.setLocale(locale ?? 'en_IN');
}

export function generate(template: TemplateId, qty: number, options: GeneratorOptions = {}) {
  setSeed(options.seed, options.locale);
  if (!template) throw new Error('Template is required.');
  if (!qty || qty < 1 || qty > 1000) throw new Error('Quantity must be between 1 and 1000.');

  const deps: TemplateId[] = dependencyOrder(template);
  const context: Partial<Record<TemplateId, any[]>> = {};
  for (const dep of deps) {
    if (!context[dep]) context[dep] = generateSingle(dep, Math.max(10, Math.ceil(qty / 2)));
  }
  const data = generateSingle(template, qty, context, options);
  return data;
}

function dependencyOrder(t: TemplateId): TemplateId[] {
  if (t === 'orders') return ['users','products'];
  if (t === 'comments') return ['users','blogPosts'];
  if (t === 'blogPosts') return ['users'];
  if (t === 'transactions') return ['users'];
  if (t === 'inventory') return ['products'];
  // Logistics & Inventory
  if (t === 'warehouses') return [];
  if (t === 'shipments') return ['users','orders','warehouses'];
  if (t === 'trackingUpdates') return ['shipments'];
  // Tech & DevOps
  if (t === 'apiResponses') return ['users'];
  if (t === 'errorLogs') return [];
  if (t === 'systemMetrics') return [];
  if (t === 'configFiles') return [];
  // Business Domains
  if (t === 'policyDetails') return ['users'];
  if (t === 'insuranceClaims') return ['users','policyDetails'];
  if (t === 'employees') return ['users'];
  if (t === 'payrolls') return ['employees','bankAccounts'];
  // Security & Auth
  if (t === 'loginSessions') return ['users'];
  if (t === 'jwtTokens') return ['users'];
  if (t === 'oauthCredentials') return ['users'];
  if (t === 'apiKeys') return ['users'];
  if (t === 'roles') return ['permissions'];
  if (t === 'userRoles') return ['users','roles'];
  // Financial & Banking
  if (t === 'bankAccounts') return ['users'];
  if (t === 'creditCards') return ['users'];
  if (t === 'loanApplications') return ['users'];
  if (t === 'invoices') return ['users'];
  if (t === 'shoppingCarts') return ['users','products'];
  if (t === 'reviews') return ['users','products'];
  if (t === 'socialProfiles') return ['users'];
  if (t === 'messages') return ['users'];
  if (t === 'notifications') return ['users'];
  // Events & Scheduling
  if (t === 'appointments') return ['users'];
  if (t === 'reminders') return ['users'];
  if (t === 'tickets') return ['users','events'];
  // Healthcare
  if (t === 'patients') return ['users'];
  if (t === 'prescriptions') return ['patients','users'];
  if (t === 'labReports') return ['patients'];
  return [];
}

function uid(prefix: string, cache: Set<string>) {
  const faker = getFaker();
  let id = `${prefix}_${faker.string.alphanumeric(10)}`;
  while (cache.has(id)) id = `${prefix}_${faker.string.alphanumeric(10)}`;
  cache.add(id);
  return id;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function sentence(style: 'technical' | 'marketing' | 'simple' | undefined, faker: any): string {
  if (style === 'marketing') {
    return (
      faker.company?.phrase?.() ||
      faker.company?.catchPhrase?.() ||
      'Delivering value with seamless, scalable experiences.'
    );
  }
  if (style === 'simple') {
    const simple = [
      'This change improves the app.',
      'The update makes things faster.',
      'We fixed a bug in the code.',
      'The feature is easy to use.',
      'Data loads quickly and reliably.'
    ];
    return simple[Math.floor(Math.random() * simple.length)];
  }
  // default to technical
  return (
    faker.hacker?.phrase?.() ||
    'Refactor the module to improve performance.'
  );
}

function generateSingle(t: TemplateId, qty: number, ctx: Partial<Record<TemplateId, any[]>> = {}, options: GeneratorOptions = {}) {
  const faker = getFaker();
  const out: any[] = [];
  switch (t) {
    case 'users':
      for (let i = 0; i < qty; i++) {
        out.push({
          id: uid('usr', idCache.users),
          name: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          address: {
            line1: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state?.() ?? 'State',
            postalCode: faker.location.zipCode?.('######') ?? faker.location.zipCode(),
            country: 'IN'
          },
          createdAt: faker.date.past({ years: 2 }),
          isActive: faker.datatype.boolean?.({ probability: 0.8 }) ?? true
        });
      }
      break;

    case 'products':
      for (let i = 0; i < qty; i++) {
        out.push({
          id: uid('prd', idCache.products),
          title: faker.commerce.productName(),
          sku: String(faker.string.alphanumeric(8)).toUpperCase(),
          price: Number(faker.commerce.price?.({ min: 99, max: 49999 }) ?? 999),
          currency: pick(['INR','USD','EUR']),
          category: faker.commerce.department?.() ?? 'General',
          inventoryQty: faker.number.int({ min: 0, max: 500 }),
          tags: faker.helpers.arrayElements(['new','sale','featured','limited','eco','premium'], { min: 0, max: 3 })
        });
      }
      break;

    case 'orders': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const products = ctx.products ?? generateSingle('products', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const itemCount = faker.number.int({ min: 1, max: 5 });
        const items = Array.from({ length: itemCount }).map(() => {
          const p = pick(products);
          const q = faker.number.int({ min: 1, max: 3 });
          return { productId: p.id, title: p.title, price: p.price, qty: q };
        });
        const subtotal = items.reduce((s: number, it: any) => s + it.price * it.qty, 0);
        const tax = Math.round(subtotal * 0.18 * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;
        const status = faker.helpers.weightedArrayElement([
          { value: 'delivered', weight: 70 },
          { value: 'processing', weight: 20 },
          { value: 'cancelled', weight: 10 }
        ]);
        out.push({
          id: uid('ord', idCache.orders),
          userId: user.id,
          items, subtotal, tax, total, status,
          createdAt: faker.date.recent({ days: 90 })
        });
      }
      break;
    }

    case 'blogPosts': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const author = pick(users);
        const title = (sentence(options.sentenceStyle, faker) || `Post ${i + 1}`) as string;
        const slug = (title as string).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const sentences = Array.from({ length: faker.number.int({ min: 3, max: 7 }) }).map(() =>
          sentence(options.sentenceStyle, faker) || 'This update improves performance and stability.'
        );
        const content = sentences.join(' ');
        out.push({
          id: uid('post', idCache.blogPosts),
          authorId: author.id,
          title,
          slug,
          content,
          tags: faker.helpers.arrayElements(['tech','ai','news','opinion','tutorial'], { min: 0, max: 3 }),
          publishedAt: (faker.datatype.boolean?.({ probability: 0.7 }) ?? true) ? faker.date.recent({ days: 180 }) : null
        });
      }
      break;
    }

    case 'comments': {
      const posts = ctx.blogPosts ?? generateSingle('blogPosts', Math.max(10, qty), ctx);
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const post = pick(posts); const author = pick(users);
        out.push({
          id: uid('cmt', idCache.comments),
          postId: post.id,
          authorId: author.id,
          text: sentence(options.sentenceStyle, faker) || 'Nice update!',
          createdAt: faker.date.recent({ days: 30 })
        });
      }
      break;
    }

    case 'events':
      for (let i = 0; i < qty; i++) {
        const start = faker.date.soon({ days: 60 });
        const end = faker.date.soon({ days: 60, refDate: start });
        out.push({
          id: uid('evt', idCache.events),
          title: `${faker.commerce.department?.() ?? 'Community'} Event`,
          start, end,
          location: `${faker.location.city()}, ${faker.location.state?.() ?? 'State'}`
        });
      }
      break;

    case 'transactions': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        out.push({
          id: uid('txn', idCache.transactions),
          userId: user.id,
          amount: faker.number.float({ min: -50000, max: 50000, precision: 0.01 }),
          currency: pick(['INR','USD','EUR']),
          type: faker.helpers.weightedArrayElement([
            { value: 'debit', weight: 60 },
            { value: 'credit', weight: 30 },
            { value: 'refund', weight: 10 }
          ]),
          createdAt: faker.date.recent({ days: 120 })
        });
      }
      break;
    }

    case 'inventory': {
      const products = ctx.products ?? generateSingle('products', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const p = pick(products);
        out.push({
          id: uid('inv', idCache.inventory),
          productId: p.id,
          location: `${faker.location.city()} WH`,
          qty: faker.number.int({ min: 0, max: 1000 }),
          updatedAt: faker.date.recent({ days: 15 })
        });
      }
      break;
    }

    // Logistics & Inventory
    case 'warehouses': {
      for (let i = 0; i < qty; i++) {
        const city = faker.location.city();
        const state = faker.location.state?.() ?? 'State';
        const code = `${city.slice(0,2).toUpperCase()}-${faker.number.int({ min: 100, max: 999 })}`;
        out.push({
          id: uid('wh', idCache.warehouses),
          name: `${city} Fulfillment Center`,
          code,
          location: `${city}, ${state}`,
          capacity: faker.number.int({ min: 10000, max: 500000 }),
          active: (faker.datatype.boolean?.({ probability: 0.95 }) ?? true),
          updatedAt: faker.date.recent({ days: 60 })
        });
      }
      break;
    }
    case 'shipments': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const orders = ctx.orders ?? generateSingle('orders', Math.max(10, qty), ctx);
      const warehouses = ctx.warehouses ?? generateSingle('warehouses', Math.max(6, Math.ceil(qty / 2)), ctx);
      const carriers = ['UPS','FedEx','DHL','USPS','BlueDart','Delhivery'];
      for (let i = 0; i < qty; i++) {
        const order = pick(orders);
        const user = users.find((u: any) => u.id === order.userId) ?? pick(users);
        const origin = pick(warehouses);
        let dest = pick(warehouses);
        if (dest.id === origin.id) dest = pick(warehouses);
        const shippedAt = faker.date.soon({ days: 7, refDate: order.createdAt });
        const status = faker.helpers.weightedArrayElement([
          { value: 'in_transit', weight: 60 },
          { value: 'pending', weight: 10 },
          { value: 'delayed', weight: 10 },
          { value: 'delivered', weight: 18 },
          { value: 'cancelled', weight: 2 }
        ]);
        const deliveredAt = status === 'delivered' ? faker.date.soon({ days: 10, refDate: shippedAt }) : null;
        out.push({
          id: uid('shp', idCache.shipments),
          orderId: order.id,
          userId: user.id,
          originWarehouseId: origin.id,
          destinationWarehouseId: dest.id,
          carrier: pick(carriers),
          trackingNumber: `${faker.string.alphanumeric(10).toUpperCase()}${faker.number.int({ min: 1000, max: 9999 })}`,
          status,
          items: order.items,
          shippedAt,
          deliveredAt
        });
      }
      break;
    }
    case 'trackingUpdates': {
      const shipments = ctx.shipments ?? generateSingle('shipments', Math.max(8, qty), ctx);
      const statuses = ['pending','in_transit','delivered','delayed','cancelled','returned'];
      for (let i = 0; i < qty; i++) {
        const s = pick(shipments);
        const created = faker.date.soon({ days: 7, refDate: s.shippedAt });
        const status = pick(statuses);
        out.push({
          id: uid('trk', idCache.trackingUpdates),
          shipmentId: s.id,
          status,
          location: `${faker.location.city()}, ${faker.location.state?.() ?? 'State'}`,
          message: sentence(options.sentenceStyle, faker),
          createdAt: created
        });
      }
      break;
    }

    // Tech & DevOps
    case 'apiResponses': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const endpoints = ['/api/users','/api/orders','/api/products','/api/auth/login','/api/auth/logout','/api/reports'];
      const methods = ['GET','POST','PUT','PATCH','DELETE'];
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const endpoint = pick(endpoints) + (faker.datatype.boolean?.({ probability: 0.4 }) ? `/${faker.string.alphanumeric(6).toLowerCase()}` : '');
        const method = pick(methods);
        const statusCode = faker.helpers.weightedArrayElement([
          { value: 200, weight: 60 }, { value: 201, weight: 10 }, { value: 400, weight: 8 }, { value: 401, weight: 6 }, { value: 404, weight: 8 }, { value: 500, weight: 8 }
        ]);
        const headers = { 'content-type': 'application/json', 'x-request-id': faker.string.alphanumeric(12) };
        const body = statusCode >= 200 && statusCode < 300
          ? { success: true, message: sentence(options.sentenceStyle, faker) }
          : { success: false, error: sentence(options.sentenceStyle, faker) };
        const ts = faker.date.recent({ days: 7 });
        out.push({
          id: uid('api', idCache.apiResponses),
          userId: user.id,
          endpoint,
          method,
          statusCode,
          headers,
          body,
          responseTimeMs: faker.number.int({ min: 20, max: 1200 }),
          timestamp: ts,
          requestId: faker.string.alphanumeric(16)
        });
      }
      break;
    }
    case 'errorLogs': {
      const services = ['api-gateway','auth-service','order-service','product-service','billing-service','notification-worker'];
      const envs = ['dev','stage','prod'];
      for (let i = 0; i < qty; i++) {
        const level = faker.helpers.weightedArrayElement([
          { value: 'info', weight: 50 }, { value: 'warn', weight: 25 }, { value: 'error', weight: 20 }, { value: 'debug', weight: 5 }
        ]);
        const serviceName = pick(services);
        const env = pick(envs);
        const message = sentence(options.sentenceStyle, faker);
        const stack = level === 'error' || level === 'warn'
          ? `Error: ${message}\n    at ${serviceName}/module.ts: ${faker.number.int({ min: 10, max: 300 })}\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)`
          : null;
        const ts = faker.date.recent({ days: 14 });
        out.push({
          id: uid('log', idCache.errorLogs),
          level,
          serviceName,
          env,
          message,
          stack,
          context: { node: `node-${faker.number.int({ min: 1, max: 20 })}`, correlation: faker.string.alphanumeric(12) },
          timestamp: ts,
          requestId: (faker.datatype.boolean?.({ probability: 0.5 }) ?? true) ? faker.string.alphanumeric(16) : null
        });
      }
      break;
    }
    case 'systemMetrics': {
      const services = ['api-gateway','auth-service','order-service','product-service','billing-service','notification-worker'];
      const metrics = ['CPU_USAGE','MEMORY_USAGE','REQ_RATE','LATENCY_MS','ERROR_RATE'];
      for (let i = 0; i < qty; i++) {
        const serviceName = pick(services);
        const metric = pick(metrics);
        let value = 0; let unit = '';
        switch (metric) {
          case 'CPU_USAGE': value = faker.number.float({ min: 0, max: 100, precision: 0.1 }); unit = '%'; break;
          case 'MEMORY_USAGE': value = faker.number.float({ min: 100, max: 32768, precision: 0.1 }); unit = 'MB'; break;
          case 'REQ_RATE': value = faker.number.float({ min: 0, max: 5000, precision: 0.1 }); unit = 'req/s'; break;
          case 'LATENCY_MS': value = faker.number.float({ min: 1, max: 2000, precision: 0.1 }); unit = 'ms'; break;
          case 'ERROR_RATE': value = faker.number.float({ min: 0, max: 20, precision: 0.01 }); unit = '%'; break;
        }
        out.push({
          id: uid('met', idCache.systemMetrics),
          serviceName,
          metric,
          value: Math.round(value * 100) / 100,
          unit,
          capturedAt: faker.date.recent({ days: 7 }),
          node: `node-${faker.number.int({ min: 1, max: 20 })}`,
          tags: faker.helpers.arrayElements(['primary','canary','blue','green','critical','normal'], { min: 0, max: 3 })
        });
      }
      break;
    }
    case 'configFiles': {
      const services = ['api-gateway','auth-service','order-service','product-service','billing-service','notification-worker'];
      const formats = ['json','yaml','toml','ini'];
      for (let i = 0; i < qty; i++) {
        const serviceName = pick(services);
        const version = `v${faker.number.int({ min: 1, max: 3 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 9 })}`;
        const format = pick(formats);
        const base = { serviceName, version, env: pick(['dev','stage','prod']), port: faker.number.int({ min: 1024, max: 9999 }), enableTracing: faker.datatype.boolean?.({ probability: 0.5 }) ?? false };
        let content = '';
        if (format === 'json') {
          content = JSON.stringify(base, null, 2);
        } else if (format === 'yaml') {
          content = `serviceName: ${serviceName}\nversion: ${version}\nenv: ${base.env}\nport: ${base.port}\nenableTracing: ${String(base.enableTracing)}`;
        } else if (format === 'toml') {
          content = `serviceName = "${serviceName}"\nversion = "${version}"\nenv = "${base.env}"\nport = ${base.port}\nenableTracing = ${String(base.enableTracing)}`;
        } else {
          content = `serviceName=${serviceName}\nversion=${version}\nenv=${base.env}\nport=${base.port}\nenableTracing=${String(base.enableTracing)}`;
        }
        const created = faker.date.recent({ days: 120 });
        const updated = faker.date.soon({ days: 60, refDate: created });
        out.push({
          id: uid('cfg', idCache.configFiles),
          serviceName,
          version,
          format,
          content,
          createdAt: created,
          updatedAt: updated,
          active: (faker.datatype.boolean?.({ probability: 0.8 }) ?? true)
        });
      }
      break;
    }

    // Business Domains
    case 'policyDetails': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const providers = ['Allied Insurance','SecureLife','Guardian Health','SafeAuto','HomeShield','TravelSure','BizCover'];
      const types = ['health','life','auto','home','travel','business'];
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const start = faker.date.recent({ days: 365 });
        const end = faker.date.soon({ days: 365 * 5, refDate: start });
        const status = faker.helpers.weightedArrayElement([
          { value: 'active', weight: 70 },
          { value: 'lapsed', weight: 10 },
          { value: 'cancelled', weight: 10 },
          { value: 'expired', weight: 10 }
        ]);
        out.push({
          id: uid('pol', idCache.policyDetails),
          userId: user.id,
          policyNumber: `${faker.string.alphanumeric(6).toUpperCase()}-${faker.number.int({ min: 100000, max: 999999 })}`,
          provider: pick(providers),
          type: pick(types),
          premium: faker.number.float({ min: 500, max: 200000, precision: 0.01 }),
          coverageAmount: faker.number.int({ min: 50000, max: 50000000 }),
          startDate: start,
          endDate: end,
          status
        });
      }
      break;
    }
    case 'insuranceClaims': {
      const policies = ctx.policyDetails ?? generateSingle('policyDetails', Math.max(10, qty), ctx);
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const policy = pick(policies);
        const user = users.find((u: any) => u.id === policy.userId) ?? pick(users);
        const incident = faker.date.recent({ days: 180 });
        const claimDate = faker.date.soon({ days: 30, refDate: incident });
        const amountClaimed = faker.number.int({ min: 1000, max: Math.max(5000, Math.floor(policy.coverageAmount * 0.1)) });
        const status = faker.helpers.weightedArrayElement([
          { value: 'submitted', weight: 15 },
          { value: 'in_review', weight: 35 },
          { value: 'approved', weight: 25 },
          { value: 'rejected', weight: 15 },
          { value: 'paid', weight: 10 }
        ]);
        const amountApproved = status === 'approved' || status === 'paid'
          ? Math.min(amountClaimed, faker.number.int({ min: Math.floor(amountClaimed * 0.5), max: amountClaimed }))
          : 0;
        out.push({
          id: uid('clm', idCache.insuranceClaims),
          policyId: policy.id,
          userId: user.id,
          claimNumber: `${faker.string.alphanumeric(8).toUpperCase()}-${faker.number.int({ min: 1000, max: 9999 })}`,
          incidentDate: incident,
          claimDate,
          amountClaimed,
          amountApproved,
          status,
          description: sentence(options.sentenceStyle, faker)
        });
      }
      break;
    }
    case 'employees': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const departments = ['Engineering','Sales','Marketing','HR','Finance','Operations','Support','IT'];
      const roles = ['Software Engineer','Senior Engineer','Tech Lead','Manager','Analyst','Coordinator','Administrator'];
      const codes = new Set<string>();
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        let employeeCode = `EMP-${faker.number.int({ min: 10000, max: 99999 })}`;
        while (codes.has(employeeCode)) employeeCode = `EMP-${faker.number.int({ min: 10000, max: 99999 })}`;
        codes.add(employeeCode);
        const doj = faker.date.past({ years: 8 });
        const status = faker.helpers.weightedArrayElement([
          { value: 'active', weight: 80 },
          { value: 'on_leave', weight: 10 },
          { value: 'terminated', weight: 10 }
        ]);
        out.push({
          id: uid('emp', idCache.employees),
          userId: user.id,
          employeeCode,
          department: pick(departments),
          role: pick(roles),
          location: `${faker.location.city()}, ${faker.location.state?.() ?? 'State'}`,
          dateOfJoining: doj,
          status,
          salaryAnnual: faker.number.int({ min: 300000, max: 8000000 }),
          managerEmployeeCode: (faker.datatype.boolean?.({ probability: 0.2 }) ?? false) ? `EMP-${faker.number.int({ min: 10000, max: 99999 })}` : null
        });
      }
      break;
    }
    case 'payrolls': {
      const employees = ctx.employees ?? generateSingle('employees', Math.max(10, qty), ctx);
      for (let i = 0; i < qty; i++) {
        const e = pick(employees);
        const ref = faker.date.recent({ days: 120 });
        const periodStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
        const periodEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
        const monthlyBase = Math.round((e.salaryAnnual ?? 600000) / 12);
        const allowances = faker.number.int({ min: 0, max: Math.floor(monthlyBase * 0.2) });
        const gross = monthlyBase + allowances;
        const tax = Math.round(gross * (faker.number.float({ min: 0.05, max: 0.25, precision: 0.01 })));
        const deductions = faker.number.int({ min: 0, max: Math.floor(gross * 0.1) });
        const net = gross - tax - deductions;
        const status = faker.helpers.weightedArrayElement([
          { value: 'paid', weight: 85 }, { value: 'processed', weight: 10 }, { value: 'failed', weight: 5 }
        ]);
        out.push({
          id: uid('pay', idCache.payrolls),
          employeeId: e.id,
          periodStart,
          periodEnd,
          grossPay: gross,
          tax,
          deductions,
          netPay: net,
          currency: pick(['INR','USD','EUR']),
          paidAt: status === 'paid' ? faker.date.soon({ days: 10, refDate: periodEnd }) : null,
          paymentMethod: pick(['bank_transfer','cheque','cash','wallet']),
          status
        });
      }
      break;
    }

    // Security & Authentication
    case 'permissions': {
      const basePerms = [
        'read:users','write:users','delete:users',
        'read:orders','write:orders','delete:orders',
        'read:products','write:products','delete:products',
        'read:inventory','write:inventory','delete:inventory'
      ];
      for (let i = 0; i < qty; i++) {
        const name = basePerms[i % basePerms.length] + (i >= basePerms.length ? `:${i}` : '');
        out.push({
          id: uid('perm', idCache.permissions),
          name,
          description: `Permission to ${name.split(':')[0]} ${name.split(':')[1]}`
        });
      }
      break;
    }
    case 'roles': {
      const perms = ctx.permissions ?? generateSingle('permissions', Math.max(8, qty));
      const roleNames = ['admin','editor','viewer','developer','ops','support'];
      for (let i = 0; i < qty; i++) {
        const name = roleNames[i % roleNames.length] + (i >= roleNames.length ? `-${i}` : '');
        const permIds = faker.helpers.arrayElements(perms.map((p: any) => p.id), { min: 3, max: Math.min(8, perms.length) });
        out.push({
          id: uid('role', idCache.roles),
          name,
          permissionIds: permIds
        });
      }
      break;
    }
    case 'userRoles': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const roles = ctx.roles ?? generateSingle('roles', Math.max(5, qty), ctx);
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const role = pick(roles);
        out.push({
          id: uid('urole', idCache.userRoles),
          userId: user.id,
          roleId: role.id,
          assignedAt: faker.date.recent({ days: 365 })
        });
      }
      break;
    }
    case 'loginSessions': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const randIp = () => `${faker.number.int({min:1,max:255})}.${faker.number.int({min:0,max:255})}.${faker.number.int({min:0,max:255})}.${faker.number.int({min:1,max:254})}`;
      const uaPool = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 Version/17 Safari/605.1.15',
        'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Gecko/20100101 Firefox/121.0'
      ];
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const start = faker.date.recent({ days: 30 });
        const end = faker.date.soon({ days: 14, refDate: start });
        out.push({
          id: uid('sess', idCache.loginSessions),
          userId: user.id,
          ip: (faker.internet?.ip?.() as string) || randIp(),
          userAgent: (faker.internet?.userAgent?.() as string) || pick(uaPool),
          createdAt: start,
          expiresAt: end,
          active: (faker.datatype.boolean?.({ probability: 0.7 }) ?? true)
        });
      }
      break;
    }
    case 'jwtTokens': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const seg = () => btoa(faker.string.alphanumeric(24)).replace(/=+/g,'');
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const issued = faker.date.recent({ days: 7 });
        const exp = faker.date.soon({ days: 14, refDate: issued });
        out.push({
          id: uid('jwt', idCache.jwtTokens),
          userId: user.id,
          token: `${seg()}.${seg()}.${seg()}`,
          issuedAt: issued,
          expiresAt: exp,
          revoked: (faker.datatype.boolean?.({ probability: 0.1 }) ?? false)
        });
      }
      break;
    }
    case 'oauthCredentials': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const providers = ['google','github','microsoft','facebook','twitter'];
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const provider = pick(providers);
        out.push({
          id: uid('oauth', idCache.oauthCredentials),
          userId: user.id,
          provider,
          clientId: faker.string.alphanumeric(16),
          clientSecret: faker.string.alphanumeric(32),
          accessToken: faker.string.alphanumeric(48),
          refreshToken: faker.string.alphanumeric(48),
          scope: faker.helpers.arrayElements(['profile','email','openid','repo','user:read','calendar'], { min: 1, max: 4 }),
          expiresAt: faker.date.soon({ days: 30 })
        });
      }
      break;
    }
    case 'apiKeys': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        out.push({
          id: uid('key', idCache.apiKeys),
          userId: user.id,
          name: `Service Key ${i + 1}`,
          key: `${faker.string.alphanumeric(12)}-${faker.string.alphanumeric(12)}-${faker.string.alphanumeric(8)}`.toUpperCase(),
          createdAt: faker.date.recent({ days: 365 }),
          lastUsedAt: (faker.datatype.boolean?.({ probability: 0.6 }) ?? true) ? faker.date.recent({ days: 60 }) : null,
          active: (faker.datatype.boolean?.({ probability: 0.85 }) ?? true)
        });
      }
      break;
    }

    // Financial & Banking
    case 'bankAccounts': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const banks = ['HDFC Bank','ICICI Bank','State Bank of India','Axis Bank','Kotak Mahindra Bank','Bank of America'];
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const bankName = pick(banks);
        const accNum = `${faker.number.int({min:1000000000,max:9999999999})}${faker.number.int({min:1000,max:9999})}`;
        const iban = `IN${faker.number.int({min:10,max:99})}${faker.string.alphanumeric(20).toUpperCase()}`;
        out.push({
          id: uid('acct', idCache.bankAccounts),
          userId: user.id,
          bankName,
          accountType: pick(['checking','savings','salary','business']),
          accountNumber: accNum,
          ifscOrIban: iban,
          currency: pick(['INR','USD','EUR']),
          balance: faker.number.float({ min: 0, max: 500000, precision: 0.01 }),
          createdAt: faker.date.recent({ days: 1000 })
        });
      }
      break;
    }
    case 'creditCards': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const brands = ['Visa','Mastercard','Amex','RuPay','Discover'];
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const brand = pick(brands);
        const last4 = String(faker.number.int({min:1000,max:9999}));
        const token = `${brand.toUpperCase()}_${faker.string.alphanumeric(24)}`;
        const expMonth = faker.number.int({ min: 1, max: 12 });
        const expYear = faker.number.int({ min: 2026, max: 2035 });
        out.push({
          id: uid('card', idCache.creditCards),
          userId: user.id,
          brand,
          last4,
          token,
          expiry: `${String(expMonth).padStart(2,'0')}/${expYear}`,
          creditLimit: faker.number.int({ min: 20000, max: 1000000 }),
          active: (faker.datatype.boolean?.({ probability: 0.9 }) ?? true)
        });
      }
      break;
    }
    case 'loanApplications': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const types = ['home','auto','personal','education','business'];
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const type = pick(types);
        const submitted = faker.date.recent({ days: 180 });
        const status = faker.helpers.weightedArrayElement([
          { value: 'submitted', weight: 20 },
          { value: 'in_review', weight: 30 },
          { value: 'approved', weight: 40 },
          { value: 'rejected', weight: 10 },
        ]);
        out.push({
          id: uid('loan', idCache.loanApplications),
          userId: user.id,
          type,
          amount: faker.number.int({ min: 50000, max: 50000000 }),
          termMonths: faker.number.int({ min: 6, max: 360 }),
          status,
          submittedAt: submitted,
          decisionAt: status === 'submitted' || status === 'in_review' ? null : faker.date.soon({ days: 30, refDate: submitted })
        });
      }
      break;
    }
    case 'paymentGateways': {
      const providers = ['Stripe','Razorpay','PayPal','Square','Adyen'];
      for (let i = 0; i < qty; i++) {
        const provider = pick(providers);
        out.push({
          id: uid('pg', idCache.paymentGateways),
          provider,
          merchantId: `${provider.toUpperCase()}_${faker.string.alphanumeric(12)}`,
          apiKey: faker.string.alphanumeric(32),
          webhookSecret: faker.string.alphanumeric(32),
          callbackUrl: `https://example.com/hooks/${provider.toLowerCase()}`,
          supportedCurrencies: faker.helpers.arrayElements(['INR','USD','EUR'], { min: 1, max: 3 }),
          environment: pick(['test','live'])
        });
      }
      break;
    }
    case 'invoices': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const itemCount = faker.number.int({ min: 1, max: 6 });
        const items = Array.from({ length: itemCount }).map((_, idx) => {
          const qtyItem = faker.number.int({ min: 1, max: 5 });
          const unitPrice = faker.number.float({ min: 99, max: 4999, precision: 0.01 });
          return { description: `Item ${idx + 1}`, qty: qtyItem, unitPrice };
        });
        const subtotal = items.reduce((s: number, it: any) => s + it.qty * it.unitPrice, 0);
        const tax = Math.round(subtotal * 0.18 * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;
        const issued = faker.date.recent({ days: 60 });
        const due = faker.date.soon({ days: 30, refDate: issued });
        const status = faker.helpers.weightedArrayElement([
          { value: 'draft', weight: 10 },
          { value: 'issued', weight: 20 },
          { value: 'paid', weight: 50 },
          { value: 'overdue', weight: 10 },
          { value: 'cancelled', weight: 10 }
        ]);
        out.push({
          id: uid('inv', idCache.invoices),
          userId: user.id,
          items,
          subtotal: Math.round(subtotal * 100) / 100,
          tax,
          total,
          currency: pick(['INR','USD','EUR']),
          status,
          issuedAt: issued,
          dueAt: due
        });
      }
      break;
    }

    // E-commerce & Retail
    case 'shoppingCarts': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const products = ctx.products ?? generateSingle('products', Math.max(20, qty));
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const itemCount = faker.number.int({ min: 1, max: 6 });
        const items = Array.from({ length: itemCount }).map(() => {
          const p = pick(products);
          const q = faker.number.int({ min: 1, max: 4 });
          return { productId: p.id, title: p.title, price: p.price, qty: q };
        });
        const subtotal = items.reduce((s: number, it: any) => s + it.price * it.qty, 0);
        const tax = Math.round(subtotal * 0.18 * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;
        out.push({
          id: uid('cart', idCache.shoppingCarts),
          userId: user.id,
          items,
          subtotal,
          tax,
          total,
          currency: pick(['INR','USD','EUR']),
          updatedAt: faker.date.recent({ days: 30 })
        });
      }
      break;
    }
    case 'coupons': {
      for (let i = 0; i < qty; i++) {
        const type = pick(['percent','fixed']);
        const value = type === 'percent' ? faker.number.int({ min: 5, max: 60 }) : faker.number.int({ min: 50, max: 5000 });
        const start = faker.date.recent({ days: 60 });
        const end = faker.date.soon({ days: 90, refDate: start });
        const usageLimit = faker.number.int({ min: 100, max: 10000 });
        const usedCount = faker.number.int({ min: 0, max: usageLimit });
        out.push({
          id: uid('cpn', idCache.coupons),
          code: `${faker.string.alphanumeric(6)}-${faker.string.alphanumeric(4)}`.toUpperCase(),
          discountType: type,
          value,
          currency: pick(['INR','USD','EUR']),
          validFrom: start,
          validTo: end,
          usageLimit,
          usedCount,
          active: usedCount < usageLimit && Date.now() < +end
        });
      }
      break;
    }

    // Content & Social
    case 'reviews': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const products = ctx.products ?? generateSingle('products', Math.max(20, qty));
      for (let i = 0; i < qty; i++) {
        const user = pick(users); const p = pick(products);
        const rating = faker.helpers.weightedArrayElement([
          { value: 5, weight: 40 }, { value: 4, weight: 30 }, { value: 3, weight: 15 }, { value: 2, weight: 10 }, { value: 1, weight: 5 }
        ]);
        out.push({
          id: uid('rev', idCache.reviews),
          userId: user.id,
          productId: p.id,
          rating,
          title: sentence(options.sentenceStyle, faker),
          text: sentence(options.sentenceStyle, faker),
          helpfulVotes: faker.number.int({ min: 0, max: 500 }),
          createdAt: faker.date.recent({ days: 120 })
        });
      }
      break;
    }
    case 'socialProfiles': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const platforms = ['twitter','facebook','instagram','linkedin','youtube','tiktok'];
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const platform = pick(platforms);
        const handle = `${platform}_${faker.string.alphanumeric(8)}`.toLowerCase();
        out.push({
          id: uid('sp', idCache.socialProfiles),
          userId: user.id,
          platform,
          handle,
          url: `https://${platform}.com/${handle}`,
          followers: faker.number.int({ min: 0, max: 1000000 }),
          following: faker.number.int({ min: 0, max: 5000 }),
          verified: (faker.datatype.boolean?.({ probability: 0.1 }) ?? false),
          createdAt: faker.date.recent({ days: 2000 })
        });
      }
      break;
    }
    case 'messages': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const from = pick(users); let to = pick(users);
        if (to.id === from.id) to = pick(users);
        const created = faker.date.recent({ days: 30 });
        const status = faker.helpers.weightedArrayElement([
          { value: 'sent', weight: 10 }, { value: 'delivered', weight: 30 }, { value: 'read', weight: 60 }
        ]);
        out.push({
          id: uid('msg', idCache.messages),
          fromUserId: from.id,
          toUserId: to.id,
          content: sentence(options.sentenceStyle, faker),
          status,
          createdAt: created,
          readAt: status === 'read' ? faker.date.soon({ days: 2, refDate: created }) : null
        });
      }
      break;
    }
    case 'notifications': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const types = ['order_shipped','discount_offer','system','security_alert','message'];
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const type = pick(types);
        const title = type === 'order_shipped' ? 'Your order has shipped' : type === 'discount_offer' ? 'Exclusive discount just for you' : sentence(options.sentenceStyle, faker);
        out.push({
          id: uid('ntf', idCache.notifications),
          userId: user.id,
          type,
          title,
          body: sentence(options.sentenceStyle, faker),
          priority: pick(['low','normal','high']),
          createdAt: faker.date.recent({ days: 90 }),
          read: (faker.datatype.boolean?.({ probability: 0.5 }) ?? false)
        });
      }
      break;
    }

    // Events & Scheduling
    case 'appointments': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const start = faker.date.soon({ days: 30 });
        const end = faker.date.soon({ days: 1, refDate: start });
        const status = faker.helpers.weightedArrayElement([
          { value: 'scheduled', weight: 70 },
          { value: 'completed', weight: 20 },
          { value: 'cancelled', weight: 10 }
        ]);
        out.push({
          id: uid('appt', idCache.appointments),
          userId: user.id,
          title: sentence(options.sentenceStyle, faker),
          start,
          end,
          location: `${faker.location.city()}, ${faker.location.state?.() ?? 'State'}`,
          status
        });
      }
      break;
    }
    case 'reminders': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const remindAt = faker.date.soon({ days: 14 });
        const repeat = pick(['none','daily','weekly','monthly']);
        out.push({
          id: uid('rem', idCache.reminders),
          userId: user.id,
          title: sentence(options.sentenceStyle, faker),
          remindAt,
          repeat,
          done: (faker.datatype.boolean?.({ probability: 0.2 }) ?? false)
        });
      }
      break;
    }
    case 'tickets': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const events = ctx.events ?? generateSingle('events', Math.max(10, qty));
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const event = pick(events);
        const seat = `${pick(['A','B','C','D','E'])}-${faker.number.int({ min: 1, max: 50 })}`;
        const status = faker.helpers.weightedArrayElement([
          { value: 'reserved', weight: 20 },
          { value: 'paid', weight: 70 },
          { value: 'cancelled', weight: 10 }
        ]);
        out.push({
          id: uid('tkt', idCache.tickets),
          eventId: event.id,
          userId: user.id,
          seat,
          price: faker.number.float({ min: 199, max: 4999, precision: 0.01 }),
          currency: pick(['INR','USD','EUR']),
          status
        });
      }
      break;
    }

    // Healthcare
    case 'patients': {
      const users = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const bloods = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
      const genders = ['male','female','other'];
      const allergyPool = ['penicillin','peanuts','dust','pollen','gluten','lactose'];
      const conditionPool = ['hypertension','diabetes','asthma','thyroid','anemia'];
      for (let i = 0; i < qty; i++) {
        const user = pick(users);
        const dob = faker.date.past({ years: faker.number.int({ min: 18, max: 80 }) });
        out.push({
          id: uid('pat', idCache.patients),
          userId: user.id,
          dob,
          gender: pick(genders),
          bloodType: pick(bloods),
          allergies: faker.helpers.arrayElements(allergyPool, { min: 0, max: 3 }),
          conditions: faker.helpers.arrayElements(conditionPool, { min: 0, max: 3 }),
          active: (faker.datatype.boolean?.({ probability: 0.9 }) ?? true),
          createdAt: faker.date.recent({ days: 1000 })
        });
      }
      break;
    }
    case 'prescriptions': {
      const patients = ctx.patients ?? generateSingle('patients', Math.max(10, qty), ctx);
      const doctors = ctx.users ?? generateSingle('users', Math.max(10, qty));
      const meds = ['Amoxicillin','Ibuprofen','Paracetamol','Metformin','Atorvastatin','Omeprazole'];
      const freq = ['OD','BD','TDS','QHS'];
      for (let i = 0; i < qty; i++) {
        const patient = pick(patients);
        const doctor = pick(doctors);
        const medCount = faker.number.int({ min: 1, max: 4 });
        const medications = Array.from({ length: medCount }).map(() => ({
          name: pick(meds), dose: `${faker.number.int({ min: 5, max: 1000 })} mg`, frequency: pick(freq), durationDays: faker.number.int({ min: 3, max: 30 })
        }));
        out.push({
          id: uid('rx', idCache.prescriptions),
          patientId: patient.id,
          doctorUserId: doctor.id,
          medications,
          issuedAt: faker.date.recent({ days: 60 }),
          notes: sentence(options.sentenceStyle, faker)
        });
      }
      break;
    }
    case 'labReports': {
      const patients = ctx.patients ?? generateSingle('patients', Math.max(10, qty), ctx);
      const tests = ['CBC','Lipid Profile','HbA1c','Thyroid','Vitamin D','LFT'];
      for (let i = 0; i < qty; i++) {
        const patient = pick(patients);
        const testType = pick(tests);
        const values = (() => {
          switch (testType) {
            case 'CBC': return [
              { name: 'Hemoglobin', value: faker.number.float({ min: 10, max: 16, precision: 0.1 }), unit: 'g/dL' },
              { name: 'WBC', value: faker.number.int({ min: 4000, max: 11000 }), unit: 'cells/uL' }
            ];
            case 'Lipid Profile': return [
              { name: 'Total Cholesterol', value: faker.number.int({ min: 120, max: 280 }), unit: 'mg/dL' },
              { name: 'LDL', value: faker.number.int({ min: 60, max: 200 }), unit: 'mg/dL' },
              { name: 'HDL', value: faker.number.int({ min: 30, max: 90 }), unit: 'mg/dL' }
            ];
            case 'HbA1c': return [
              { name: 'HbA1c', value: faker.number.float({ min: 4.5, max: 12, precision: 0.1 }), unit: '%' }
            ];
            case 'Thyroid': return [
              { name: 'TSH', value: faker.number.float({ min: 0.1, max: 8, precision: 0.01 }), unit: 'mIU/L' }
            ];
            case 'Vitamin D': return [
              { name: '25-OH Vitamin D', value: faker.number.int({ min: 10, max: 90 }), unit: 'ng/mL' }
            ];
            case 'LFT': return [
              { name: 'ALT', value: faker.number.int({ min: 10, max: 120 }), unit: 'U/L' },
              { name: 'AST', value: faker.number.int({ min: 10, max: 120 }), unit: 'U/L' }
            ];
            default: return [];
          }
        })();
        out.push({
          id: uid('lab', idCache.labReports),
          patientId: patient.id,
          testType,
          values,
          reportedAt: faker.date.recent({ days: 45 }),
          notes: sentence(options.sentenceStyle, faker)
        });
      }
      break;
    }
  }
  return out;
}
