/**
 * Fetch utility for custom blog posts.
 * Posts are served from /posts.json — compiled at build time by generate-posts.mjs.
 * Uses import.meta.env.BASE_URL so paths resolve correctly:
 *   - locally:        /posts.json       (base = '/')
 *   - GitHub Pages:   /Profile/posts.json  (base = '/Profile/')
 */

let cachedPosts = null;

/**
 * Fetch all custom posts. Result is cached for the page session.
 * @returns {Promise<Array>}
 */
export async function fetchPosts() {
  if (cachedPosts) return cachedPosts;
  const url = `${import.meta.env.BASE_URL}posts.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load posts.json (${res.status})`);
  cachedPosts = await res.json();
  return cachedPosts;
}

/**
 * Find a single post by slug.
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getPost(slug) {
  const posts = await fetchPosts();
  return posts.find(p => p.slug === slug) ?? null;
}
