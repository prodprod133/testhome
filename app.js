// ========== TELEGRAM WEB APP INIT ==========
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ========== ДАННЫЕ НОМЕРОВ ==========
const rooms = {
    1: { name: 'Стандарт',      price: 2500,  guests: 2 },
    2: { name: 'Люкс с видом',  price: 4500,  guests: 3 },
    3: { name: 'Семейный',      price: 6000,  guests: 5 }
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
    const next = document.getElementById(screenId);
    if (!next || current === next) return;

    state.prevScreen = current ? current.id : 'screen-home';

    if (current) {
        current.classList.add('slide-out');
        setTimeout(() => {
            current.classList.remove('active', 'slide-out');
        }, 350);
    }

    setTimeout(() => {
        next.classList.add('active');
    }, 50);
}

function goBack() {
    goToScreen(state.prevScreen);
}

// ========== ВЫБОР НОМЕРА ==========
function selectRoom(roomId) {
    state.selectedRoom = roomId;
    const room = rooms[roomId];

    document.getElementById('selected-room-name').textContent = room.name;
    document.getElementById('selected-room-price').textContent =
        `${room.price.toLocaleString('ru')} ₽ / ночь`;

    calculateTotal();
    goToScreen('screen-booking');
}

// ========== СЧЁТЧИК ГОСТЕЙ ==========
function changeGuests(delta) {
    const maxGuests = state.selectedRoom
        ? rooms[state.selectedRoom].guests
        : 10;

    state.guests = Math.max(1, Math.min(maxGuests, state.guests + delta));
    document.getElementById('guests-count').textContent = state.guests;
}

// ========== РАСЧЁТ СТОИМОСТИ ==========
function calculateTotal() {
    const checkIn  = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;

    if (!checkIn || !checkOut || !state.selectedRoom) {
        document.getElementById('nights-display').style.display = 'none';
        document.getElementById('total-card').style.display = 'none';
        return;
    }

    const dateIn  = new Date(checkIn);
    const dateOut = new Date(checkOut);
    const nights  = Math.round((dateOut - dateIn) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
        document.getElementById('nights-display').style.display = 'none';
        document.getElementById('total-card').style.display = 'none';
        return;
    }

    const room  = rooms[state.selectedRoom];
    const total = nights * room.price;

    // Блок с ночами
    const nightsDisplay = document.getElementById('nights-display');
    nightsDisplay.style.display = 'flex';
    document.getElementById('nights-count').textContent =
        `${nights} ${declNights(nights)}`;
    document.getElementById('total-price').textContent =
        `${total.toLocaleString('ru')} ₽`;

    // Итого карточка
    const totalCard = document.getElementById('total-card');
    totalCard.style.display = 'flex';
    document.getElementById('total-room-name').textContent = room.name;
    document.getElementById('total-nights').textContent =
        `${nights} ${declNights(nights)}`;
    document.getElementById('total-amount').textContent =
        `${total.toLocaleString('ru')} ₽`;
}

