// Configuration constants
export const CONFIG = {
    MANIFEST_URL: './data/manifest.json',
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 250,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_SEARCH_RESULTS: 50,
    LAZY_LOAD_THRESHOLD: 20,
};

export const SELECTORS = {
    searchInput: '#search-input',
    categoryFilters: '#category-filters',
    stockGrid: '#stock-grid',
    loadingState: '#loading-state',
    emptyState: '#empty-state',
    modal: '#stock-modal',
    modalBody: '#modal-body',
    modalClose: '#modal-close',
    modalOverlay: '#modal-overlay',
};

export const CLASSES = {
    active: 'active',
    hidden: 'hidden',
    positive: 'stock-card__change--positive',
    negative: 'stock-card__change--negative',
};
