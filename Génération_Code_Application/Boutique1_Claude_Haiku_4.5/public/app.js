// === GLOBAL STATE ===
let currentUser = null;
let token = null;
let pendingCheckoutData = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
        token = savedToken;
        getCurrentUser();
    }
    loadProducts();
});

// === API HELPER FUNCTIONS ===
const API_URL = 'http://localhost:3000/api';

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(API_URL + endpoint, options);
        if (response.status === 401) {
            logout();
            throw new Error('Session expirée');
        }
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur serveur');
        }
        return await response.json();
    } catch (error) {
        showAlert('error', error.message);
        throw error;
    }
}

// === UI FUNCTIONS ===
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    document.querySelector('.content').prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

function setContent(html) {
    document.querySelector('.content').innerHTML = html;
}

function updateAuthUI() {
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');
    const adminLink = document.getElementById('adminLink');

    if (currentUser) {
        logoutBtn.style.display = 'block';
        loginBtn.style.display = 'none';
        if (currentUser.role === 'admin') {
            adminLink.style.display = 'block';
        }
    } else {
        logoutBtn.style.display = 'none';
        loginBtn.style.display = 'block';
        adminLink.style.display = 'none';
    }
}

// === AUTHENTICATION ===
async function getCurrentUser() {
    try {
        const users = await apiCall('/produits');
        updateAuthUI();
    } catch (error) {
        logout();
    }
}

function loadLogin() {
    const html = `
        <div class="auth-container">
            <div class="form-title">Connexion</div>
            <form onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="loginEmail" required>
                </div>
                <div class="form-group">
                    <label>Mot de passe</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Connexion</button>
            </form>
            <div class="auth-toggle">
                Pas de compte? <a onclick="loadRegister()">S'inscrire</a>
            </div>
        </div>
    `;
    setContent(html);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await apiCall('/auth/login', 'POST', { email, password });
        token = response.token;
        currentUser = response.user;
        localStorage.setItem('token', token);
        updateAuthUI();
        showAlert('success', `Bienvenue ${currentUser.prenom}!`);
        loadProducts();
    } catch (error) {
        // Error already shown by apiCall
    }
}

function loadRegister() {
    const html = `
        <div class="auth-container">
            <div class="form-title">S'inscrire</div>
            <form onsubmit="handleRegister(event)">
                <div class="form-group">
                    <label>Prénom</label>
                    <input type="text" id="regPrenom" required>
                </div>
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" id="regNom" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="regEmail" required>
                </div>
                <div class="form-group">
                    <label>Mot de passe</label>
                    <input type="password" id="regPassword" required>
                </div>
                <button type="submit" class="btn btn-primary btn-block">S'inscrire</button>
            </form>
            <div class="auth-toggle">
                Déjà inscrit? <a onclick="loadLogin()">Se connecter</a>
            </div>
        </div>
    `;
    setContent(html);
}

async function handleRegister(e) {
    e.preventDefault();
    const nom = document.getElementById('regNom').value;
    const prenom = document.getElementById('regPrenom').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        await apiCall('/auth/register', 'POST', { email, password, nom, prenom });
        showAlert('success', 'Inscription réussie! Connectez-vous maintenant.');
        loadLogin();
    } catch (error) {
        // Error already shown
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    updateAuthUI();
    showAlert('success', 'Déconnecté!');
    loadProducts();
}

