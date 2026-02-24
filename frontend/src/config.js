// Central app config — all env-specific values go here.
// Change domain? Update VITE_SITE_URL in .env.local and GitHub Secrets.
const config = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    SITE_URL: import.meta.env.VITE_SITE_URL,
    GITHUB_REPO: import.meta.env.VITE_GITHUB_REPO,
};

export default config;
