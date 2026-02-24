// Telegram (ЗАМЕНИТЬ)
const TELEGRAM_BOT_TOKEN = 'ВАШ_ТОКЕН_БОТА';
const TELEGRAM_CHAT_ID = 'ID_КАНАЛА';

// Глобальные переменные
let allProducts = [];
let currentTheme = '';
let cart = [];

// DOM элементы
const cartFixedBtn = document.getElementById('cart-fixed-btn');
const cartModal = document.getElementById('cart-modal');
const closeModalBtn = document.querySelector('.close-modal');
const cartCounter = document.getElementById('cart-counter');
const menuContainer = document.getElementById('menu-container');
const themeTabs = document.getElementById('theme-tabs');
const loadingIndicator = document.getElementById('loading-indicator');

// Открыть модалку
cartFixedBtn.addEventListener('click', () => {
    cartModal.classList.add('active');
});

// Закрыть модалку
closeModalBtn.addEventListener('click', () => {
    cartModal.classList.remove('active');
});

// Закрыть по клику вне модалки
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.classList.remove('active');
    }
});

// Загрузка Excel файла
async function loadExcelFile() {
    try {
        loadingIndicator.style.display = 'block';
        loadingIndicator.textContent = 'Загрузка Excel файла...';
        
        // Загружаем файл bd.xlsx
        const response = await fetch('bd.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        
        loadingIndicator.textContent = 'Чтение данных...';
        
        // Читаем Excel
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Берем первый лист (МЕНЮ)
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Конвертируем в JSON
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Парсим данные
        allProducts = parseExcelData(jsonData);
        
        loadingIndicator.style.display = 'none';
        
        // Инициализируем сайт
        initializeSite();
        
    } catch (error) {
        console.error('Ошибка загрузки Excel:', error);
        loadingIndicator.innerHTML = '❌ Ошибка загрузки данных. Проверьте, что файл bd.xlsx находится в той же папке.';
        loadingIndicator.classList.add('error');
    }
}

// Парсинг данных из Excel
function parseExcelData(data) {
    if (data.length < 2) return []; // Нет данных
    
    // Заголовки (первая строка)
    const headers = data[0];
    
    // Находим индексы нужных колонок
    const idIndex = headers.findIndex(h => h && h.toString().includes('ID'));
    const themeIndex = headers.findIndex(h => h && h.toString().includes('Тема'));
    const categoryIndex = headers.findIndex(h => h && h.toString().includes('Категория'));
    const subcategoryIndex = headers.findIndex(h => h && h.toString().includes('Подкатегория'));
    const nameIndex = headers.findIndex(h => h && h.toString().includes('Название'));
    const descIndex = headers.findIndex(h => h && h.toString().includes('Описание'));
    const weightIndex = headers.findIndex(h => h && h.toString().includes('Вес'));
    const priceIndex = headers.findIndex(h => h && h.toString().includes('Цена'));
    const photoIndex = headers.findIndex(h => h && h.toString().includes('Ссылка на фото'));
    
    const products = [];
    
    // Проходим по строкам (начиная со второй)
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        // Проверяем, что есть хотя бы ID или название
        if (!row[idIndex] && !row[nameIndex]) continue;
        
        const product = {
            ID: row[idIndex] || i,
            Тема: row[themeIndex] || '',
            Категория: row[categoryIndex] || 'Другое',
            Подкатегория: row[subcategoryIndex] || '',
            Название: row[nameIndex] || 'Без названия',
            Описание: row[descIndex] || '',
            Вес: row[weightIndex] || '',
            Цена: parseFloat(row[priceIndex]) || 0,
            Ссылка_на_фото: row[photoIndex] || ''
        };
        
        products.push(product);
    }
    
    return products;
}

// Инициализация сайта после загрузки данных
function initializeSite() {
    // Получаем уникальные темы
    const themes = [...new Set(allProducts.map(item => item.Тема).filter(t => t))];
    
    if (themes.length === 0) {
        loadingIndicator.innerHTML = '❌ Не найдены темы в данных';
        return;
    }
    
    renderThemeTabs(themes);
    
    // Выбираем первую тему
    currentTheme = themes[0];
    renderMenu();
}

// Отрисовка табов с темами
function renderThemeTabs(themes) {
    themeTabs.innerHTML = '';
    themes.forEach((theme, index) => {
        const tab = document.createElement('button');
        tab.className = `tab-btn ${index === 0 ? 'active' : ''}`;
        tab.dataset.theme = theme;
        tab.textContent = theme;
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTheme = theme;
            renderMenu();
        });
        themeTabs.appendChild(tab);
    });
}

