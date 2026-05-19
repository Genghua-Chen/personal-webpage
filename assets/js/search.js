// Search Functionality

import { CONFIG } from './config.js';
import { debounce } from './utils.js';

class SearchEngine {
    constructor() {
        this.stocks = [];
        this.searchIndex = [];
    }

    // Initialize search index
    setStocks(stocks) {
        this.stocks = stocks;
        this.buildSearchIndex();
    }

    // Build search index for fast lookups
    buildSearchIndex() {
        this.searchIndex = this.stocks.map(stock => ({
            id: stock.id,
            searchText: [
                stock.ticker,
                stock.name,
                ...(stock.tags || []),
            ].join(' ').toLowerCase(),
        }));
    }

    // Search stocks by query
    search(query) {
        if (!query || query.trim() === '') {
            return this.stocks;
        }

        const searchTerms = query.toLowerCase().split(/\s+/);

        const results = this.searchIndex
            .map(item => {
                let score = 0;

                searchTerms.forEach(term => {
                    if (item.searchText.includes(term)) {
                        // Boost exact matches
                        if (item.searchText.startsWith(term)) {
                            score += 10;
                        } else {
                            score += 1;
                        }
                    }
                });

                return { id: item.id, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, CONFIG.MAX_SEARCH_RESULTS)
            .map(item => this.stocks.find(s => s.id === item.id));

        return results;
    }
}

export const searchEngine = new SearchEngine();

// Setup search input handler
export function setupSearch(inputElement, onSearch) {
    console.log('🔍 Search setup on element:', inputElement);

    const debouncedSearch = debounce((query) => {
        console.log('🔎 Searching for:', query);
        const results = searchEngine.search(query);
        console.log('📊 Search results:', results.length, 'stocks found');
        onSearch(results);
    }, CONFIG.DEBOUNCE_DELAY);

    inputElement.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
}
