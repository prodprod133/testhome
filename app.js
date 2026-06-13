// ========== TELEGRAM INIT ==========
const tg = window.Telegram?.WebApp || {
    ready: () => {},
    expand: () => {},
    sendData: (d) => console.log('sendData:', d),
    showAlert: (m) => alert(m),
    HapticFeedback: null,
    MainButton: {
        setText: () => {}, show: () => {},
        hide: () => {}, onClick: () => {},
        color: '', textColor: ''
    },
    BackButton: { show: () => {}, hide: () => {}, onClick: () => {} },
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
    const next    = document.getElementById(screenId);
    if (!next || (current && current.id === screenId)) return;

    // Запоминаем откуда пришли
    if (current) state.prevScreen = current.id;

    // Анимация выхода
    if (current) {
        current.classList.add('slide-out');
        setTimeout(() => {
            current.classList.remove('active', 'slide-out');
            // Скроллим в начало предыдущего
            current.scrollTop = 0;
        }, 350);
    }

    // Анимация входа
    requestAnimationFrame(() => {
        next.classList.add('active');
    });

    // Обновляем навбар
    updateNav(screenId);

    // Telegram BackButton
    if (screenId === 'screen-home' || screenId === 'screen-success') {
        tg.BackButton.hide();
    } else {
        tg.BackButton.show();
    }

    // MainButton только на бронировании
    if (screenId === 'screen-booking') {
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

function goBack() {
    goToScreen(state.prevScreen);
}

// ========== ОБНОВЛЕНИЕ НАВБАРА ==========
function updateNav(screenId) {
    const navMap = {
        'screen-home':    'nav-home',
        'screen-rooms':   'nav-rooms',
        'screen-booking': 'nav-booking',
        'screen-contact': 'nav-contact',
        'screen-success': 'nav-home'
    };

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeNav = navMap[screenId];
    if (activeNav) {
        const el = document.getElementById(activeNav);
        if (el) el.classList.add('active');
    }
}

// ========== ВЫБОР НОМЕРА ==========
function selectRoom(roomId) {
    state.selectedRoom = roomId;
    state.guests = 2;

    const room = rooms[roomId];

    document.getElementById('selected-room-name').textContent = room.name;
    document.getElementById('selected-room-price').textContent =
        `${room.price.toLocaleString('ru')} ₽ / ночь`;
    document.getElementById('guests-count').textContent = state.guests;

    calculateTotal();
    goToScreen('screen-booking');
    haptic('medium');
}

// ========== СЧЁТЧИК ГОСТЕЙ ==========
function changeGuests(delta) {
    if (!state.selectedRoom) return;

    const maxGuests = rooms[state.selectedRoom].guests;
    state.guests = Math.max(1, Math.min(maxGuests, state.guests + delta));

    document.getElementById('guests-count').textContent = state.guests;
    haptic('light');
}

// ========== РАСЧЁТ СТОИМОСТИ ==========
function calculateTotal() {
    const checkIn  = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    const nightsEl = document.getElementById('nights-display');
    const totalEl  = document.getElementById('total-card');

    if (!checkIn || !checkOut || !state.selectedRoom) {
        nightsEl.style.display = 'none';
        totalEl.style.display  = 'none';
        return;
    }

    const dateIn  = new Date(checkIn);
    const dateOut = new Date(checkOut);
    const nights  = Math.round(
        (dateOut - dateIn) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
        nightsEl.style.display = 'none';
        totalEl.style.display  = 'none';
        return;
    }

    const room  = rooms[state.selectedRoom];
    const total = nights * room.price;

    // Показываем ночи
    nightsEl.style.display = 'flex';
    document.getElementById('nights-count').textContent =
        `${nights} ${declNights(nights)}`;
    document.getElementById('total-price').textContent =
        `${total.toLocaleString('ru')} ₽`;

    // Показываем итого
    totalEl.style.display = 'flex';
    document.getElementById('total-room-name').textContent = room.name;
    document.getElementById('total-nights').textContent =
        `${nights} ${declNights(nights)}`;
    document.getElementById('total-amount').textContent =
        `${total.toLocaleString('ru')} ₽`;
}

// ========== СКЛОНЕНИЕ ==========
function declNights(n) {
    const mod10  = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return 'ночей';
    if (mod10 === 1) return 'ночь';
    if (mod10 >= 2 && mod10 <= 4) return 'ночи';
    return 'ночей';
}

// ========== ОТПРАВКА ЗАЯВКИ ==========
function submitBooking() {
    const name     = document.getElementById('guest-name').value.trim();
    const phone    = document.getElementById('guest-phone').value.trim();
    const checkIn  = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    const wishes   = document.getElementById('wishes').value.trim();

    // Валидация
    if (!state.selectedRoom) {
        showAlert('⚠️ Пожалуйста, выберите номер во вкладке "Номера"');
        goToScreen('screen-rooms');
        return;
    }
    if (!name) {
        showAlert('⚠️ Введите имя и фамилию');
        shakeField('guest-name');
        return;
    }
    if (!phone) {
        showAlert('⚠️ Введите номер телефона');
        shakeField('guest-phone');
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

    const dateIn  = new Date(checkIn);
    const dateOut = new Date(checkOut);
    const nights  = Math.round(
        (dateOut - dateIn) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
        showAlert('⚠️ Дата выезда должна быть позже даты заезда');
        return;
    }

    const room  = rooms[state.selectedRoom];
    const total = nights * room.price;

    // Данные для бота
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

    // Кнопка — загрузка
    const btn = document.querySelector('#screen-booking .btn-large');
    if (btn) {
        btn.classList.add('btn-loading');
        btn.innerHTML = '<span>Отправляем</span>';
    }

    haptic('success');

    // ✅ ОТПРАВКА ДАННЫХ В БОТ
    try {
        tg.sendData(JSON.stringify(bookingData));
    } catch(e) {
        console.error('sendData error:', e);
    }

    // Показываем успех через 500мс
    setTimeout(() => {
        showSuccess(bookingData);
        if (btn) {
            btn.classList.remove('btn-loading');
            btn.innerHTML = '<span>Подтвердить бронирование</span>';
        }
    }, 500);
}

// ========== ЭКРАН УСПЕХА ==========
function showSuccess(data) {
    const details = document.getElementById('success-details');
    details.innerHTML = `
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
        <div class="success-row" style="
            padding-top: 12px;
            border-top: 1px solid var(--border);
            margin-top: 4px;">
            <span style="font-weight:700;color:var(--text-primary)">
                Итого
            </span>
            <span style="font-weight:700;
                         color:var(--accent);
                         font-size:18px">
                ${data.total.toLocaleString('ru')} ₽
            </span>
        </div>
    `;
    goToScreen('screen-success');
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        day:   '2-digit',
        month: '2-digit',
        year:  'numeric'
    });
}

function shakeField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.add('input-error', 'input-shake');
    field.focus();
    setTimeout(() => {
        field.classList.remove('input-error', 'input-shake');
    }, 2500);
}

