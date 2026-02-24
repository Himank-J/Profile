import { Helmet } from 'react-helmet-async';
import config from '../config';

/**
 * Reusable SEO component.
 * Drop <SEO ... /> into any page to set title, description, OG, Twitter tags,
 * and canonical URL. Switching to a custom domain = update VITE_SITE_URL only.
 *
 * @param {string}  title        - Page/post title
 * @param {string}  description  - Meta description (keep under 160 chars)
 * @param {string}  image        - Absolute URL to OG image (optional)
 * @param {string}  path         - Relative path, e.g. "/blog/my-post" (optional)
 * @param {string}  type         - OG type: "website" | "article" (default: "website")
 * @param {string}  publishedAt  - ISO date string for articles (optional)
 */
function SEO({ title, description, image, path = '', type = 'website', publishedAt }) {
    const siteUrl = config.SITE_URL;
    const fullTitle = title ? `${title} · Himank Jain` : 'Himank Jain';
    const canonicalUrl = `${siteUrl}${path ? `/#${path}` : ''}`;
    const ogImage = image || `${siteUrl}/og-default.png`;

    return (
        <Helmet>
            {/* Basic */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content={type} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content="Himank Jain" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Article-specific */}
            {type === 'article' && publishedAt && (
                <meta property="article:published_time" content={publishedAt} />
            )}
            {type === 'article' && (
                <meta property="article:author" content="Himank Jain" />
            )}
        </Helmet>
    );
}

export default SEO;
