// Load products from backend
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:8080/api/products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Failed to load products:', error);
        document.getElementById('main-content').innerHTML = `
            <div class="error">
                <h2>Failed to load products</h2>
                <p>Please try again later</p>
            </div>
        `;
    }
}

// Display products on page
function displayProducts(products) {
    const container = document.getElementById('main-content');
    container.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.id = 'product-grid';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image" style="background-color: #ddd;"></div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>$${product.price.toFixed(2)}</p>
                <button class="add-to-cart">Add to Cart</button>
            </div>
        `;
        grid.appendChild(card);
    });
    
    container.appendChild(grid);
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('main-content')) {
        loadProducts();
    }
});