function showAlert(message) {
    if (tg && tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
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
    function setMinDates() {
    const today    = new Date();
    const yyyy     = today.getFullYear();
    const mm       = String(today.getMonth() + 1).padStart(2, '0');
    const dd       = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`; 

    const checkIn  = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');

    if (!checkIn || !checkOut) return; }

    const checkIn  = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');

    if (!checkIn || !checkOut) return;

    checkIn.min  = todayStr;
    checkOut.min = todayStr;

    // При изменении даты заезда
    checkIn.addEventListener('change', function () {
        // Минимум выезда = дата заезда + 1 день
        const nextDay = new Date(this.value);
        nextDay.setDate(nextDay.getDate() + 1);

        const ny = nextDay.getFullYear();
        const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
        const nd = String(nextDay.getDate()).padStart(2, '0');

        checkOut.min = `${ny}-${nm}-${nd}`;

        // Если выезд раньше нового минимума — сбрасываем
        if (checkOut.value && checkOut.value <= this.value) {
            checkOut.value = '';
            document.getElementById('nights-display').style.display = 'none';
            document.getElementById('total-card').style.display     = 'none';
        }

        calculateTotal();
    });

    checkOut.addEventListener('change', function () {
        calculateTotal();
    });
}

// ========== TELEGRAM THEME ==========
function applyTelegramTheme() {
    try {
        const params = tg.themeParams;
        if (!params) return;

        if (params.bg_color) {
            document.documentElement.style
                .setProperty('--bg', params.bg_color);
        }
        if (params.text_color) {
            document.documentElement.style
                .setProperty('--text-primary', params.text_color);
        }
        if (params.button_color) {
            document.documentElement.style
                .setProperty('--accent', params.button_color);
        }
        if (params.secondary_bg_color) {
            document.documentElement.style
                .setProperty('--bg-card', params.secondary_bg_color);
        }
    } catch(e) {
        console.log('Theme error:', e);
    }
}

// ========== MAIN BUTTON ==========
function setupMainButton() {
    try {
        tg.MainButton.setText('Забронировать');
        tg.MainButton.color     = '#007AFF';
        tg.MainButton.textColor = '#FFFFFF';
        tg.MainButton.hide();

        tg.MainButton.onClick(function () {
            submitBooking();
        });

        tg.BackButton.onClick(function () {
            const active = document.querySelector('.screen.active');
            if (!active || active.id === 'screen-home') return;
            goBack();
        });

    } catch(e) {
        console.log('MainButton error:', e);
    }
}

// ========== ВЫСОТА ЭКРАНА ==========
function fixHeight() {
    const vh = window.innerHeight;

    // Wrapper занимает весь экран минус навбар
    const wrapper = document.querySelector('.screens-wrapper');
    if (wrapper) {
        wrapper.style.height = (vh - 60) + 'px';
    }

    // Каждый экран = высота wrapper
    document.querySelectorAll('.screen').forEach(function (screen) {
        screen.style.height = (vh - 60) + 'px';
    });
}

// ========== СБРОС ФОРМЫ ==========
function resetForm() {
    document.getElementById('guest-name').value  = '';
    document.getElementById('guest-phone').value = '';
    document.getElementById('check-in').value    = '';
    document.getElementById('check-out').value   = '';
    document.getElementById('wishes').value      = '';

    document.getElementById('nights-display').style.display = 'none';
    document.getElementById('total-card').style.display     = 'none';

    state.guests       = 2;
    state.selectedRoom = null;

    const guestsEl = document.getElementById('guests-count');
    if (guestsEl) guestsEl.textContent = '2';

    const roomName = document.getElementById('selected-room-name');
    if (roomName) roomName.textContent = 'Выберите номер';

    const roomPrice = document.getElementById('selected-room-price');
    if (roomPrice) roomPrice.textContent = 'Перейдите во вкладку Номера';
}

// ========== HAPTIC на кнопки ==========
document.addEventListener('click', function (e) {
    if (e.target.closest('button')) {
        haptic('light');
    }
});

// ========== БЛОКИРОВКА ЗУМА ==========
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

document.addEventListener('touchmove', function (e) {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function () {

    // Применяем тему Telegram
    applyTelegramTheme();

    // Настраиваем кнопки Telegram
    setupMainButton();

    // Устанавливаем минимальные даты
    setMinDates();

    // Фиксируем высоту
    fixHeight();

    // Следим за изменением высоты (клавиатура)
    window.addEventListener('resize', function () {
        fixHeight();
    });

    // Telegram viewport changed
    try {
        tg.onEvent('viewportChanged', function () {
            fixHeight();
        });
    } catch(e) {}

    // При возврате на главную — сбрасываем форму
    const homeScreen = document.getElementById('screen-home');
    if (homeScreen) {
        homeScreen.addEventListener('transitionend', function () {
            if (this.classList.contains('active')) {
                // Небольшая задержка чтобы анимация завершилась
                setTimeout(resetForm, 100);
            }
        });
    }

    // Плавное появление приложения
    document.body.style.opacity = '0';
    requestAnimationFrame(function () {
        document.body.style.transition = 'opacity 0.4s ease';
        document.body.style.opacity    = '1';
    });

    console.log('🏖️ Гостевой дом Бриз — Web App загружен!');
});