// Склонение слова "ночь"
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
    const name    = document.getElementById('guest-name').value.trim();
    const phone   = document.getElementById('guest-phone').value.trim();
    const checkIn = document.getElementById('check-in').value;
    const checkOut= document.getElementById('check-out').value;
    const wishes  = document.getElementById('wishes').value.trim();

    // Валидация
    if (!state.selectedRoom) {
        showAlert('Пожалуйста, выберите номер');
        return;
    }
    if (!name) {
        showAlert('Введите ваше имя');
        highlight('guest-name');
        return;
    }
    if (!phone) {
        showAlert('Введите номер телефона');
        highlight('guest-phone');
        return;
    }
    if (!checkIn || !checkOut) {
        showAlert('Выберите даты заезда и выезда');
        return;
    }

    const dateIn  = new Date(checkIn);
    const dateOut = new Date(checkOut);
    const nights  = Math.round((dateOut - dateIn) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
        showAlert('Дата выезда должна быть позже даты заезда');
        return;
    }

    const room  = rooms[state.selectedRoom];
    const total = nights * room.price;

    // Формируем данные для бота
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

    // Отправка в Telegram
    tg.sendData(JSON.stringify(bookingData));

    // Показываем экран успеха
    showSuccess(bookingData);
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
        <div class="success-row"
                <div class="success-row" style="padding-top:12px;
             border-top:1px solid var(--border);margin-top:4px">
            <span style="font-weight:700;color:var(--text-primary)">
                Итого
            </span>
            <span style="font-weight:700;color:var(--accent);font-size:18px">
                ${data.total.toLocaleString('ru')} ₽
            </span>
        </div>
    `;
    goToScreen('screen-success');
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Форматирование даты
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        day:   '2-digit',
        month: '2-digit',
        year:  'numeric'
    });
}

// Подсветка ошибки поля
function highlight(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.style.borderColor = '#FF3B30';
    field.style.background  = 'rgba(255,59,48,0.05)';
    field.focus();
    setTimeout(() => {
        field.style.borderColor = 'transparent';
        field.style.background  = 'var(--bg)';
    }, 2500);
}

// Алерт через Telegram или обычный
function showAlert(message) {
    if (tg && tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

// ========== УСТАНОВКА МИНИМАЛЬНЫХ ДАТ ==========
function setMinDates() {
    const today = new Date();
    const yyyy  = today.getFullYear();
    const mm    = String(today.getMonth() + 1).padStart(2, '0');
    const dd    = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const checkIn  = document.getElementById('check-in');
    const checkOut = document.getElementById('check-out');

    checkIn.min  = todayStr;
    checkOut.min = todayStr;

    // При выборе заезда — обновляем минимум выезда
    checkIn.addEventListener('change', function () {
        checkOut.min   = this.value;
        // Если выезд раньше заезда — сбрасываем
        if (checkOut.value && checkOut.value <= this.value) {
            checkOut.value = '';
            document.getElementById('nights-display').style.display = 'none';
            document.getElementById('total-card').style.display     = 'none';
        }
        calculateTotal();
    });
}

// ========== HAPTIC FEEDBACK ==========
function haptic(type = 'light') {
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred(type);
    }
}

// Добавляем haptic на все кнопки
document.addEventListener('click', function (e) {
    if (e.target.closest('button') || e.target.closest('.room-card')) {
        haptic('light');
    }
});

// ========== TELEGRAM THEME SUPPORT ==========
function applyTelegramTheme() {
    if (!tg.themeParams) return;

    const params = tg.themeParams;

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
}

// ========== MAIN BUTTON TELEGRAM ==========
function setupMainButton() {
    tg.MainButton.setText('Забронировать');
    tg.MainButton.color   = '#007AFF';
    tg.MainButton.textColor = '#FFFFFF';

    // Показываем кнопку только на экране бронирования
    tg.MainButton.onClick(function () {
        submitBooking();
    });
}

// ========== НАБЛЮДАТЕЛЬ ЗА ЭКРАНАМИ ==========
// Показываем/скрываем MainButton в зависимости от экрана
const screenObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes' &&
            mutation.attributeName === 'class') {

            const target = mutation.target;

            if (target.id === 'screen-booking' &&
                target.classList.contains('active')) {
                tg.MainButton.show();
            } else if (target.id === 'screen-booking' &&
                !target.classList.contains('active')) {
                tg.MainButton.hide();
            }
        }
    });
});

// Подключаем наблюдатель ко всем экранам
document.querySelectorAll('.screen').forEach(function (screen) {
    screenObserver.observe(screen, { attributes: true });
});

// ========== BACK BUTTON TELEGRAM ==========
tg.BackButton.onClick(function () {
    const active = document.querySelector('.screen.active');
    if (active && active.id !== 'screen-home') {
        goBack();
        // Скрываем кнопку назад на главной
        const willBeHome = state.prevScreen === 'screen-home';
        if (willBeHome) tg.BackButton.hide();
    }
});

// Показываем BackButton когда уходим с главной
document.querySelectorAll('.screen').forEach(function (screen) {
    screen.addEventListener('transitionend', function () {
        const active = document.querySelector('.screen.active');
        if (!active) return;
        if (active.id === 'screen-home' || 
            active.id === 'screen-success') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    });
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function () {
    setMinDates();
    applyTelegramTheme();
    setupMainButton();

    // Плавное появление приложения
    document.body.style.opacity = '0';
    setTimeout(function () {
        document.body.style.transition = 'opacity 0.3s ease';
        document.body.style.opacity    = '1';
    }, 100);

    console.log('🏖️ Гостевой дом Бриз — Web App загружен');
});