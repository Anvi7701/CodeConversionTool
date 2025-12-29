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

const LOCALES = [{ key: 'en', label: 'English' }, { key: 'hi', label: 'हिन्दी' }];
const STYLES = [
  { key: 'technical', label: 'Technical (Hacker)' },
  { key: 'marketing', label: 'Marketing (Catch‑phrase)' },
  { key: 'simple', label: 'Simple (Plain English)' }
];
const LABELS: Record<string, Record<string, string>> = {
  en: {
    pageTitle: 'JSON Generator',
    subtitle: 'Generate realistic mock JSON data for testing and development. Choose from various templates including users, products, orders, and more. Perfect for API testing, UI development, and database seeding.',
    panelTitle: 'JSON Data Generator',
    template: 'Data Template',
    quantity: 'Quantity (1–1000)',
    generate: 'Generate JSON',
    available: 'Available Templates',
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
      <SEO title="JSON Generator" description="Generate mock JSON data with schema-driven templates." />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{labels.pageTitle}</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-300" htmlFor="gen-locale">{labels.language}</label>
            <select id="gen-locale" value={locale} onChange={e => setLocale(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1">
              {LOCALES.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
            </select>
            <label className="text-sm text-slate-300" htmlFor="gen-style">{labels.style}</label>
            <select id="gen-style" value={style} onChange={e => setStyle(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1">
              {STYLES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <p className="text-slate-300 mb-6">{labels.subtitle}</p>

        <section className="bg-slate-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">{labels.panelTitle}</h2>

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

        <section className="mt-10">
          <h3 className="text-lg font-semibold mb-3">{labels.available}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {TEMPLATES.map(t => (
              <div key={t.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 focus-within:ring-2 focus-within:ring-blue-500">
                <div className="font-medium">{t.title}</div>
                <div className="text-slate-400 text-sm">{t.description}</div>
                <button
                  className="mt-3 text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded"
                  onClick={() => setTemplate(t.id as TemplateId)}
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
