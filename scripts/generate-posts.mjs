#!/usr/bin/env node
/**
 * generate-posts.mjs
 *
 * Run by GitHub Actions before `vite build`.
 * Reads every .md file in content/posts/, parses frontmatter + body,
 * and writes:
 *   - frontend/public/posts.json   (post index consumed by the React app)
 *   - frontend/public/sitemap.xml  (for search engines)
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'content', 'posts');
const OUT_DIR = join(ROOT, 'frontend', 'public');
const ADMIN_DIR = join(ROOT, 'frontend', 'public', 'admin');

// All URLs/identifiers come from env — change domain = change env var only
const SITE_URL = process.env.SITE_URL;
const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
const GITHUB_REPO = process.env.GITHUB_REPO;

// ---------------------------------------------------------------------------
// Minimal frontmatter parser (no external deps needed)
// ---------------------------------------------------------------------------
function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { data: {}, content: raw };

    const yamlBlock = match[1];
    const content = match[2];
    const data = {};

    for (const line of yamlBlock.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;

        const key = line.slice(0, colonIdx).trim();
        let value = line.slice(colonIdx + 1).trim();

        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        data[key] = value;
    }

    // Parse tags — Decap CMS emits YAML list style:
    // tags:
    //   - ai
    //   - llm
    const tagsMatch = yamlBlock.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);
    if (tagsMatch) {
        data.tags = tagsMatch[1]
            .split('\n')
            .map(l => l.replace(/^\s+-\s+/, '').trim())
            .filter(Boolean);
    } else {
        // Inline list: tags: [ai, llm]
        const inlineTags = yamlBlock.match(/^tags:\s*\[(.+)\]/m);
        if (inlineTags) {
            data.tags = inlineTags[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, ''));
        }
    }

    return { data, content };
}

// ---------------------------------------------------------------------------
// Simple markdown → plain text for description fallback
// ---------------------------------------------------------------------------
function markdownToExcerpt(md, maxLen = 160) {
    return md
        .replace(/^#+\s+/gm, '')       // headings
        .replace(/!\[.*?\]\(.*?\)/g, '') // images
        .replace(/\[(.+?)\]\(.*?\)/g, '$1') // links
        .replace(/[*_`~]/g, '')         // bold/italic/code/strike
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLen);
}

// ---------------------------------------------------------------------------
// Derive a URL-safe slug from the filename
// Filenames are expected to be: YYYY-MM-DD-some-title.md
// ---------------------------------------------------------------------------
function slugFromFilename(filename) {
    return filename.replace(/\.md$/, '');
}

// ---------------------------------------------------------------------------
// Format date for display: "2026-02-20" → "February 20th, 2026"
// ---------------------------------------------------------------------------
function formatDate(dateStr) {
    if (!dateStr) return '';
    // Handle ISO datetime strings from Decap CMS
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const day = d.getUTCDate();
    const suffix = ['th', 'st', 'nd', 'rd'][
        day % 10 <= 3 && Math.floor(day / 10) !== 1 ? day % 10 : 0
    ];
    return `${months[d.getUTCMonth()]} ${day}${suffix}, ${d.getUTCFullYear()}`;
}

// ---------------------------------------------------------------------------
// Generate admin/config.yml from env vars (no hardcoded URLs in source)
// ---------------------------------------------------------------------------
async function generateDecapConfig() {
    if (!existsSync(ADMIN_DIR)) {
        await mkdir(ADMIN_DIR, { recursive: true });
    }

    const yml = `backend:
  name: github
  repo: ${GITHUB_REPO}
  branch: main
  base_url: ${API_URL}
  auth_endpoint: /api/auth

media_folder: content/uploads
public_folder: /content/uploads

site_url: ${SITE_URL}

collections:
  - name: posts
    label: Posts
    label_singular: Post
    folder: content/posts
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    summary: "{{title}} \u2014 {{date}}"
    fields:
      - label: Title
        name: title
        widget: string
        hint: The post title shown on the blog index and post page

      - label: Date
        name: date
        widget: datetime
        date_format: "YYYY-MM-DD"
        time_format: false
        hint: Publication date

      - label: Description
        name: description
        widget: text
        hint: Short blurb shown on the blog index (1-2 sentences)

      - label: Tags
        name: tags
        widget: list
        hint: Comma-separated tags (e.g. ai, llm, transformers)

      - label: Cover Image
        name: image
        widget: image
        required: false
        hint: Optional hero image displayed at the top of the post

      - label: Body
        name: body
        widget: markdown
        hint: Your post content \u2014 bold, headings, links, images, code blocks all supported
`;

    await writeFile(join(ADMIN_DIR, 'config.yml'), yml, 'utf-8');
    console.log(`\u2705 Generated admin/config.yml (repo: ${GITHUB_REPO}, site: ${SITE_URL})`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    // Generate Decap CMS config from env vars
    await generateDecapConfig();

    // Ensure posts output directory exists
    if (!existsSync(OUT_DIR)) {
        await mkdir(OUT_DIR, { recursive: true });
    }

    // Collect all .md files
    let files = [];
    try {
        const all = await readdir(POSTS_DIR);
        files = all.filter(f => f.endsWith('.md'));
    } catch {
        console.log('No content/posts directory found — writing empty posts.json');
    }

    const posts = [];

    for (const filename of files) {
        const raw = await readFile(join(POSTS_DIR, filename), 'utf-8');
        const { data, content } = parseFrontmatter(raw);

        const slug = slugFromFilename(filename);
        const description = data.description || markdownToExcerpt(content);

        posts.push({
            slug,
            title: data.title || slug,
            date: data.date || '',
            displayDate: formatDate(data.date),
            description,
            tags: Array.isArray(data.tags) ? data.tags : [],
            image: data.image || null,
            source: 'Custom',
            // Inline the markdown body so the frontend needs no extra fetch
            body: content.trim(),
        });
    }

    // Sort newest first
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Write posts.json
    const postsJson = JSON.stringify(posts, null, 2);
    await writeFile(join(OUT_DIR, 'posts.json'), postsJson, 'utf-8');
    console.log(`✅ Wrote posts.json with ${posts.length} post(s)`);

    // ---------------------------------------------------------------------------
    // Write sitemap.xml
    // ---------------------------------------------------------------------------
    const staticPages = ['', '#/projects', '#/about'];
    const postUrls = posts.map(p => `${SITE_URL}/#/blog/${p.slug}`);

    const urlEntries = [
        ...staticPages.map(path => `
  <url>
    <loc>${SITE_URL}/${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '' ? '1.0' : '0.8'}</priority>
  </url>`),
        ...postUrls.map(url => `
  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`),
    ].join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    await writeFile(join(OUT_DIR, 'sitemap.xml'), sitemap, 'utf-8');
    console.log(`✅ Wrote sitemap.xml with ${staticPages.length + posts.length} URL(s)`);
}

main().catch(err => {
    console.error('❌ generate-posts failed:', err);
    process.exit(1);
});
