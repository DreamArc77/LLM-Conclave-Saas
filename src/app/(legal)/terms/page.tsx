import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — LLM Conclave',
  description: 'Terms of Service for LLM Conclave, the multi-model AI collaboration platform.',
};

const EFFECTIVE_DATE = 'March 31, 2025';
const CONTACT_EMAIL = 'support@llmconclave.com';

export default function TermsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-10">Effective date: {EFFECTIVE_DATE}</p>

      <Section title="1. About LLM Conclave">
        <p>
          LLM Conclave (&quot;the Service&quot;) is a multi-model AI collaboration platform operated by DreamArc
          (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). The Service lets users pose questions or topics to multiple large language
          models (LLMs) simultaneously and receive streamed, structured AI responses, voting outcomes, and
          exportable research reports.
        </p>
        <p>
          The Service is available in two modes:
        </p>
        <ul>
          <li>
            <strong>Open-Source / BYOK mode</strong> — self-hosted or run locally; no account required.
            Users supply their own API keys for AI providers.
          </li>
          <li>
            <strong>SaaS mode</strong> (llmconclave.com) — hosted service with account registration,
            preset AI models powered by DreamArc&apos;s infrastructure, and a credit-based billing system.
          </li>
        </ul>
      </Section>

      <Section title="2. Acceptance of Terms">
        <p>
          By accessing or using LLM Conclave in any mode, you agree to be bound by these Terms. If you do
          not agree to these Terms, you must not use the Service.
        </p>
        <p>
          We reserve the right to update these Terms at any time. We will notify registered users of
          material changes via email or an in-app notice. Continued use after the effective date of any
          update constitutes acceptance.
        </p>
      </Section>

      <Section title="3. Eligibility">
        <p>
          You must be at least 13 years of age to use the Service. If you are under 18, you must have
          permission from a parent or legal guardian. By using the Service, you represent that you meet
          these requirements.
        </p>
      </Section>

      <Section title="4. Accounts and Registration (SaaS Mode)">
        <p>
          To access SaaS features, you must create an account using a valid email address or a supported
          OAuth provider (e.g., Google). You are responsible for:
        </p>
        <ul>
          <li>Maintaining the confidentiality of your account credentials.</li>
          <li>All activity that occurs under your account.</li>
          <li>Notifying us immediately at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> of any
          unauthorized use.</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms.
        </p>
      </Section>

      <Section title="5. Bring Your Own Key (BYOK)">
        <p>
          When you provide API keys from third-party AI providers (e.g., OpenAI, Anthropic, Google), you
          acknowledge that:
        </p>
        <ul>
          <li>You are solely responsible for complying with each provider&apos;s terms of service.</li>
          <li>Your API keys are transmitted securely and are not stored on our servers beyond the
          duration of a single request session.</li>
          <li>You bear any costs billed by your AI providers for usage attributed to your keys.</li>
        </ul>
      </Section>

      <Section title="6. Credits and Billing (SaaS Mode)">
        <p>
          SaaS users may purchase credits to use preset AI models managed by DreamArc. By purchasing
          credits, you agree that:
        </p>
        <ul>
          <li>
            <strong>Credits are non-refundable</strong> once consumed. Unused credits may be refunded
            within 14 days of purchase, subject to review, by contacting{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </li>
          <li>Credit prices and model costs may change with at least 7 days&apos; advance notice to registered users.</li>
          <li>Payments are processed by Stripe. We do not store your payment card information.</li>
          <li>Credits have no cash value and are not transferable between accounts.</li>
        </ul>
      </Section>

      <Section title="7. Acceptable Use">
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Generate, distribute, or promote illegal, harmful, abusive, or discriminatory content.</li>
          <li>Violate any applicable law or regulation, including those related to data privacy,
          intellectual property, or export control.</li>
          <li>Attempt to circumvent rate limits, access controls, or security measures.</li>
          <li>Scrape, reverse-engineer, or reproduce the Service&apos;s infrastructure or proprietary data.</li>
          <li>Use the Service for any purpose that violates the terms of the underlying AI model providers
          (OpenAI, Anthropic, Google, OpenRouter, etc.).</li>
          <li>Impersonate any person or organization, or misrepresent your affiliation with any entity.</li>
        </ul>
      </Section>

      <Section title="8. AI-Generated Content Disclaimer">
        <p>
          All responses produced by the Service are generated by third-party AI models and are provided
          for informational purposes only. They do not constitute legal, financial, medical, psychological,
          or any other form of professional advice. We make no warranty as to the accuracy, completeness,
          or fitness of AI-generated content for any particular purpose.
        </p>
        <p>
          You use AI-generated content at your own risk. DreamArc is not responsible for any decisions
          made in reliance on AI outputs.
        </p>
      </Section>

      <Section title="9. Intellectual Property">
        <p>
          The LLM Conclave platform, its code (to the extent not covered by the MIT open-source license),
          design, trademarks, and branding are the property of DreamArc. The open-source portion is
          licensed under the MIT License as published in the project repository.
        </p>
        <p>
          You retain ownership of any content you input into the Service. By submitting content, you grant
          DreamArc a limited, non-exclusive, royalty-free license to process and transmit that content
          solely to provide the Service.
        </p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, DreamArc and its affiliates, officers,
          directors, employees, and agents shall not be liable for:
        </p>
        <ul>
          <li>Any indirect, incidental, special, consequential, or punitive damages.</li>
          <li>Loss of data, profits, revenue, or goodwill.</li>
          <li>Downtime, service interruptions, or errors in AI model outputs.</li>
        </ul>
        <p>
          Our total aggregate liability to you shall not exceed the greater of (a) the total credits
          purchased by you in the 3 months preceding the claim, or (b) USD $10.
        </p>
      </Section>

      <Section title="11. Disclaimer of Warranties">
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
          express or implied, including but not limited to warranties of merchantability, fitness for a
          particular purpose, or non-infringement.
        </p>
      </Section>

      <Section title="12. Termination">
        <p>
          We may suspend or terminate your access to the Service at any time, with or without cause, with
          or without notice, including for any violation of these Terms. Upon termination, your right to
          use the Service ceases immediately. Sections 8–13 survive termination.
        </p>
      </Section>

      <Section title="13. Governing Law and Dispute Resolution">
        <p>
          These Terms are governed by and construed in accordance with the laws of the Hong Kong Special
          Administrative Region, without regard to its conflict of law principles. Any dispute arising
          from these Terms or use of the Service shall be submitted to the exclusive jurisdiction of the
          courts of Hong Kong SAR.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          For questions about these Terms, please contact us at:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>
        </p>
      </Section>

      <hr className="my-10 border-gray-200" />
      <p className="text-sm text-gray-400 text-center">
        中文说明：本服务条款受中华人民共和国香港特别行政区法律管辖。如有问题，请通过上述联系方式与我们沟通。
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
