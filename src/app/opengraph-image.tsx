import { ImageResponse } from 'next/og';

export const alt = 'LLM Conclave — Multi-AI Debate & Decision Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ffffff 0%, #ecfeff 55%, #f5f3ff 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative orbs */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -80,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: 'rgba(34, 211, 238, 0.12)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -140,
            right: -60,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background: 'rgba(168, 85, 247, 0.12)',
            display: 'flex',
          }}
        />

        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: 6,
            textTransform: 'uppercase',
            fontWeight: 700,
            color: '#0891b2',
            border: '2px solid #a5f3fc',
            background: '#ecfeff',
            padding: '12px 32px',
            borderRadius: 9999,
            marginBottom: 44,
          }}
        >
          A Multi-AI Debate &amp; Decision Platform
        </div>

        <div style={{ display: 'flex', fontSize: 92, fontWeight: 800, color: '#111827' }}>
          LLM Conclave
        </div>

        <div style={{ display: 'flex', fontSize: 36, color: '#6b7280', marginTop: 24 }}>
          One topic. Multiple AIs. Real insights.
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 56 }}>
          {['GPT', 'Claude', 'Gemini', 'Grok', 'DeepSeek', 'Qwen'].map((name) => (
            <div
              key={name}
              style={{
                display: 'flex',
                padding: '10px 24px',
                borderRadius: 9999,
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                color: '#4b5563',
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
