// Application Entry Point

import { SELECTORS } from './config.js';
import { stockLoader } from './stock-loader.js';
import { searchEngine, setupSearch } from './search.js';
import { filterManager, setupFilters } from './filter.js';
import { renderer } from './renderer.js';

class App {
    constructor() {
        this.allStocks = [];
        this.displayedStocks = [];
    }

    async init() {
        try {
            console.log('🚀 App initializing...');

            // Initialize renderer first
            renderer.init();
            console.log('✅ Renderer initialized');

            // Show loading state
            renderer.showLoading();

            // Load manifest and stock data
            await this.loadData();
            console.log('✅ Data loaded:', this.allStocks.length, 'stocks');

            // Setup UI components
            this.setupUI();
            console.log('✅ UI setup complete');

            // Initial render
            this.displayedStocks = this.allStocks;
            renderer.renderStocks(this.displayedStocks);
            console.log('✅ Initial render complete');

            // Hide loading state
            renderer.hideLoading();
            console.log('✅ App ready!');
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            renderer.hideLoading();
            this.showError();
        }
    }

    async loadData() {
        // Load manifest
        const [stocks, categories] = await Promise.all([
            stockLoader.getAllStocks(),
            stockLoader.getCategories(),
        ]);

        this.allStocks = stocks;
        this.categories = categories;

        // Initialize search and filter
        searchEngine.setStocks(stocks);
        filterManager.setStocks(stocks);
    }

    setupUI() {
        // Setup search
        const searchInput = document.querySelector(SELECTORS.searchInput);
        setupSearch(searchInput, (results) => {
            this.displayedStocks = results;
            renderer.renderStocks(this.displayedStocks);
        });

        // Setup filters
        const filtersContainer = document.querySelector(SELECTORS.categoryFilters);
        setupFilters(filtersContainer, this.categories, (results) => {
            // Apply search if there's a query
            const searchQuery = searchInput.value;
            if (searchQuery) {
                searchEngine.setStocks(results);
                this.displayedStocks = searchEngine.search(searchQuery);
            } else {
                this.displayedStocks = results;
            }
            renderer.renderStocks(this.displayedStocks);
        });
    }

    showError() {
        const grid = document.querySelector(SELECTORS.stockGrid);
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">⚠️</div>
                <h2 class="empty-state__title">Error Loading Data</h2>
                <p class="empty-state__message">Please refresh the page to try again</p>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}
