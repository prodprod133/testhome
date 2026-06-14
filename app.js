// ========== TELEGRAM INIT ==========
const tg = window.Telegram?.WebApp || {
    ready: () => {},
    expand: () => {},
    sendData: (d) => console.log('sendData:', d),
    showAlert: (m) => alert(m),
    HapticFeedback: null,
    MainButton: { setText:()=>{}, show:()=>{}, hide:()=>{}, onClick:()=>{} },
    BackButton: { show:()=>{}, hide:()=>{}, onClick:()=>{} },
    themeParams: {},
    onEvent: () => {}
};

tg.ready();
tg.expand();

// ========== ДАННЫЕ НОМЕРОВ ==========
const rooms = {
    1: { name: 'Стандарт',     price: 2500, guests: 2 },
    2: { name: 'Люкс с видом', price: 4500, guests: 3 },
    3: { name: 'Семейный',     price: 6000, guests: 5 }
};

// ========== СОСТОЯНИЕ ==========
let state = {
    selectedRoom: null,
    guests: 2,
    prevScreen: 'screen-home'
};

// ========== НАВИГАЦИЯ ==========
function goToScreen(screenId) {
    const current = document.querySelector('.screen.active');
    if (current) {
        state.prevScreen = current.id;
    }

    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });

    const next = document.getElementById(screenId);
    if (next) {
        next.classList.add('active');
        next.scrollTop = 0;
    }

    updateNav(screenId);

    if (screenId === 'screen-home' || screenId === 'screen-success') {
        try { tg.BackButton.hide(); } catch(e) {}
    } else {
        try { tg.BackButton.show(); } catch(e) {}
    }
}

function goBack() {
    goToScreen(state.prevScreen || 'screen-home');
}

// ========== НАВБАР ==========
function updateNav(screenId) {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });

    const navMap = {
        'screen-home':    'nav-home',
        'screen-rooms':   'nav-rooms',
        'screen-booking': 'nav-booking',
        'screen-contact': 'nav-contact',
        'screen-success': 'nav-home'
    };

    const navId = navMap[screenId];
    if (navId) {
        const navBtn = document.getElementById(navId);
        if (navBtn) navBtn.classList.add('active');
    }
}

// ========== ВЫБОР НОМЕРА ==========
function selectRoom(roomId) {
    state.selectedRoom = roomId;
    state.guests = 2;

    const room = rooms[roomId];

    const nameEl  = document.getElementById('selected-room-name');
    const priceEl = document.getElementById('selected-room-price');
    const guestsEl = document.getElementById('guests-count');

    if (nameEl)   nameEl.textContent  = room.name;
    if (priceEl)  priceEl.textContent = `${room.price.toLocaleString('ru')} ₽ / ночь`;
    if (guestsEl) guestsEl.textContent = '2';

    calculateTotal();
    goToScreen('screen-booking');
    haptic('medium');
}

// ========== СЧЁТЧИК ГОСТЕЙ ==========
function changeGuests(delta) {
    if (!state.selectedRoom) return;
    const maxGuests = rooms[state.selectedRoom].guests;
    state.guests = Math.max(1, Math.min(maxGuests, state.guests + delta));
    const el = document.getElementById('guests-count');
    if (el) el.textContent = state.guests;
    haptic('light');
}

// ========== РАСЧЁТ СТОИМОСТИ ==========
function calculateTotal() {
    const checkInEl  = document.getElementById('check-in');
    const checkOutEl = document.getElementById('check-out');
    const nightsEl   = document.getElementById('nights-display');
    const totalEl    = document.getElementById('total-card');

    if (!checkInEl || !checkOutEl) return;

    const checkIn  = checkInEl.value;
    const checkOut = checkOutEl.value;

    if (!checkIn || !checkOut || !state.selectedRoom) {
        if (nightsEl) nightsEl.style.display = 'none';
        if (totalEl)  totalEl.style.display  = 'none';
        return;
    }

    const dateIn  = new Date(checkIn);
    const dateOut = new Date(checkOut);
    const nights  = Math.round((dateOut - dateIn) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
        if (nightsEl) nightsEl.style.display = 'none';
        if (totalEl)  totalEl.style.display  = 'none';
        return;
    }

    const room  = rooms[state.selectedRoom];
    const total = nights * room.price;

    if (nightsEl) {
        nightsEl.style.display = 'flex';
        const nc = document.getElementById('nights-count');
        const tp = document.getElementById('total-price');
        if (nc) nc.textContent = `${nights} ${declNights(nights)}`;
        if (tp) tp.textContent = `${total.toLocaleString('ru')} ₽`;
    }

    if (totalEl) {
        totalEl.style.display = 'flex';
        const trn = document.getElementById('total-room-name');
        const tn  = document.getElementById('total-nights');
        const ta  = document.getElementById('total-amount');
        if (trn) trn.textContent = room.name;
        if (tn)  tn.textContent  = `${nights} ${declNights(nights)}`;
        if (ta)  ta.textContent  = `${total.toLocaleString('ru')} ₽`;
    }
}

