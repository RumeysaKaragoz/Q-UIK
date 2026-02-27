const API_URL = "https://api.npoint.io/433d2b54b3c3bb324e23";
let allData = [];
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

async function fetchData() {
    const offlineBanner = document.getElementById('offline-banner');
    
    // 1. ADIM: Tarayıcı gerçekten offline mı?
    if (!navigator.onLine) {
        offlineBanner.innerText = "⚠️ İnternet bağlantınız yok. Eski veriler gösteriliyor.";
        offlineBanner.classList.remove('hidden');
    }

    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) throw new Error("API'ye ulaşılamıyor.");

        allData = await response.json();
        
        // Veri başarıyla geldiyse ve internet varsa banner'ı KESİN gizle
        if (navigator.onLine) {
            offlineBanner.classList.add('hidden');
        }

        localStorage.setItem('last_cached_data', JSON.stringify(allData));
        generateCategoryButtons(allData);
        renderData(allData);

    } catch (error) {
        console.error("Yükleme hatası:", error);
        
        // Hata durumunda cache'den yükle
        const cachedData = localStorage.getItem('last_cached_data');
        if (cachedData) {
            allData = JSON.parse(cachedData);
            generateCategoryButtons(allData);
            renderData(allData);
        }
        
        // Sadece internet yoksa veya API çöktüyse banner kalsın
        offlineBanner.classList.remove('hidden');
        if (navigator.onLine) {
            offlineBanner.innerText = "⚠️ Sunucu ile bağlantı kurulamadı. Önbellekteki veriler aktif.";
        }
    }
}
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
//filter
function filterRequests(filterType) {
    let filtered;

    if (filterType === 'hepsi') {
        filtered = allData;
    } else if (filterType === 'acil') {
        // API'deki "acil: true" olanları filtrele
        filtered = allData.filter(item => item.acil === true);
    } else {
        // Dinamik olarak gelen kategoriye göre filtrele
        filtered = allData.filter(item => item.kategori === filterType);
    }

    renderData(filtered);
}
// Render
function renderData(data) {
    const listElement = document.getElementById('request-list');
    listElement.innerHTML = data.map(item => {
        // Renk ve etiket belirleme
        const isUrgent = item.acil ? 'urgent-card' : '';
        const typeLabel = item.tip === 'ihtiyac' ? 'İHTİYAÇ ⚠️' : 'DESTEK ✅';
        const typeClass = item.tip === 'ihtiyac' ? 'type-ihtiyac' : 'type-destek';

        return `
            <div class="card ${isUrgent} ${typeClass}">
                <div class="card-header">
                    <span class="badge">${typeLabel}</span>
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
        `;
    }).join('');
}

// 4. VERİ KALICILIĞI (LocalStorage - Görev Üstlenme)
function assignTask(id) {
    const task = allData.find(item => item.id == id);
    let myTasks = JSON.parse(localStorage.getItem('my_tasks')) || [];
    
    // Mükerrer kaydı önle
    if (!myTasks.some(t => t.id == id)) {
        myTasks.push(task);
        localStorage.setItem('my_tasks', JSON.stringify(myTasks));
        renderMyTasks();
        alert("Görev listenize eklendi.");
    }
}

function renderMyTasks() {
    const savedContainer = document.getElementById('saved-tasks');
    const myTasks = JSON.parse(localStorage.getItem('my_tasks')) || [];
    
    if (myTasks.length === 0) {
        savedContainer.innerHTML = "<p>Henüz üstlendiğiniz bir görev yok.</p>";
        return;
    }

    savedContainer.innerHTML = myTasks.map(t => `
        <div class="card ${t.completed ? 'completed' : ''}">
            <h3>${t.detay}</h3>
            ${t.completed 
                ? `<p>✅ Bu görev tamamlandı.</p>` 
                : `<button class="done-btn" onclick="completeTask('${t.id}')">✔️ Görevi Tamamladım</button>`
            }
            <button style="background:none; color:gray; font-size:11px;" onclick="removeTask('${t.id}')">Listeden Kaldır</button>
        </div>
    `).join('');
}

function completeTask(id) {
    let myTasks = JSON.parse(localStorage.getItem('my_tasks'));
    myTasks = myTasks.map(t => {
        if (t.id == id) return { ...t, completed: true };
        return t;
    });
    localStorage.setItem('my_tasks', JSON.stringify(myTasks));
    renderMyTasks();
}

function removeTask(id) {
    let myTasks = JSON.parse(localStorage.getItem('my_tasks'));
    myTasks = myTasks.filter(t => t.id != id);
    localStorage.setItem('my_tasks', JSON.stringify(myTasks));
    renderMyTasks();
}
function updateOnlineStatus() {
    const offlineBanner = document.getElementById('offline-banner');
    if (navigator.onLine) {
        offlineBanner.classList.add('hidden'); // İnternet var, gizle
    } else {
        offlineBanner.classList.remove('hidden'); // İnternet yok, göster
        offlineBanner.innerText = "⚠️ İnternet bağlantısı kesildi. Çevrimdışı mod aktif.";
    }
}

// Başlangıçta çalıştır
fetchData();
renderMyTasks();
