// Category Filtering

import { CLASSES } from './config.js';

class FilterManager {
    constructor() {
        this.activeCategory = 'all';
        this.stocks = [];
    }

    setStocks(stocks) {
        this.stocks = stocks;
    }

    // Filter stocks by category
    filterByCategory(category) {
        this.activeCategory = category;

        if (category === 'all') {
            return this.stocks;
        }

        return this.stocks.filter(stock => stock.category === category);
    }

    // Get current active category
    getActiveCategory() {
        return this.activeCategory;
    }
}

export const filterManager = new FilterManager();

// Setup category filter buttons
export function setupFilters(containerElement, categories, onFilter) {
    // Create "All" button
    const allButton = createFilterButton('all', 'All', true);
    allButton.addEventListener('click', () => {
        setActiveFilter(allButton);
        const results = filterManager.filterByCategory('all');
        onFilter(results);
    });
    containerElement.appendChild(allButton);

    // Create category buttons
    categories.forEach(category => {
        const button = createFilterButton(category.id, category.name, false);
        button.addEventListener('click', () => {
            setActiveFilter(button);
            const results = filterManager.filterByCategory(category.id);
            onFilter(results);
        });
        containerElement.appendChild(button);
    });
}

function createFilterButton(category, label, active) {
    const button = document.createElement('button');
    button.className = `filter-btn ${active ? CLASSES.active : ''}`;
    button.dataset.category = category;
    button.textContent = label;
    return button;
}

function setActiveFilter(activeButton) {
    const allButtons = activeButton.parentElement.querySelectorAll('.filter-btn');
    allButtons.forEach(btn => btn.classList.remove(CLASSES.active));
    activeButton.classList.add(CLASSES.active);
}