// ========== СКЛОНЕНИЕ ==========
function declNights(n) {
    const mod10  = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return 'ночей';
    if (mod10 === 1)  return 'ночь';
    if (mod10 >= 2 && mod10 <= 4) return 'ночи';
    return 'ночей';
}

// ========== ОТПРАВКА ==========
function submitBooking() {
    console.log('=== submitBooking вызван! ===');

    const nameEl     = document.getElementById('guest-name');
    const phoneEl    = document.getElementById('guest-phone');
    const checkInEl  = document.getElementById('check-in');
    const checkOutEl = document.getElementById('check-out');
    const wishesEl   = document.getElementById('wishes');

    const name     = nameEl?.value.trim()    || '';
    const phone    = phoneEl?.value.trim()   || '';
    const checkIn  = checkInEl?.value        || '';
    const checkOut = checkOutEl?.value       || '';
    const wishes   = wishesEl?.value.trim()  || '';

    // Валидация
    if (!state.selectedRoom) {
        showAlert('⚠️ Выберите номер во вкладке Номера');
        goToScreen('screen-rooms');
        return;
    }
    if (!name) {
        showAlert('⚠️ Введите имя и фамилию');
        nameEl?.focus();
        return;
    }
    if (!phone) {
        showAlert('⚠️ Введите номер телефона');
        phoneEl?.focus();
        return;
    }
    if (!checkIn) {
        showAlert('⚠️ Выберите дату заезда');
        return;
    }
    if (!checkOut) {
        showAlert('⚠️ Выберите дату выезда');
        return;
    }

    const nights = Math.round(
        (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
        showAlert('⚠️ Дата выезда должна быть позже заезда');
        return;
    }

    const room  = rooms[state.selectedRoom];
    const total = nights * room.price;

    const bookingData = {
        room:     room.name,
        price:    room.price,
        name:     name,
        phone:    phone,
        checkIn:  formatDate(checkIn),
        checkOut: formatDate(checkOut),
        nights:   nights,
        guests:   state.guests,
        total:    total,
        wishes:   wishes || 'Нет'
    };

    console.log('📦 Данные бронирования:', bookingData);

    // Блокируем кнопку
    const btn = document.getElementById('submit-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Отправляем...';
    }

    haptic('success');

    // ОТПРАВКА
    try {
        tg.sendData(JSON.stringify(bookingData));
        console.log('✅ sendData отправлен!');
    } catch(e) {
        console.error('❌ sendData ошибка:', e);
    }

    // Показываем успех
    setTimeout(() => {
        showSuccess(bookingData);
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Забронировать';
        }
    }, 800);
}

// ========== ЭКРАН УСПЕХА ==========
function showSuccess(data) {
    const el = document.getElementById('success-details');
    if (el) {
        el.innerHTML = `
            <div class="success-row">
                <span>Номер</span>
                <span>${data.room}</span>
            </div>
            <div class="success-row">
                <span>Заезд</span>
                <span>${data.checkIn}</span>
            </div>
            <div class="success-row">
                <span>Выезд</span>
                <span>${data.checkOut}</span>
            </div>
            <div class="success-row">
                <span>Ночей</span>
                <span>${data.nights} ${declNights(data.nights)}</span>
            </div>
            <div class="success-row">
                <span>Гостей</span>
                <span>${data.guests}</span>
            </div>
            <div class="success-row success-total">
                <span>Итого</span>
                <span>${data.total.toLocaleString('ru')} ₽</span>
            </div>
        `;
    }
    goToScreen('screen-success');
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
        day:   '2-digit',
        month: '2-digit',
        year:  'numeric'
    });
}

function showAlert(msg) {
    try {
        tg.showAlert(msg);
    } catch(e) {
        alert(msg);
    }
}

function haptic(type = 'light') {
    try {
        if (tg?.HapticFeedback) {
            if (type === 'success') {
                tg.HapticFeedback.notificationOccurred('success');
            } else {
                tg.HapticFeedback.impactOccurred(type);
            }
        }
    } catch(e) {}
}

// ========== ДАТЫ ==========
function setMinDates() {
    const today    = new Date();
    const yyyy     = today.getFullYear();
    const mm       = String(today.getMonth() + 1).padStart(2, '0');
    const dd       = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const checkIn  = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');
    if (!checkIn || !checkOut) return;

    checkIn.min  = todayStr;
    checkOut.min = todayStr;

    checkIn.addEventListener('change', function () {
        const next = new Date(this.value);
        next.setDate(next.getDate() + 1);
        const ny = next.getFullYear();
        const nm = String(next.getMonth() + 1).padStart(2, '0');
        const nd = String(next.getDate()).padStart(2, '0');
        checkOut.min = `${ny}-${nm}-${nd}`;
        if (checkOut.value && checkOut.value <= this.value) {
            checkOut.value = '';
        }
        calculateTotal();
    });

    checkOut.addEventListener('change', calculateTotal);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function () {
    try {
        tg.BackButton.onClick(() => goBack());
    } catch(e) {}

    setMinDates();
    goToScreen('screen-home');

    console.log('✅ Приложение загружено!');
});
