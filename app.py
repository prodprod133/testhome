import streamlit as st
import datetime


# ---------- НАСТРОЙКИ ----------
st.set_page_config(page_title="Запись в стоматологию", page_icon="🦷")

WHATSAPP_NUMBER = "79991234567"  # номер администратора без + и без пробелов

# ---------- ЦЕНЫ НА УСЛУГИ ----------
prices = {
    "Консультация": 0,
    "Лечение кариеса": 3500,
    "Удаление зуба": 2500,
    "Чистка зубов (гигиена)": 4000,
    "Установка пломбы": 3000,
    "Отбеливание": 12000,
    "Протезирование": 20000,
}

# ---------- ШАПКА ----------
st.title("🦷 Стоматология «Улыбка»")
st.subheader("Онлайн-запись на приём")
st.write("Выберите услугу, удобное время и узнайте примерную стоимость за 1 минуту.")

st.divider()

# ---------- ВЫБОР УСЛУГИ ----------
service = st.selectbox("Что вас беспокоит?", list(prices.keys()))

# ---------- ДЕТАЛИ ----------
tooth = st.radio("Какой зуб беспокоит?", ["Верхний", "Нижний", "Не знаю"])
count = st.selectbox("Сколько зубов?", [1, 2, 3])

# ---------- РАСЧЁТ ЦЕНЫ ----------
base_price = prices[service]
total_price = base_price * count

st.divider()

if base_price == 0:
    st.info("💰 Консультация — бесплатно")
else:
    st.success(f"💰 Примерная стоимость: {total_price} ₽")
    st.caption("* Точная цена определяется на приёме врача")

st.divider()

# ---------- ДАТА И ВРЕМЯ ----------
date = st.date_input("Выберите дату", datetime.date.today())
time = st.selectbox("Выберите время", [
    "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00"
])

# ---------- КОНТАКТЫ ----------
name = st.text_input("Ваше имя")
phone = st.text_input("Ваш телефон")

st.divider()

# ---------- ОТПРАВКА ----------
if st.button("✅ Записаться на приём"):
    if name and phone:
        st.success(f"Спасибо, {name}! Ваша заявка принята.")
        st.write("Администратор свяжется с вами для подтверждения.")

        # Текст для WhatsApp
        message = (
            f"Новая заявка:%0A"
            f"Имя: {name}%0A"
            f"Телефон: {phone}%0A"
            f"Услуга: {service}%0A"
            f"Зуб: {tooth}%0A"
            f"Кол-во: {count}%0A"
            f"Дата: {date}%0A"
            f"Время: {time}%0A"
            f"Цена: {total_price} ₽"
        )

        wa_link = f"https://wa.me/{WHATSAPP_NUMBER}?text={message}"

        st.markdown(f"[💬 Отправить заявку в WhatsApp]({wa_link})")
    else:
        st.error("Пожалуйста, заполните имя и телефон.")