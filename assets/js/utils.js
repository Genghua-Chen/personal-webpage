// Utility Functions

// Debounce function for search input
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format price with currency
export function formatPrice(price) {
    const num = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}

// Format market cap (e.g., 2.89T, 150.5B)
export function formatMarketCap(value) {
    // Handle string values like "2.89T"
    if (typeof value === 'string') {
        return value;
    }

    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';

    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toFixed(2);
}

// Format large numbers with commas
export function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

// Parse frontmatter from markdown
export function parseFrontmatter(markdown) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = markdown.match(frontmatterRegex);

    if (!match) {
        return { metadata: {}, content: markdown };
    }

    const [, frontmatter, content] = match;
    const metadata = {};

    frontmatter.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
            const value = valueParts.join(':').trim();
            metadata[key.trim()] = value;
        }
    });

    return { metadata, content };
}

// Sanitize HTML to prevent XSS
export function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

// Get logo URL (with fallback)
export function getLogoUrl(ticker, logoUrl) {
    if (logoUrl && logoUrl !== '') return logoUrl;
    return `https://logo.clearbit.com/${ticker.toLowerCase()}.com`;
}

// Scroll to top smoothly
export function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Local storage with expiration
export class Storage {
    static set(key, value, expirationMs = null) {
        const item = {
            value,
            expiration: expirationMs ? Date.now() + expirationMs : null,
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    static get(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;

        try {
            const item = JSON.parse(itemStr);
            if (item.expiration && Date.now() > item.expiration) {
                localStorage.removeItem(key);
                return null;
            }

            return item.value;
        } catch (e) {
            return null;
        }
    }

    static remove(key) {
        localStorage.removeItem(key);
    }
}
