/* Lightweight adapter to access faker via CDN without bundling. */

export type Faker = any;

declare global {
  interface Window { __faker?: Faker; }
}

export function getFaker(): Faker {
  if (typeof window !== 'undefined' && window.__faker) return window.__faker;
  // Minimal fallback if CDN fails: very basic randoms
  const rand = {
    int: ({ min = 0, max = 100 } = {}) => Math.floor(Math.random() * (max - min + 1)) + min,
    float: ({ min = 0, max = 1, precision = 0.01 } = {}) => Math.round((min + Math.random() * (max - min)) / precision) * precision,
    bool: ({ probability = 0.5 } = {}) => Math.random() < probability,
    pick: (arr: any[]) => arr[Math.floor(Math.random() * arr.length)],
    id: (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 12)}`
  };
  return {
    seed: (_: number) => {},
    setLocale: (_: string) => {},
    person: { fullName: () => `User ${rand.int({min:1000,max:9999})}` },
    internet: { email: () => `user${rand.int({min:10000,max:99999})}@example.com` },
    phone: { number: () => `+91-${rand.int({min:7000000000,max:9999999999})}` },
    company: {
      phrase: () => {
        const phrases = [
          'Empower teams with robust cloud solutions.',
          'Deliver seamless, scalable digital experiences.',
          'Accelerate innovation through automation.',
          'Unlock insights with real-time analytics.'
        ];
        return rand.pick(phrases);
      },
      catchPhrase: () => {
        const phrases = [
          'Innovate. Integrate. Elevate.',
          'Experience the difference.',
          'Built for speed and reliability.',
          'Secure by design.'
        ];
        return rand.pick(phrases);
      }
    },
    hacker: {
      phrase: () => {
        const phrases = [
          'Refactor the module to improve performance.',
          'Add retry logic and better error handling.',
          'Optimize database queries for large datasets.',
          'Improve accessibility and keyboard navigation.',
          'Introduce caching to reduce API latency.',
          'Enhance security by validating input on the server.',
          'Add pagination and infinite scroll to the list.',
          'Reduce bundle size by removing unused dependencies.'
        ];
        return rand.pick(phrases);
      }
    },
    location: {
      streetAddress: () => `${rand.int({min:1,max:999})} Main St`,
      city: () => `City ${rand.int({min:1,max:99})}`,
      state: () => `State ${rand.int({min:1,max:29})}`,
      zipCode: () => `${rand.int({min:100000,max:999999})}`
    },
    date: {
      past: ({ years = 1 } = {}) => new Date(Date.now() - rand.int({min:1,max:365*years}) * 86400000),
      recent: ({ days = 30 } = {}) => new Date(Date.now() - rand.int({min:0,max:days}) * 86400000),
      soon: ({ days = 30, refDate }: any = {}) => new Date((refDate ? +new Date(refDate) : Date.now()) + rand.int({min:0,max:days}) * 86400000)
    },
    datatype: { boolean: ({ probability = 0.5 } = {}) => rand.bool({ probability }) },
    commerce: {
      productName: () => `Product ${rand.int({min:1000,max:9999})}`,
      price: ({ min = 1, max = 1000 } = {}) => rand.float({ min, max, precision: 1 }).toFixed(2),
      department: () => `Category ${rand.int({min:1,max:20})}`
    },
    number: { int: rand.int, float: rand.float },
    helpers: {
      arrayElements: (arr: any[], { min = 0, max = 2 } = {}) => {
        const n = rand.int({ min, max });
        const copy = [...arr];
        const out: any[] = [];
        for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(rand.int({min:0,max:copy.length-1}),1)[0]);
        return out;
      },
      weightedArrayElement: (entries: { value: string; weight: number }[]) => {
        const sum = entries.reduce((s,e)=>s+e.weight,0);
        let r = Math.random() * sum;
        for (const e of entries) { if ((r -= e.weight) < 0) return e.value; }
        return entries[0].value;
      }
    },
    string: { alphanumeric: (len = 10) => Math.random().toString(36).slice(2, 2 + len) }
  };
}
