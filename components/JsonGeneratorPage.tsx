import React, { useMemo, useState, useRef } from 'react';
import { TemplateId, Schemas } from '../lib/generator/schemas';
import { generate } from '../lib/generator/engine';
import { TemplateSelect } from './json-generator/TemplateSelect';
import { QuantityInput } from './json-generator/QuantityInput';
import { DescriptionBar } from './json-generator/DescriptionBar';
import { GenerateButton } from './json-generator/GenerateButton';
import { JsonOutputPanel } from './json-generator/JsonOutputPanel';
import SEO from './SEO';

const TEMPLATES = Object.values(Schemas).map(s => ({ id: s.id, title: s.title, description: s.description }));

function getCategory(id: TemplateId): string {
  const security: TemplateId[] = ['loginSessions','jwtTokens','oauthCredentials','apiKeys','roles','permissions','userRoles'];
  const finance: TemplateId[] = ['bankAccounts','creditCards','loanApplications','paymentGateways','invoices','transactions'];
  const retail: TemplateId[] = ['users','products','orders','shoppingCarts','coupons'];
  const social: TemplateId[] = ['blogPosts','comments','reviews','socialProfiles','messages','notifications'];
  const events: TemplateId[] = ['events','appointments','reminders','tickets'];
  const health: TemplateId[] = ['patients','prescriptions','labReports'];
  const devops: TemplateId[] = ['apiResponses','errorLogs','systemMetrics','configFiles'];
  const business: TemplateId[] = ['policyDetails','insuranceClaims','employees','payrolls'];
  const logistics: TemplateId[] = ['warehouses','shipments','trackingUpdates','inventory'];
  if (security.includes(id)) return 'Authentication & Security';
  if (finance.includes(id)) return 'Financial & Banking';
  if (retail.includes(id)) return 'E-commerce & Retail';
  if (social.includes(id)) return 'Content & Social';
  if (events.includes(id)) return 'Events & Scheduling';
  if (health.includes(id)) return 'Healthcare';
  if (logistics.includes(id)) return 'Logistics & Inventory';
  if (devops.includes(id)) return 'Tech & DevOps';
  if (business.includes(id)) return 'Custom Business Domains';
  return 'Logistics & Inventory';
}

const CATEGORY_ORDER = [
  'Authentication & Security',
  'Financial & Banking',
  'E-commerce & Retail',
  'Content & Social',
  'Events & Scheduling',
  'Healthcare',
  'Logistics & Inventory',
  'Tech & DevOps',
  'Custom Business Domains'
];

// Category-specific tile styling (light/dark theme-aware) with soft hover tints
const CATEGORY_TILE_STYLE: Record<string, string> = {
  'Authentication & Security': 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/45 border-indigo-200 dark:border-indigo-700',
  'Financial & Banking': 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-900/45 border-teal-200 dark:border-teal-700',
  'E-commerce & Retail': 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/30 dark:hover:bg-sky-900/45 border-sky-200 dark:border-sky-700',
  'Content & Social': 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 border-rose-200 dark:border-rose-700',
  'Events & Scheduling': 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:hover:bg-cyan-900/45 border-cyan-200 dark:border-cyan-700',
  'Healthcare': 'bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/45 border-green-200 dark:border-green-700',
  'Logistics & Inventory': 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/30 dark:hover:bg-slate-900/45 border-slate-200 dark:border-slate-700',
  'Tech & DevOps': 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/45 border-purple-200 dark:border-purple-700',
  'Custom Business Domains': 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/45 border-blue-200 dark:border-blue-700'
};

// Category-specific hover text accents for the "Use" button
const CATEGORY_HOVER_TEXT: Record<string, string> = {
  'Authentication & Security': 'hover:text-indigo-700 dark:hover:text-indigo-300',
  'Financial & Banking': 'hover:text-teal-700 dark:hover:text-teal-300',
  'E-commerce & Retail': 'hover:text-sky-700 dark:hover:text-sky-300',
  'Content & Social': 'hover:text-rose-700 dark:hover:text-rose-300',
  'Events & Scheduling': 'hover:text-cyan-700 dark:hover:text-cyan-300',
  'Healthcare': 'hover:text-green-700 dark:hover:text-green-300',
  'Logistics & Inventory': 'hover:text-slate-700 dark:hover:text-slate-300',
  'Tech & DevOps': 'hover:text-purple-700 dark:hover:text-purple-300',
  'Custom Business Domains': 'hover:text-blue-700 dark:hover:text-blue-300'
};

