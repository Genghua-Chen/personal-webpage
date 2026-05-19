// Stock Data Loading & Caching

import { CONFIG } from './config.js';
import { Storage } from './utils.js';

class StockLoader {
    constructor() {
        this.manifest = null;
        this.stockCache = new Map();
        this.loadingPromises = new Map();
    }

    // Load manifest file
    async loadManifest() {
        if (this.manifest) return this.manifest;

        // Try cache first
        const cached = Storage.get('manifest');
        if (cached) {
            this.manifest = cached;
            return this.manifest;
        }

        try {
            const response = await fetch(CONFIG.MANIFEST_URL);
            if (!response.ok) throw new Error('Failed to load manifest');

            this.manifest = await response.json();
            Storage.set('manifest', this.manifest, CONFIG.CACHE_DURATION);
            return this.manifest;
        } catch (error) {
            console.error('Error loading manifest:', error);
            throw error;
        }
    }

    // Get all stocks metadata
    async getAllStocks() {
        const manifest = await this.loadManifest();
        return manifest.stocks;
    }

    // Get categories
    async getCategories() {
        const manifest = await this.loadManifest();
        return manifest.categories;
    }

    // Load individual stock markdown file
    async loadStock(stockId) {
        // Return cached if available
        if (this.stockCache.has(stockId)) {
            return this.stockCache.get(stockId);
        }

        // Return existing promise if loading
        if (this.loadingPromises.has(stockId)) {
            return this.loadingPromises.get(stockId);
        }

        const manifest = await this.loadManifest();
        const stockMeta = manifest.stocks.find(s => s.id === stockId);

        if (!stockMeta) {
            throw new Error(`Stock not found: ${stockId}`);
        }

        const loadPromise = (async () => {
            try {
                const response = await fetch(stockMeta.file);
                if (!response.ok) throw new Error('Failed to load stock data');

                const markdown = await response.text();
                const stockData = {
                    ...stockMeta,
                    markdown,
                };

                this.stockCache.set(stockId, stockData);
                this.loadingPromises.delete(stockId);

                return stockData;
            } catch (error) {
                this.loadingPromises.delete(stockId);
                throw error;
            }
        })();

        this.loadingPromises.set(stockId, loadPromise);
        return loadPromise;
    }

    // Preload multiple stocks
    async preloadStocks(stockIds) {
        const promises = stockIds.map(id => this.loadStock(id));
        return Promise.allSettled(promises);
    }

    // Clear cache
    clearCache() {
        this.stockCache.clear();
        this.loadingPromises.clear();
        Storage.remove('manifest');
    }
}

// Singleton instance
export const stockLoader = new StockLoader();
