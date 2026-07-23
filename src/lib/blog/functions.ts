import { createServerFn } from '@tanstack/react-start'

import { getBlogPosts } from '#/lib/blog/posts.server'

export const getBlogPostsFn = createServerFn({ method: 'GET' }).handler(() =>
  getBlogPosts(),
)
