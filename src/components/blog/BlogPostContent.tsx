export function BlogPostContent({ body }: { body: string }) {
  return <div dangerouslySetInnerHTML={{ __html: body }} />
}
