# Stock Market Dashboard

A professional, Apple-style stock information webpage built with pure HTML, CSS, and JavaScript. Features a clean, minimalist design with search, filtering, and detailed stock views.

## Features

- **Clean Apple-Style Design**: Minimalist aesthetics with generous white space and subtle shadows
- **Search Functionality**: Real-time search by company name or ticker symbol
- **Category Filters**: Filter stocks by industry (Software, Semiconductors, Medical, Finance, Energy)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Detailed Stock Views**: Click any stock to see comprehensive information in a modal
- **Markdown-Driven**: All stock data stored in easy-to-edit markdown files
- **Fast & Efficient**: Client-side rendering with caching for optimal performance

## Project Structure

```
├── index.html                      # Main entry point
├── assets/
│   ├── css/
│   │   ├── reset.css              # CSS normalization
│   │   ├── variables.css          # Design tokens
│   │   ├── typography.css         # Font system
│   │   ├── layout.css             # Responsive grid
│   │   ├── components.css         # UI components
│   │   └── main.css               # Global styles
│   ├── js/
│   │   ├── config.js              # Configuration
│   │   ├── utils.js               # Utility functions
│   │   ├── markdown-parser.js     # Markdown parsing
│   │   ├── stock-loader.js        # Data loading
│   │   ├── search.js              # Search functionality
│   │   ├── filter.js              # Category filtering
│   │   ├── renderer.js            # DOM rendering
│   │   └── main.js                # Application init
│   └── libs/
│       └── marked.min.js          # Markdown library
├── data/
│   ├── stocks/                     # Stock markdown files
│   │   ├── aapl.md
│   │   ├── msft.md
│   │   └── ...
│   └── manifest.json              # Stock index
└── README.md
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional but recommended)

### Installation

1. Clone or download this repository
2. Open the project folder

### Running the Application

#### Option 1: Using Python's built-in server

```bash
cd "stock_wepage copy"
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

#### Option 2: Using Node.js http-server

```bash
npx http-server -p 8000
```

#### Option 3: Using VS Code Live Server

1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### Option 4: Direct file access (may have CORS issues)

Simply open `index.html` in your browser. Note: Some browsers may block loading local JSON/markdown files for security reasons.

## Adding New Stocks

### 1. Create a markdown file

Create a new file in `data/stocks/` (e.g., `tsla.md`):

```markdown
---
ticker: TSLA
name: Tesla, Inc.
category: software
price: 242.50
change: +5.30
changePercent: +2.23
marketCap: 768.5B
pe: 65.2
dividendYield: 0.00
volume: 115.3M
website: https://www.tesla.com
exchange: NASDAQ
---

# Tesla, Inc.

## Overview
[Company description...]

## Key Highlights
- Bullet points...

## Financials
[Financial data...]
```

### 2. Update manifest.json

Add the stock entry to `data/manifest.json`:

```json
{
  "id": "tsla",
  "ticker": "TSLA",
  "name": "Tesla, Inc.",
  "category": "software",
  "file": "data/stocks/tsla.md",
  "price": "242.50",
  "change": "+5.30",
  "changePercent": "+2.23",
  "marketCap": "768.5B",
  "pe": "65.2",
  "tags": ["automotive", "clean energy", "technology"]
}
```

### 3. Refresh the page

The new stock will appear automatically!

## Customization

### Design Colors

Edit `assets/css/variables.css` to customize colors:

```css
:root {
    --color-primary: #000000;      /* Main text color */
    --color-info: #007aff;         /* Accent color */
    --color-success: #34c759;      /* Positive changes */
    --color-danger: #ff3b30;       /* Negative changes */
    /* ... more variables */
}
```

### Categories

Add new categories in `data/manifest.json`:

```json
"categories": [
    {
        "id": "retail",
        "name": "Retail",
        "icon": "🛍️"
    }
]
```

### Typography

Adjust font sizes in `assets/css/variables.css`:

```css
:root {
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    /* ... */
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Grid, Flexbox
- **JavaScript ES6+**: Modules, async/await, classes
- **Marked.js**: Markdown parsing

## Performance Features

- Lazy loading of stock details
- LocalStorage caching (5-minute TTL)
- Debounced search (300ms)
- Efficient DOM updates
- Mobile-first responsive design

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- WCAG AA contrast ratios
- Screen reader compatible
- Focus management in modals

## License

This project is open source and available for personal and commercial use.

## Credits

Built with modern web technologies and inspired by Apple's design principles.
