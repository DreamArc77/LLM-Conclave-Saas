import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — LLM Conclave',
  description: 'Privacy Policy for LLM Conclave. Learn how we handle your data.',
};

const EFFECTIVE_DATE = 'March 31, 2025';
const CONTACT_EMAIL = 'support@llmconclave.com';

export default function PrivacyPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Effective date: {EFFECTIVE_DATE}</p>

      <p className="text-gray-600 leading-relaxed text-[15px] mb-8">
        DreamArc (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates LLM Conclave at{' '}
        <a href="https://llmconclave.com" className="text-blue-600 hover:underline">llmconclave.com</a>.
        This Privacy Policy explains what information we collect, how we use it, and your rights
        regarding your personal data. We are committed to protecting your privacy and being transparent
        about our data practices.
      </p>

      <Section title="1. Operating Modes and Data Scope">
        <p>
          LLM Conclave operates in two distinct modes with significantly different data footprints:
        </p>
        <ul>
          <li>
            <strong>Open-Source / BYOK mode (self-hosted or local):</strong> All conversation data is
            stored exclusively in your browser&apos;s local storage (IndexedDB). No conversation content is
            transmitted to DreamArc servers. We have no access to your sessions, messages, or AI outputs.
          </li>
          <li>
            <strong>SaaS mode (llmconclave.com):</strong> Requires account registration. Conversation
            sessions initiated via the web interface are stored in your browser&apos;s local storage by
            default. AI Agent sessions are stored server-side in Supabase to enable multi-device access.
          </li>
        </ul>
      </Section>

      <Section title="2. Information We Collect">
        <h3 className="font-semibold text-gray-700 mt-4 mb-2">2.1 Information You Provide</h3>
        <ul>
          <li><strong>Email address</strong> — collected upon account registration via Supabase Auth (SaaS mode only).</li>
          <li><strong>OAuth profile</strong> — if you sign in with Google, we receive your name, email, and profile avatar from Google.</li>
          <li><strong>Payment information</strong> — processed exclusively by Stripe. We never see or store your full card number. We only receive a Stripe customer ID and transaction metadata.</li>
        </ul>

        <h3 className="font-semibold text-gray-700 mt-4 mb-2">2.2 Information Collected Automatically</h3>
        <ul>
          <li><strong>Session tokens</strong> — Supabase Auth sets a session cookie in your browser for authentication. This is essential for logged-in functionality and is not used for tracking.</li>
          <li><strong>Credit transaction records</strong> — purchase history, credit balance, and usage logs (SaaS mode only), stored in Supabase.</li>
          <li><strong>Server logs</strong> — standard HTTP request logs (IP address, timestamp, endpoint, HTTP status) retained for up to 30 days for security and debugging. These are not linked to your user profile.</li>
        </ul>

        <h3 className="font-semibold text-gray-700 mt-4 mb-2">2.3 What We Do Not Collect</h3>
        <ul>
          <li>We do not collect or store AI conversation content for standard web sessions (stored locally in your browser only).</li>
          <li>We do not use advertising cookies, tracking pixels, or third-party analytics.</li>
          <li>We do not sell or share your personal data with third parties for marketing purposes.</li>
        </ul>
      </Section>

      <Section title="3. API Keys (BYOK)">
        <p>
          If you provide your own API keys from OpenAI, Anthropic, Google, or other providers:
        </p>
        <ul>
          <li>Keys are transmitted to our server over HTTPS solely to proxy your request to the AI provider.</li>
          <li>Keys are <strong>held in memory only</strong> for the duration of the request and are <strong>never written to disk or any database</strong>.</li>
          <li>Keys entered in the Settings panel are stored in your browser&apos;s localStorage under the key <code>llmconclave-config</code>. This storage is local to your device and browser — we cannot access it.</li>
        </ul>
      </Section>

      <Section title="4. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service.</li>
          <li>Process credit purchases and manage your account balance.</li>
          <li>Authenticate your identity and maintain your login session.</li>
          <li>Respond to support requests and communications.</li>
          <li>Detect and prevent fraud, abuse, and security incidents.</li>
          <li>Comply with legal obligations.</li>
        </ul>
        <p>
          We do not use your data to train AI models, and we do not share conversation content with any
          third party beyond the AI provider processing your specific request.
        </p>
      </Section>

      <Section title="5. Third-Party Services">
        <p>We use the following third-party services, each governed by their own privacy policies:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 border border-gray-200 font-semibold">Provider</th>
                <th className="px-3 py-2 border border-gray-200 font-semibold">Purpose</th>
                <th className="px-3 py-2 border border-gray-200 font-semibold">Data Shared</th>
              </tr>
            </thead>
            <tbody>
              <ThirdPartyRow
                name="Supabase"
                purpose="Authentication & server-side data storage (SaaS)"
                data="Email, session data, credit records"
              />
              <ThirdPartyRow
                name="Stripe"
                purpose="Payment processing"
                data="Payment details, transaction records"
              />
              <ThirdPartyRow
                name="OpenRouter"
                purpose="AI model routing for preset models"
                data="Your query content (not linked to your account)"
              />
              <ThirdPartyRow
                name="Cloudflare"
                purpose="CDN, DDoS protection, SSL"
                data="IP address, HTTP headers"
              />
              <ThirdPartyRow
                name="Railway"
                purpose="Cloud hosting infrastructure"
                data="Server-side logs"
              />
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          When you use BYOK mode, your query is also sent to your chosen AI provider (OpenAI, Anthropic, Google, etc.) under their respective privacy policies.
        </p>
      </Section>

      <Section title="6. Data Retention">
        <ul>
          <li><strong>Account data</strong> — retained until you delete your account.</li>
          <li><strong>Credit transaction records</strong> — retained for 7 years for accounting and legal compliance.</li>
          <li><strong>Server logs</strong> — retained for up to 30 days.</li>
          <li><strong>Conversation data (browser local storage)</strong> — retained until you clear your browser data or delete sessions within the app.</li>
          <li><strong>Agent session data (Supabase)</strong> — retained until you delete the session or your account.</li>
        </ul>
      </Section>

      <Section title="7. Cookies">
        <p>
          We use only essential cookies necessary to operate the Service:
        </p>
        <ul>
          <li><strong>Supabase Auth session cookie</strong> — stores your login session. Expires as configured in Supabase Auth settings (typically 1 week).</li>
        </ul>
        <p>
          We do not use advertising cookies, analytics cookies (e.g., Google Analytics), or any cross-site
          tracking technologies.
        </p>
      </Section>

      <Section title="8. Your Rights">
        <p>
          Depending on your jurisdiction, you may have the following rights regarding your personal data:
        </p>
        <ul>
          <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
          <li><strong>Correction</strong> — ask us to correct inaccurate personal data.</li>
          <li><strong>Deletion</strong> — request deletion of your account and associated personal data (excluding records we are legally required to retain).</li>
          <li><strong>Data portability</strong> — request your data in a machine-readable format.</li>
          <li><strong>Objection / Restriction</strong> — object to or request restriction of certain processing activities.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>.
          We will respond within 30 days.
        </p>
      </Section>

      <Section title="9. Data Security">
        <p>
          We implement industry-standard security measures including:
        </p>
        <ul>
          <li>HTTPS/TLS encryption for all data in transit.</li>
          <li>Row-level security policies in Supabase ensuring users can only access their own data.</li>
          <li>API keys are never persisted to any server-side storage.</li>
        </ul>
        <p>
          No method of transmission over the internet is 100% secure. While we strive to protect your data,
          we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="10. Children's Privacy">
        <p>
          The Service is not directed to children under 13. We do not knowingly collect personal data from
          children under 13. If you believe a child has provided us with personal data, please contact us
          and we will promptly delete it.
        </p>
      </Section>

      <Section title="11. International Data Transfers">
        <p>
          Our infrastructure providers (Supabase, Railway, Cloudflare) may process data in data centers
          located in the United States, Europe, or other regions. By using the Service, you consent to
          such transfers. We ensure our providers maintain appropriate safeguards for international transfers.
        </p>
      </Section>

      <Section title="12. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the new policy on this page
          with an updated effective date. For material changes, we will notify registered users by email
          or via an in-app notice at least 7 days before the changes take effect.
        </p>
      </Section>

      <Section title="13. Contact Us">
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle
          your data, please contact us at:
        </p>
        <address className="not-italic text-gray-600 mt-2 space-y-1">
          <div><strong>DreamArc</strong></div>
          <div>
            Email:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </div>
          <div>Website: <a href="https://llmconclave.com" className="text-blue-600 hover:underline">llmconclave.com</a></div>
        </address>
      </Section>

      <hr className="my-10 border-gray-200" />
      <p className="text-sm text-gray-400 text-center">
        中文说明：本隐私政策适用于 llmconclave.com 的所有用户。开源自部署模式下，您的全部对话数据仅存储于本地浏览器，DreamArc 无法访问。如有疑问，请通过上述邮箱与我们联系。
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
        {title}
      </h2>
      <div className="space-y-3 text-gray-600 leading-relaxed text-[15px]">
        {children}
      </div>
    </section>
  );
}

function ThirdPartyRow({ name, purpose, data }: { name: string; purpose: string; data: string }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-3 py-2 border border-gray-200 font-medium text-gray-700">{name}</td>
      <td className="px-3 py-2 border border-gray-200">{purpose}</td>
      <td className="px-3 py-2 border border-gray-200 text-gray-500">{data}</td>
    </tr>
  );
}
