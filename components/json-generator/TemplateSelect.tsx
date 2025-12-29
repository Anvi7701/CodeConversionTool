import React from 'react';
import { Schemas, TemplateId } from '../../lib/generator/schemas';

interface Props {
  value: TemplateId;
  onChange: (t: TemplateId) => void;
  'aria-label'?: string;
}

// Category mapping for grouping templates in the dropdown
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

  if (security.includes(id)) return 'Security & Auth';
  if (finance.includes(id)) return 'Financial & Banking';
  if (retail.includes(id)) return 'E-commerce & Retail';
  if (social.includes(id)) return 'Content & Social';
  if (events.includes(id)) return 'Events & Scheduling';
  if (health.includes(id)) return 'Healthcare';
  if (devops.includes(id)) return 'Tech & DevOps';
  if (business.includes(id)) return 'Business Domains';
  if (logistics.includes(id)) return 'Logistics & Inventory';
  return 'Logistics & Inventory';
}

export const TemplateSelect: React.FC<Props> = ({ value, onChange, ...aria }) => {
  const allTemplates = Object.values(Schemas).map(s => ({ id: s.id, title: s.title, category: getCategory(s.id) }));
  const categories = Array.from(new Set(allTemplates.map(t => t.category)));

  return (
    <div>
      <label htmlFor="template" className="block text-sm text-slate-300 mb-1">Data Template</label>
      <select
        id="template"
        value={value}
        onChange={e => onChange(e.target.value as TemplateId)}
        className="w-full rounded-md bg-slate-700 border border-slate-600 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...aria}
      >
        {categories.map(cat => (
          <optgroup key={cat} label={cat}>
            {allTemplates.filter(t => t.category === cat).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};
