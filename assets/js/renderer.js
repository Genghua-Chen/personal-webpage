// DOM Rendering

import { CLASSES, SELECTORS } from './config.js';
import { formatPrice, formatMarketCap } from './utils.js';
import { stockLoader } from './stock-loader.js';
import { markdownParser } from './markdown-parser.js';

class Renderer {
    constructor() {
        this.gridElement = null;
        this.modalElement = null;
        this.modalBodyElement = null;
    }

    init() {
        this.gridElement = document.querySelector(SELECTORS.stockGrid);
        this.modalElement = document.querySelector(SELECTORS.modal);
        this.modalBodyElement = document.querySelector(SELECTORS.modalBody);
        this.setupModalHandlers();
    }

    // Render stock cards to grid
    renderStocks(stocks) {
        console.log('📦 Rendering', stocks.length, 'stocks');
        this.gridElement.innerHTML = '';

        if (stocks.length === 0) {
            console.log('⚠️ No stocks to display - showing empty state');
            this.showEmptyState();
            this.gridElement.classList.add(CLASSES.hidden);
            return;
        }

        this.hideEmptyState();
        this.gridElement.classList.remove(CLASSES.hidden);

        stocks.forEach(stock => {
            const card = this.createStockCard(stock);
            this.gridElement.appendChild(card);
        });
        console.log('✅ Rendered', stocks.length, 'stock cards');
    }

    // Create stock card element
    createStockCard(stock) {
        const card = document.createElement('article');
        card.className = 'stock-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `View details for ${stock.name}`);

        // Parse basic metadata from manifest
        const price = parseFloat(stock.price || 0);
        const change = parseFloat(stock.change || 0);
        const changePercent = parseFloat(stock.changePercent || 0);

        card.innerHTML = `
            <div class="stock-card__header">
                <div class="stock-card__logo">
                    ${stock.logo ? `<img src="${stock.logo}" alt="${stock.name}" onerror="this.style.display='none'; this.parentElement.textContent='${stock.ticker.substring(0, 2)}';">` : stock.ticker.substring(0, 2)}
                </div>
                <div class="stock-card__price">
                    <div class="stock-card__price-value">${formatPrice(price)}</div>
                    <div class="stock-card__change ${change >= 0 ? CLASSES.positive : CLASSES.negative}">
                        <span>${change >= 0 ? '▲' : '▼'}</span>
                        <span>${Math.abs(changePercent).toFixed(2)}%</span>
                    </div>
                </div>
            </div>
            <div class="stock-card__body">
                <div class="stock-card__ticker">${stock.ticker}</div>
                <h2 class="stock-card__name">${stock.name}</h2>
                <span class="stock-card__category">${stock.category}</span>
            </div>
            <div class="stock-card__footer">
                <div class="stock-card__stat">
                    <span class="stock-card__stat-label">Market Cap</span>
                    <span class="stock-card__stat-value">${formatMarketCap(stock.marketCap || 0)}</span>
                </div>
                <div class="stock-card__stat">
                    <span class="stock-card__stat-label">P/E Ratio</span>
                    <span class="stock-card__stat-value">${stock.pe || 'N/A'}</span>
                </div>
            </div>
        `;

        // Add click handler to open modal
        card.addEventListener('click', () => this.showStockDetail(stock.id));
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.showStockDetail(stock.id);
            }
        });

        return card;
    }

    // Show stock detail modal
    async showStockDetail(stockId) {
        try {
            this.showLoadingModal();
            this.modalElement.classList.remove(CLASSES.hidden);
            document.body.style.overflow = 'hidden';

            const stockData = await stockLoader.loadStock(stockId);
            const { metadata, html } = markdownParser.parse(stockData.markdown);

            this.renderStockDetail(metadata, html);
        } catch (error) {
            console.error('Error loading stock detail:', error);
            this.showErrorModal();
        }
    }

    // Render stock detail content
    renderStockDetail(metadata, html) {
        const price = parseFloat(metadata.price || 0);
        const change = parseFloat(metadata.change || 0);
        const changePercent = parseFloat(metadata.changePercent || 0);

        this.modalBodyElement.innerHTML = `
            <div class="stock-detail">
                <div class="stock-detail__header">
                    <div class="stock-detail__title">
                        <h1 class="stock-detail__ticker">${metadata.ticker}</h1>
                        <p class="stock-detail__exchange">${metadata.exchange || 'N/A'}</p>
                    </div>
                    <div class="stock-detail__price">
                        <div class="stock-detail__price-value">${formatPrice(price)}</div>
                        <div class="stock-card__change ${change >= 0 ? CLASSES.positive : CLASSES.negative}">
                            <span>${change >= 0 ? '▲' : '▼'}</span>
                            <span>${change >= 0 ? '+' : ''}${change} (${changePercent >= 0 ? '+' : ''}${changePercent}%)</span>
                        </div>
                    </div>
                </div>

                <div class="stock-detail__stats">
                    <div class="stock-stat">
                        <span class="stock-stat__label">Market Cap</span>
                        <span class="stock-stat__value">${formatMarketCap(metadata.marketCap || 0)}</span>
                    </div>
                    <div class="stock-stat">
                        <span class="stock-stat__label">P/E Ratio</span>
                        <span class="stock-stat__value">${metadata.pe || 'N/A'}</span>
                    </div>
                    <div class="stock-stat">
                        <span class="stock-stat__label">Div Yield</span>
                        <span class="stock-stat__value">${metadata.dividendYield || 'N/A'}%</span>
                    </div>
                    <div class="stock-stat">
                        <span class="stock-stat__label">Volume</span>
                        <span class="stock-stat__value">${metadata.volume || 'N/A'}</span>
                    </div>
                </div>

                <div class="stock-detail__content">
                    ${html}
                </div>

                ${metadata.website ? `
                    <div class="stock-detail__actions">
                        <a href="${metadata.website}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                            Visit Website
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Modal state management
    showLoadingModal() {
        this.modalBodyElement.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading stock details...</p>
            </div>
        `;
    }

    showErrorModal() {
        this.modalBodyElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">⚠️</div>
                <h2 class="empty-state__title">Error Loading Stock</h2>
                <p class="empty-state__message">Please try again later</p>
            </div>
        `;
    }

    closeModal() {
        this.modalElement.classList.add(CLASSES.hidden);
        document.body.style.overflow = '';
    }

    setupModalHandlers() {
        const closeButton = document.querySelector(SELECTORS.modalClose);
        const overlay = document.querySelector(SELECTORS.modalOverlay);

        closeButton.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', () => this.closeModal());

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modalElement.classList.contains(CLASSES.hidden)) {
                this.closeModal();
            }
        });
    }

    // Loading/empty state management
    showLoading() {
        document.querySelector(SELECTORS.loadingState).classList.remove(CLASSES.hidden);
        this.gridElement.classList.add(CLASSES.hidden);
    }

    hideLoading() {
        document.querySelector(SELECTORS.loadingState).classList.add(CLASSES.hidden);
        this.gridElement.classList.remove(CLASSES.hidden);
    }

    showEmptyState() {
        document.querySelector(SELECTORS.emptyState).classList.remove(CLASSES.hidden);
    }

    hideEmptyState() {
        document.querySelector(SELECTORS.emptyState).classList.add(CLASSES.hidden);
    }
}

export const renderer = new Renderer();