// Отрисовка меню по текущей теме
function renderMenu() {
    // Фильтруем товары по теме
    const themeProducts = allProducts.filter(p => p.Тема === currentTheme);
    
    // Группируем по категориям
    const categories = {};
    themeProducts.forEach(product => {
        if (!categories[product.Категория]) {
            categories[product.Категория] = [];
        }
        categories[product.Категория].push(product);
    });
    
    // Отрисовываем категории
    menuContainer.innerHTML = '';
    
    Object.keys(categories).sort().forEach(categoryName => {
        const categoryProducts = categories[categoryName];
        
        // Группируем по подкатегориям
        const subcategories = {};
        categoryProducts.forEach(product => {
            const subcat = product.Подкатегория || 'Другое';
            if (!subcategories[subcat]) {
                subcategories[subcat] = [];
            }
            subcategories[subcat].push(product);
        });
        
        // Создаем секцию категории
        const section = document.createElement('section');
        section.className = 'category';
        
        const categoryTitle = document.createElement('h2');
        categoryTitle.textContent = categoryName;
        section.appendChild(categoryTitle);
        
        // Для каждой подкатегории создаем свой список
        Object.keys(subcategories).sort().forEach(subcatName => {
            // Заголовок подкатегории (если есть несколько)
            if (Object.keys(subcategories).length > 1) {
                const subcatTitle = document.createElement('h3');
                subcatTitle.className = 'subcategory';
                subcatTitle.textContent = subcatName;
                section.appendChild(subcatTitle);
            }
            
            const productList = document.createElement('div');
            productList.className = 'product-list compact';
            
            subcategories[subcatName].forEach(product => {
                productList.appendChild(createProductCard(product));
            });
            
            section.appendChild(productList);
        });
        
        // Кнопка "Показать ещё"
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-category';
        toggleBtn.textContent = 'Показать ещё';
        toggleBtn.addEventListener('click', function() {
            const lists = section.querySelectorAll('.product-list');
            lists.forEach(list => {
                list.classList.toggle('expanded');
            });
            this.textContent = this.textContent === 'Показать ещё' ? 'Скрыть' : 'Показать ещё';
        });
        section.appendChild(toggleBtn);
        
        menuContainer.appendChild(section);
    });
}

// Создание карточки товара
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    
    // Формируем путь к изображению
    const imagePath = product.Ссылка_на_фото || '';
    
    let imageHtml = '';
    if (imagePath) {
        imageHtml = `<div class="product-image" style="background-image: url('images/${imagePath}');"></div>`;
    } else {
        imageHtml = `<div class="product-image" style="background-color: #f0e2d4; display: flex; align-items: center; justify-content: center;">📷 Нет фото</div>`;
    }
    
    card.innerHTML = `
        ${imageHtml}
        <div class="product-info">
            <h3>${product.Название}</h3>
            ${product.Описание ? `<div class="product-desc">${product.Описание}</div>` : ''}
            <div class="product-weight">${product.Вес}</div>
            <div class="product-price">${product.Цена} ₽</div>
            <button onclick="addToCart(${product.ID})">В корзину</button>
        </div>
    `;
    return card;
}

// Добавление в корзину
window.addToCart = function(id) {
    const product = allProducts.find(p => p.ID === id);
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ 
            id: product.ID,
            name: product.Название,
            price: product.Цена,
            weight: product.Вес,
            quantity: 1 
        });
    }
    renderCart();
    updateCartCounter();
};

// Удаление из корзины
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
    updateCartCounter();
}

// Изменение количества
function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            renderCart();
        }
    }
    updateCartCounter();
}

// Обновление счётчика
function updateCartCounter() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCounter.textContent = totalItems;
}

// Отрисовка корзины
function renderCart() {
    const container = document.getElementById('cart-items');
    const totalSpan = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#a18e7c; padding: 2rem;">Корзина пуста</p>';
        totalSpan.innerText = '0';
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        html += `
            <div class="cart-item">
                <span><b>${item.name}</b> x${item.quantity} (${item.weight})</span>
                <span class="cart-item-actions">
                    ${item.price * item.quantity} ₽
                    <button onclick="changeQty(${item.id}, -1)">−</button>
                    <button onclick="changeQty(${item.id}, 1)">+</button>
                    <button onclick="removeFromCart(${item.id})">✕</button>
                </span>
            </div>
        `;
    });
    container.innerHTML = html;
    totalSpan.innerText = total;
}

// Отправка в Telegram
async function sendOrderToTelegram(orderText) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: TELEGRAM_CHAT_ID,
        text: orderText,
        parse_mode: 'HTML'
    };
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ok) {
            alert('✅ Заказ отправлен! Менеджер свяжется с вами.');
            cart = [];
            renderCart();
            updateCartCounter();
            cartModal.classList.remove('active');
        } else {
            alert('❌ Ошибка Telegram. Проверьте токен и chat_id');
        }
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
}

// Оформление заказа
document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Корзина пуста');
        return;
    }
    let msg = '<b>🍽 Новый заказ (Culart Catering)</b>\n\n';
    msg += `<b>Тема:</b> ${currentTheme}\n\n`;
    let total = 0;
    cart.forEach(item => {
        msg += `${item.name} (${item.weight}) — ${item.quantity} шт. = ${item.price * item.quantity} ₽\n`;
        total += item.price * item.quantity;
    });
    msg += `\n<b>ИТОГО: ${total} ₽</b>\n\nСамовывоз (ДСК) – скидка 5% применяется при расчёте.`;
    sendOrderToTelegram(msg);
});

// Запуск загрузки Excel
loadExcelFile();
renderCart();
updateCartCounter();