// Category-specific hover border accents for the "Use" button
const CATEGORY_HOVER_BORDER: Record<string, string> = {
  'Authentication & Security': 'hover:border-indigo-300 dark:hover:border-indigo-700',
  'Financial & Banking': 'hover:border-teal-300 dark:hover:border-teal-700',
  'E-commerce & Retail': 'hover:border-sky-300 dark:hover:border-sky-700',
  'Content & Social': 'hover:border-rose-300 dark:hover:border-rose-700',
  'Events & Scheduling': 'hover:border-cyan-300 dark:hover:border-cyan-700',
  'Healthcare': 'hover:border-green-300 dark:hover:border-green-700',
  'Logistics & Inventory': 'hover:border-slate-400 dark:hover:border-slate-600',
  'Tech & DevOps': 'hover:border-purple-300 dark:hover:border-purple-700',
  'Custom Business Domains': 'hover:border-blue-300 dark:hover:border-blue-700'
};

const LOCALES = [{ key: 'en', label: 'English' }, { key: 'hi', label: 'हिन्दी' }];
const STYLES = [
  { key: 'technical', label: 'Technical (Hacker)' },
  { key: 'marketing', label: 'Marketing (Catch‑phrase)' },
  { key: 'simple', label: 'Simple (Plain English)' }
];
const LABELS: Record<string, Record<string, string>> = {
  en: {
    pageTitle: 'JSON Generator – Mock Data Templates for Every Industry',
    subtitle: 'Generate realistic mock JSON data for testing and development. Perfect for API testing, UI development, and database seeding.',
    panelTitle: 'JSON Data Generator',
    template: 'Data Template',
    quantity: 'Quantity (1–1000)',
    generate: 'Generate JSON',
    available: 'Supported JSON Templates',
    language: 'Language',
    style: 'Style'
  },
  hi: {
    pageTitle: 'JSON जेनरेटर',
    subtitle: 'टेस्टिंग और विकास के लिए वास्तविक दिखने वाला JSON डेटा बनाएं। यूज़र्स, प्रोडक्ट्स, ऑर्डर्स आदि टेम्पलेट चुनें।',
    panelTitle: 'JSON डेटा जेनरेटर',
    template: 'डेटा टेम्पलेट',
    quantity: 'मात्रा (1–1000)',
    generate: 'JSON बनाएं',
    available: 'उपलब्ध टेम्पलेट्स',
    language: 'भाषा',
    style: 'शैली'
  }
};

