// Markdown Processing

import { parseFrontmatter } from './utils.js';

class MarkdownParser {
    constructor() {
        // Configure marked.js options
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: true,
                mangle: false,
            });
        }
    }

    // Parse markdown with frontmatter
    parse(markdown) {
        const { metadata, content } = parseFrontmatter(markdown);

        // Convert markdown to HTML
        const html = marked.parse(content);

        return {
            metadata,
            html,
            content,
        };
    }

    // Extract specific sections from markdown
    extractSection(html, sectionTitle) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const headings = doc.querySelectorAll('h2');
        for (const heading of headings) {
            if (heading.textContent.trim() === sectionTitle) {
                let content = '';
                let sibling = heading.nextElementSibling;

                while (sibling && sibling.tagName !== 'H2') {
                    content += sibling.outerHTML;
                    sibling = sibling.nextElementSibling;
                }

                return content;
            }
        }

        return null;
    }
}

export const markdownParser = new MarkdownParser();
