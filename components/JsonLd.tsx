// Structured data (JSON-LD) for search engine rich results.
// Usage: <JsonLd data={schema} /> inside any Server Component.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