export default function JsonGeneratorPage() {
  const [template, setTemplate] = useState<TemplateId>('users');
  const [qty, setQty] = useState<number>(5);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<any[] | null>(null);
  const [locale, setLocale] = useState<'en' | 'hi'>('en');
  const [style, setStyle] = useState<'technical' | 'marketing' | 'simple'>('simple');
  const outputRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelHighlight, setPanelHighlight] = useState(false);

  const labels = LABELS[locale];
  const desc = useMemo(() => TEMPLATES.find(t => t.id === template)?.description ?? '', [template]);

  async function onGenerate() {
    if (qty < 1 || qty > 1000) return;
    try {
      setBusy(true);
      const data = generate(template, qty, { locale: locale === 'hi' ? 'en_IN' : 'en', pretty: true, sentenceStyle: style });
      setOutput(data);
      // Smooth scroll to output panel
      requestAnimationFrame(() => {
        const el = outputRef.current;
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      });
    } catch (e: any) {
      console.error('Generation error', e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <SEO
        title="JSON Generator – Mock Data Templates for Every Industry"
        description="Create realistic JSON mock data for API testing, UI development, and database seeding. Choose templates for Authentication, Banking, E-commerce, Healthcare, Logistics, and more."
        keywords="json generator online, mock json data generator, api testing json templates, e-commerce json mock data, healthcare json mock data"
      />
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Light hero section (separate from dark tool container) */}
        <section className="mb-4 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <h1 className="text-2xl font-bold">{labels.pageTitle}</h1>
          <h2 className="text-lg font-semibold mt-1">Generate JSON Data Instantly</h2>
          <p className="text-sm mt-2">{labels.subtitle}</p>
        </section>

        {/* Dark tool container */}
        <section ref={panelRef} className={`bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 ${panelHighlight ? 'panel-highlight' : ''}`}>
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-semibold">{labels.panelTitle}</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-300" htmlFor="gen-locale">{labels.language}</label>
              <select id="gen-locale" value={locale} onChange={e => setLocale(e.target.value as any)} className="px-2 py-1 text-sm rounded bg-white border border-slate-300 text-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:border-slate-600">
                {LOCALES.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
              </select>
              <label className="text-sm text-slate-300" htmlFor="gen-style">{labels.style}</label>
              <select id="gen-style" value={style} onChange={e => setStyle(e.target.value as any)} className="px-2 py-1 text-sm rounded bg-white border border-slate-300 text-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:border-slate-600">
                {STYLES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="group" aria-label="Generator controls">
            <TemplateSelect value={template} onChange={setTemplate} aria-label={labels.template} />
            <QuantityInput value={qty} onChange={setQty} />
            <GenerateButton busy={busy} onClick={onGenerate} />
          </div>

          <DescriptionBar text={desc} />
        </section>

        <div ref={outputRef} id="json-output" aria-live="polite" aria-relevant="additions">
          <JsonOutputPanel data={output} template={template} qty={qty} />
        </div>

        {/* Supported templates section - visually separated and theme-aware */}
        <section className="mt-10 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">{labels.available}</h2>
          <p className="text-sm mb-4 text-slate-700 dark:text-slate-300">
            Generate realistic mock JSON data for testing and development. Perfect for API testing, UI development, and database seeding.
            Our JSON Generator supports diverse domains including Authentication &amp; Security, Financial &amp; Banking, E-commerce &amp; Retail, Content &amp; Social,
            Events &amp; Scheduling, Healthcare, Logistics &amp; Inventory, Tech &amp; DevOps, and Custom Business Applications.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {TEMPLATES
              .map(t => ({ ...t, category: getCategory(t.id as TemplateId) }))
              .sort((a, b) => {
                const ca = CATEGORY_ORDER.indexOf(a.category);
                const cb = CATEGORY_ORDER.indexOf(b.category);
                if (ca !== cb) return ca - cb;
                return a.title.localeCompare(b.title);
              })
              .map(t => (
              <div key={t.id} className={`rounded-md p-2 border focus-within:ring-2 focus-within:ring-blue-500 transition-colors ${CATEGORY_TILE_STYLE[t.category] || 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700'}`}>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.title}</div>
                <div className="text-slate-600 dark:text-slate-400 text-xs truncate">{t.description}</div>
                <button
                  className={`mt-2 text-xs px-2 py-1 rounded border border-slate-400 text-slate-800 bg-white/70 hover:bg-white transition-colors dark:text-slate-100 dark:bg-slate-700/40 dark:hover:bg-slate-700 dark:border-slate-600 ${CATEGORY_HOVER_TEXT[t.category] || 'hover:text-slate-700 dark:hover:text-slate-300'} ${CATEGORY_HOVER_BORDER[t.category] || 'hover:border-slate-500 dark:hover:border-slate-500'}`}
                  onClick={() => {
                    setTemplate(t.id as TemplateId);
                    requestAnimationFrame(() => {
                      const el = panelRef.current;
                      if (!el) return;
                      const y = el.getBoundingClientRect().top + window.scrollY - 80;
                      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
                      const sel = document.getElementById('template') as HTMLSelectElement | null;
                      sel?.focus();
                      setPanelHighlight(true);
                      window.setTimeout(() => setPanelHighlight(false), 1300);
                    });
                  }}
                  aria-label={`Select ${t.title} template`}
                >Use</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
