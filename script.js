const API_URL = "https://api.npoint.io/433d2b54b3c3bb324e23";
let allData = [];

// Banner Gizleme/Gösterme Yardımcısı
const toggleBanner = (show, message = "") => {
    const banner = document.getElementById('offline-banner');
    if (show) {
        banner.classList.remove('hidden');
        if (message) banner.innerText = message;
    } else {
        banner.classList.add('hidden');
    }
};

async function fetchData() {
    const loader = document.getElementById('loader');
    
    // Tarayıcı offline ise hemen uyar
    if (!navigator.onLine) {
        toggleBanner(true, "⚠️ İnternet yok. Önbellekteki veriler gösteriliyor.");
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Sunucu hatası");

        allData = await response.json();
        
        // BAŞARILI DURUM: Her şey yolundaysa banner'ı kapat
        if (navigator.onLine) toggleBanner(false);

        localStorage.setItem('last_cached_data', JSON.stringify(allData));
        generateCategoryButtons(allData);
        renderData(allData);

    } catch (error) {
        console.error("Hata:", error);
        
        // HATA DURUMU: Cache'den veriyi al
        const cachedData = localStorage.getItem('last_cached_data');
        if (cachedData) {
            allData = JSON.parse(cachedData);
            generateCategoryButtons(allData);
            renderData(allData);
        }
        
        // Kullanıcı online ama API çökmüşse özel mesaj
        const msg = navigator.onLine 
            ? "⚠️ Sunucuya ulaşılamadı. Eski veriler yükleniyor." 
            : "⚠️ Çevrimdışısınız. Eski veriler yükleniyor.";
        toggleBanner(true, msg);
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

// Kategorileri Veriden Dinamik Oluşturma
function generateCategoryButtons(data) {
    const filterContainer = document.querySelector('.filters');
    const categories = [...new Set(data.map(item => item.kategori))];
    
    let buttonsHTML = `
        <button onclick="filterRequests('hepsi')">🌐 Hepsi</button>
        <button onclick="filterRequests('acil')" class="urgent-btn">🚨 ACİL</button>
    `;

    buttonsHTML += categories.map(cat => {
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        return `<button onclick="filterRequests('${cat}')">${label}</button>`;
    }).join('');

    filterContainer.innerHTML = buttonsHTML;
}

// Filtreleme Fonksiyonu
function filterRequests(filterType) {
    let filtered = (filterType === 'hepsi') ? allData :
                   (filterType === 'acil') ? allData.filter(item => item.acil === true) :
                   allData.filter(item => item.kategori === filterType);
    renderData(filtered);
}

// Verileri Ekrana Basma
function renderData(data) {
    const listElement = document.getElementById('request-list');
    listElement.innerHTML = data.map(item => `
        <div class="card ${item.acil ? 'urgent-card' : ''} ${item.tip === 'ihtiyac' ? 'type-ihtiyac' : 'type-destek'}">
            <div class="card-header">
                <span class="badge">${item.tip === 'ihtiyac' ? 'İHTİYAÇ ⚠️' : 'DESTEK ✅'}</span>
                <span class="category-tag">#${item.kategori}</span>
            </div>
            <h3>${item.baslik}</h3>
            <p class="detay">${item.detay}</p>
            <div class="info">
                <span>📍 ${item.konum}</span>
                <span>📅 ${item.tarih}</span>
            </div>
            <button class="assign-btn" onclick="assignTask('${item.id}')">Görevi Üstlen</button>
        </div>
    `).join('');
}

// Görev Üstlenme Mantığı
function assignTask(id) {
    const task = allData.find(item => item.id == id);
    let myTasks = JSON.parse(localStorage.getItem('my_tasks')) || [];
    if (!myTasks.some(t => t.id == id)) {
        myTasks.push({...task, completed: false});
        localStorage.setItem('my_tasks', JSON.stringify(myTasks));
        renderMyTasks();
        alert("Görev eklendi.");
    }
}

function renderMyTasks() {
    const container = document.getElementById('saved-tasks');
    const myTasks = JSON.parse(localStorage.getItem('my_tasks')) || [];
    if (myTasks.length === 0) {
        container.innerHTML = "<p>Üstlenilen görev yok.</p>";
        return;
    }
    container.innerHTML = myTasks.map(t => `
        <div class="card ${t.completed ? 'completed' : ''}">
            <h3>${t.detay}</h3>
            ${t.completed ? '<p>✅ Tamamlandı</p>' : `<button class="done-btn" onclick="completeTask('${t.id}')">✔️ Tamamladım</button>`}
            <button style="background:none; color:gray; cursor:pointer;" onclick="removeTask('${t.id}')">Kaldır</button>
        </div>
    `).join('');
}

function completeTask(id) {
    let tasks = JSON.parse(localStorage.getItem('my_tasks')).map(t => t.id == id ? {...t, completed: true} : t);
    localStorage.setItem('my_tasks', JSON.stringify(tasks));
    renderMyTasks();
}

function removeTask(id) {
    let tasks = JSON.parse(localStorage.getItem('my_tasks')).filter(t => t.id != id);
    localStorage.setItem('my_tasks', JSON.stringify(tasks));
    renderMyTasks();
}

// Tarayıcı Online/Offline Takibi
window.addEventListener('online', () => toggleBanner(false));
window.addEventListener('offline', () => toggleBanner(true, "⚠️ İnternet kesildi."));

// Başlat
fetchData();
renderMyTasks();