// === PRODUCTS ===
async function loadProducts() {
    setContent('<div class="loading">Chargement des produits</div>');

    try {
        const products = await apiCall('/produits');
        
        let html = `
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Rechercher un produit..." onkeyup="filterProducts()">
            </div>
            <div class="products-grid" id="productsGrid">
        `;

        if (products.length === 0) {
            html += `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">Aucun produit disponible</div>
                </div>
            `;
        } else {
            products.forEach(product => {
                html += `
                    <div class="product-card">
                        <img src="${product.image_url || 'https://via.placeholder.com/250x200?text=Produit'}" 
                             alt="${product.nom}" class="product-image" onerror="this.src='https://via.placeholder.com/250x200?text=${product.nom}'">
                        <div class="product-info">
                            <div class="product-name">${product.nom}</div>
                            <div class="product-price">${product.prix.toFixed(2)}€</div>
                            <div class="product-stock ${product.stock <= 0 ? 'out' : ''}">
                                Stock: ${product.stock > 0 ? product.stock + ' unités' : 'Rupture'}
                            </div>
                            <button class="btn btn-primary btn-small" onclick="viewProduct('${product.id}')" style="width:48%; margin-right:2%;">Détails</button>
                            <button class="btn btn-success btn-small" onclick="addToCart('${product.id}')" style="width:48%;" ${product.stock <= 0 ? 'disabled' : ''}>Ajouter</button>
                        </div>
                    </div>
                `;
            });
        }

        html += '</div>';
        setContent(html);
    } catch (error) {
        // Error handled
    }
}

async function viewProduct(productId) {
    try {
        const product = await apiCall(`/produits/${productId}`);
        
        let html = `
            <div class="card">
                <button class="btn btn-secondary btn-small" onclick="loadProducts()">← Retour</button>
                <div style="display: grid; grid-template-columns: 300px 1fr; gap: 2rem; margin-top: 1rem;">
                    <div>
                        <img src="${product.image_url || 'https://via.placeholder.com/300'}" 
                             alt="${product.nom}" style="width:100%; border-radius: 8px;"
                             onerror="this.src='https://via.placeholder.com/300?text=${product.nom}'">
                    </div>
                    <div>
                        <h1>${product.nom}</h1>
                        <p style="color: #7f8c8d; margin: 1rem 0;">${product.description}</p>
                        <div style="font-size: 2rem; color: var(--primary-color); font-weight: bold; margin: 1rem 0;">
                            ${product.prix.toFixed(2)}€
                        </div>
                        <div style="margin: 1rem 0; padding: 1rem; background: #f9f9f9; border-radius: 8px;">
                            <strong>Catégorie:</strong> ${product.categorie}<br>
                            <strong>Stock:</strong> ${product.stock} unités
                        </div>
                        ${currentUser ? `
                            <div class="form-group">
                                <label>Quantité</label>
                                <input type="number" id="quantityInput" value="1" min="1" max="${product.stock}">
                            </div>
                            <button class="btn btn-success btn-block" onclick="addToCartWithQuantity('${product.id}')">
                                🛒 Ajouter au panier
                            </button>
                        ` : `
                            <button class="btn btn-primary btn-block" onclick="loadLogin()">Se connecter pour acheter</button>
                        `}
                    </div>
                </div>
                
                <div style="margin-top: 3rem;">
                    <h2>Avis clients</h2>
                    <div id="reviewsSection">
        `;

        if (product.avis && product.avis.length > 0) {
            product.avis.forEach(avis => {
                html += `
                    <div style="background: #f9f9f9; padding: 1rem; margin: 1rem 0; border-radius: 8px;">
                        <strong>${avis.prenom} ${avis.nom}</strong> - ${'⭐'.repeat(avis.note)}
                        <p>${avis.commentaire}</p>
                    </div>
                `;
            });
        } else {
            html += '<p>Aucun avis pour ce produit.</p>';
        }

        html += `
                    </div>
                    ${currentUser ? `
                        <div style="margin-top: 1.5rem; background: white; padding: 1.5rem; border-radius: 8px;">
                            <h3>Laisser un avis</h3>
                            <form onsubmit="submitReview(event, '${productId}')">
                                <div class="form-group">
                                    <label>Note (1-5)</label>
                                    <select id="reviewNote" required>
                                        <option value="1">⭐ 1 - Mauvais</option>
                                        <option value="2">⭐⭐ 2 - Moyen</option>
                                        <option value="3">⭐⭐⭐ 3 - Bien</option>
                                        <option value="4">⭐⭐⭐⭐ 4 - Très bien</option>
                                        <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Commentaire</label>
                                    <textarea id="reviewComment" placeholder="Partagez votre expérience..."></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block">Envoyer l'avis</button>
                            </form>
                        </div>
                    ` : `<p><a onclick="loadLogin()">Connectez-vous</a> pour laisser un avis</p>`}
                </div>
            </div>
        `;

        setContent(html);
    } catch (error) {
        // Error handled
    }
}

