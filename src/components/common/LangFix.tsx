export function LangFix({ lang }: { lang: 'zh-CN' | 'ja' }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang='${lang}';`,
      }}
    />
  );
}