async function submitReview(e, productId) {
    e.preventDefault();
    const note = parseInt(document.getElementById('reviewNote').value);
    const commentaire = document.getElementById('reviewComment').value;

    try {
        await apiCall('/avis', 'POST', { produit_id: productId, note, commentaire });
        showAlert('success', 'Avis ajouté avec succès!');
        viewProduct(productId);
    } catch (error) {
        // Error handled
    }
}

function filterProducts() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const name = card.querySelector('.product-name').textContent.toLowerCase();
        if (name.includes(search)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

async function addToCart(productId) {
    if (!currentUser) {
        loadLogin();
        return;
    }

    try {
        await apiCall('/panier', 'POST', { produit_id: productId, quantite: 1 });
        showAlert('success', 'Produit ajouté au panier!');
    } catch (error) {
        // Error handled
    }
}

async function addToCartWithQuantity(productId) {
    const quantity = parseInt(document.getElementById('quantityInput').value);
    try {
        await apiCall('/panier', 'POST', { produit_id: productId, quantite: quantity });
        showAlert('success', 'Produit ajouté au panier!');
        loadCart();
    } catch (error) {
        // Error handled
    }
}

// === CART ===
async function loadCart() {
    if (!currentUser) {
        loadLogin();
        return;
    }

    setContent('<div class="loading">Chargement du panier</div>');

    try {
        const cartItems = await apiCall('/panier');
        
        let html = '<button class="btn btn-secondary btn-small" onclick="loadProducts()">← Retour</button>';
        let total = 0;

        if (cartItems.length === 0) {
            html += `
                <div class="empty-state">
                    <div class="empty-state-icon">🛒</div>
                    <div class="empty-state-text">Votre panier est vide</div>
                    <button class="btn btn-primary" onclick="loadProducts()">Continuer les achats</button>
                </div>
            `;
        } else {
            html += '<h1 style="margin-top: 2rem;">🛒 Panier</h1>';

            cartItems.forEach(item => {
                const itemTotal = item.prix * item.quantite;
                total += itemTotal;
                html += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.nom}</div>
                            <div class="cart-item-price">${item.prix.toFixed(2)}€ x ${item.quantite} = ${itemTotal.toFixed(2)}€</div>
                        </div>
                        <button class="btn btn-danger btn-small" onclick="removeFromCart('${item.panier_id}')">
                            ✕ Supprimer
                        </button>
                    </div>
                `;
            });

            html += `
                <div class="cart-total">
                    <div class="total-amount">Total: ${total.toFixed(2)}€</div>
                </div>
                <form onsubmit="checkout(event)">
                    <div class="form-group" style="margin-top: 2rem;">
                        <label>Adresse de livraison</label>
                        <textarea id="adresseLivraison" placeholder="Entrez votre adresse..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-success btn-block">💳 Procéder au paiement</button>
                </form>
            `;
        }

        setContent(html);
    } catch (error) {
        // Error handled
    }
}

async function removeFromCart(cartItemId) {
    try {
        await apiCall(`/panier/${cartItemId}`, 'DELETE');
        showAlert('success', 'Produit supprimé du panier!');
        loadCart();
    } catch (error) {
        // Error handled
    }
}

async function checkout(e) {
    e.preventDefault();
    const adresse_livraison = document.getElementById('adresseLivraison').value;
    pendingCheckoutData = { adresse_livraison };
    showPaymentPage();
}

function showPaymentPage() {
    const html = `
        <div class="card" style="max-width: 500px; margin: 2rem auto;">
            <button class="btn btn-secondary btn-small" onclick="loadCart()">← Retour au panier</button>
            <h2 style="margin-top: 1rem; text-align: center;">💳 Paiement</h2>
            
            <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Adresse de livraison:</span>
                    <strong>${pendingCheckoutData.adresse_livraison}</strong>
                </div>
            </div>

            <form onsubmit="processPayment(event)" style="margin-top: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h3 style="color: var(--primary-color);">Informations de paiement</h3>
                    <p style="color: #7f8c8d; font-size: 0.9rem;">Ceci est une démonstration. Utilisez des données fictives.</p>
                </div>

                <div class="form-group">
                    <label>Numéro de carte</label>
                    <input type="text" id="cardNumber" placeholder="4532 1234 5678 9010" maxlength="19" required
                           onkeyup="this.value = this.value.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || this.value.replace(/\s/g, '')">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Date d'expiration</label>
                        <input type="text" id="cardExpiry" placeholder="MM/YY" maxlength="5" required
                               onkeyup="if(this.value.length === 2 && !this.value.includes('/')) this.value += '/'">
                    </div>
                    <div class="form-group">
                        <label>CVV</label>
                        <input type="text" id="cardCVV" placeholder="123" maxlength="3" inputmode="numeric" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>Nom du titulaire</label>
                    <input type="text" id="cardName" placeholder="Jean Dupont" required>
                </div>

                <button type="submit" class="btn btn-success btn-block" style="margin-top: 2rem;">
                    💰 Payer maintenant
                </button>
            </form>
        </div>
    `;
    setContent(html);
}

async function processPayment(e) {
    e.preventDefault();
    
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVV = document.getElementById('cardCVV').value;
    const cardName = document.getElementById('cardName').value;

    // Validation simple
    if (cardNumber.length !== 16) {
        showAlert('error', 'Numéro de carte invalide');
        return;
    }
    if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
        showAlert('error', 'Date d\'expiration invalide (MM/YY)');
        return;
    }
    if (cardCVV.length !== 3) {
        showAlert('error', 'CVV invalide');
        return;
    }

    // Animation de chargement
    const btn = document.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Traitement en cours...';

    // Simulation du paiement
    setTimeout(async () => {
        try {
            const response = await apiCall('/commandes', 'POST', pendingCheckoutData);
            showAlert('success', `✅ Paiement réussi! Numéro de suivi: ${response.commandeId}`);
            pendingCheckoutData = null;
            setTimeout(() => loadCommandes(), 1000);
        } catch (error) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }, 1500);
}

// === ORDERS ===
async function loadCommandes() {
    if (!currentUser) {
        loadLogin();
        return;
    }

    setContent('<div class="loading">Chargement de vos commandes</div>');

    try {
        const orders = await apiCall('/commandes');
        
        let html = '<button class="btn btn-secondary btn-small" onclick="loadProducts()">← Retour</button>';
        html += '<h1 style="margin-top: 2rem;">📦 Mes Commandes</h1>';

        if (orders.length === 0) {
            html += `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-text">Aucune commande</div>
                    <button class="btn btn-primary" onclick="loadProducts()">Commencer vos achats</button>
                </div>
            `;
        } else {
            orders.forEach(order => {
                const date = new Date(order.date_commande).toLocaleDateString('fr-FR');
                html += `
                    <div class="order-card">
                        <div class="order-header">
                            <div>
                                <div class="order-id">Commande #${order.id.substr(0, 8)}</div>
                                <div style="color: #7f8c8d; font-size: 0.9rem;">${date}</div>
                            </div>
                            <div class="order-status status-${order.statut.replace(' ', '_')}">${order.statut}</div>
                        </div>
                        <div style="margin-top: 1rem;">
                            <strong>Suivi:</strong> ${order.numero_suivi}<br>
                            <strong>Adresse:</strong> ${order.adresse_livraison}<br>
                            <strong>Total:</strong> <span style="font-size: 1.2rem; color: var(--primary-color); font-weight: bold;">${order.total.toFixed(2)}€</span>
                        </div>
                        <button class="btn btn-primary btn-small" style="margin-top: 1rem;" onclick="viewOrder('${order.id}')">
                            Voir détails
                        </button>
                    </div>
                `;
            });
        }

        setContent(html);
    } catch (error) {
        // Error handled
    }
}

async function viewOrder(orderId) {
    try {
        const order = await apiCall(`/commandes/${orderId}`);
        
        let html = `
            <button class="btn btn-secondary btn-small" onclick="loadCommandes()">← Retour</button>
            <div class="card" style="margin-top: 2rem;">
                <h2>Commande #${order.id.substr(0, 8)}</h2>
                <div style="padding: 1rem; background: #f9f9f9; border-radius: 8px; margin: 1rem 0;">
                    <strong>Statut:</strong> <span class="order-status status-${order.statut.replace(' ', '_')}">${order.statut}</span><br>
                    <strong>Numéro de suivi:</strong> ${order.numero_suivi}<br>
                    <strong>Date:</strong> ${new Date(order.date_commande).toLocaleDateString('fr-FR')}<br>
                    <strong>Adresse de livraison:</strong> ${order.adresse_livraison}
                </div>
                <h3>Articles commandés</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Quantité</th>
                            <th>Prix unitaire</th>
                            <th>Sous-total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        order.items.forEach(item => {
            const subtotal = item.quantite * item.prix_unitaire;
            html += `
                <tr>
                    <td>${item.nom}</td>
                    <td>${item.quantite}</td>
                    <td>${item.prix_unitaire.toFixed(2)}€</td>
                    <td>${subtotal.toFixed(2)}€</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                <div class="cart-total" style="margin-top: 2rem;">
                    <div class="total-amount">Total: ${order.total.toFixed(2)}€</div>
                </div>
            </div>
        `;

        setContent(html);
    } catch (error) {
        // Error handled
    }
}

// === ADMIN ===
async function loadAdmin() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('error', 'Accès refusé');
        return;
    }

    setContent('<div class="loading">Chargement du dashboard admin</div>');

    try {
        const stats = await apiCall('/admin/stats');
        
        let html = `
            <h1>📊 Dashboard Admin</h1>
            <div class="admin-grid">
                <div class="stat-box">
                    <div class="stat-number">${stats.totalUsers}</div>
                    <div class="stat-label">Utilisateurs</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${stats.totalProducts}</div>
                    <div class="stat-label">Produits</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${stats.totalOrders}</div>
                    <div class="stat-label">Commandes</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${stats.totalRevenue.toFixed(2)}€</div>
                    <div class="stat-label">Revenu total</div>
                </div>
            </div>

            <div style="margin-top: 2rem;">
                <button class="btn btn-primary" onclick="showAddProductForm()">➕ Ajouter un produit</button>
                <button class="btn btn-primary" onclick="loadAdminOrders()">📦 Voir commandes</button>
                <button class="btn btn-primary" onclick="loadAdminUsers()">👥 Voir utilisateurs</button>
            </div>
        `;

        setContent(html);
    } catch (error) {
        // Error handled
    }
}

function showAddProductForm() {
    const html = `
        <div class="card">
            <button class="btn btn-secondary btn-small" onclick="loadAdmin()">← Retour</button>
            <h2 style="margin-top: 1rem;">Ajouter un produit</h2>
            <form onsubmit="handleAddProduct(event)">
                <div class="form-group">
                    <label>Nom du produit</label>
                    <input type="text" id="prodNom" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="prodDescription" required></textarea>
                </div>
                <div class="form-group">
                    <label>Prix (€)</label>
                    <input type="number" id="prodPrix" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Catégorie</label>
                    <input type="text" id="prodCategorie" required>
                </div>
                <div class="form-group">
                    <label>Stock</label>
                    <input type="number" id="prodStock" required>
                </div>
                <div class="form-group">
                    <label>URL de l'image</label>
                    <input type="url" id="prodImage" placeholder="https://...">
                </div>
                <button type="submit" class="btn btn-success btn-block">Créer le produit</button>
            </form>
        </div>
    `;
    setContent(html);
}

async function handleAddProduct(e) {
    e.preventDefault();
    const nom = document.getElementById('prodNom').value;
    const description = document.getElementById('prodDescription').value;
    const prix = parseFloat(document.getElementById('prodPrix').value);
    const categorie = document.getElementById('prodCategorie').value;
    const stock = parseInt(document.getElementById('prodStock').value);
    const image_url = document.getElementById('prodImage').value;

    try {
        await apiCall('/admin/produits', 'POST', {
            nom, description, prix, categorie, stock, image_url
        });
        showAlert('success', 'Produit créé avec succès!');
        loadAdmin();
    } catch (error) {
        // Error handled
    }
}

async function loadAdminOrders() {
    try {
        const orders = await apiCall('/admin/commandes');
        
        let html = `
            <button class="btn btn-secondary btn-small" onclick="loadAdmin()">← Retour</button>
            <h1 style="margin-top: 2rem;">📦 Toutes les commandes</h1>
            <table>
                <thead>
                    <tr>
                        <th>Commande ID</th>
                        <th>Client</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(order => {
            html += `
                <tr>
                    <td>${order.id.substr(0, 8)}</td>
                    <td>${order.prenom} ${order.nom}</td>
                    <td>${order.total.toFixed(2)}€</td>
                    <td>
                        <select onchange="updateOrderStatus('${order.id}', this.value)">
                            <option value="en attente" ${order.statut === 'en attente' ? 'selected' : ''}>En attente</option>
                            <option value="confirmée" ${order.statut === 'confirmée' ? 'selected' : ''}>Confirmée</option>
                            <option value="expédiée" ${order.statut === 'expédiée' ? 'selected' : ''}>Expédiée</option>
                            <option value="livrée" ${order.statut === 'livrée' ? 'selected' : ''}>Livrée</option>
                            <option value="annulée" ${order.statut === 'annulée' ? 'selected' : ''}>Annulée</option>
                        </select>
                    </td>
                    <td>${new Date(order.date_commande).toLocaleDateString('fr-FR')}</td>
                    <td><button class="btn btn-primary btn-small" onclick="viewOrder('${order.id}')">Détails</button></td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        setContent(html);
    } catch (error) {
        // Error handled
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await apiCall(`/admin/commandes/${orderId}/statut`, 'PUT', { statut: newStatus });
        showAlert('success', 'Statut mis à jour!');
        loadAdminOrders();
    } catch (error) {
        // Error handled
    }
}

async function loadAdminUsers() {
    try {
        const users = await apiCall('/admin/users');
        
        let html = `
            <button class="btn btn-secondary btn-small" onclick="loadAdmin()">← Retour</button>
            <h1 style="margin-top: 2rem;">👥 Utilisateurs</h1>
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Nom</th>
                        <th>Rôle</th>
                        <th>Date inscription</th>
                    </tr>
                </thead>
                <tbody>
        `;

        users.forEach(user => {
            html += `
                <tr>
                    <td>${user.email}</td>
                    <td>${user.prenom} ${user.nom}</td>
                    <td>${user.role}</td>
                    <td>${new Date(user.date_creation).toLocaleDateString('fr-FR')}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        setContent(html);
    } catch (error) {
        // Error handled
    }
}
