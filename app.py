import streamlit as st
import datetime
import urllib3
import smtplib
from email.mime.text import MIMEText
from gigachat import GigaChat

# Убираем предупреждения SSL
urllib3.disable_warnings()

# ================== НАСТРОЙКИ ==================
st.set_page_config(page_title="Стоматология «Улыбка»", page_icon="🦷")

GIGACHAT_API_KEY = st.secrets["GIGACHAT_API_KEY"]
EMAIL_ADDRESS = st.secrets["EMAIL_ADDRESS"]
EMAIL_PASSWORD = st.secrets["EMAIL_PASSWORD"]

# ================== ЦЕНЫ ==================
prices = {
    "Консультация": 0,
    "Лечение кариеса": 3500,
    "Удаление зуба": 2500,
    "Чистка зубов (гигиена)": 4000,
    "Установка пломбы": 3000,
    "Отбеливание": 12000,
    "Протезирование": 20000,
}

# ================== ФУНКЦИЯ ОТПРАВКИ ПИСЬМА ==================
def send_email(name, phone, service, tooth, count, date, time, total_price):
    text = (
        f"🦷 Новая заявка с сайта!\n\n"
        f"Имя: {name}\n"
        f"Телефон: {phone}\n"
        f"Услуга: {service}\n"
        f"Зуб: {tooth}\n"
        f"Количество: {count}\n"
        f"Дата: {date}\n"
        f"Время: {time}\n"
        f"Примерная цена: {total_price} ₽"
    )

    msg = MIMEText(text)
    msg["Subject"] = "Новая заявка — Стоматология «Улыбка»"
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = EMAIL_ADDRESS  # заявка приходит себе же

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)

# ================== ШАПКА ==================
st.title("🦷 Стоматология «Улыбка»")
st.subheader("Онлайн-запись на приём")
st.write("Выберите услугу, удобное время и узнайте примерную стоимость за 1 минуту.")

st.divider()

# ================== ВЫБОР УСЛУГИ ==================
service = st.selectbox("Что вас беспокоит?", list(prices.keys()))
tooth = st.radio("Какой зуб беспокоит?", ["Верхний", "Нижний", "Не знаю"])
count = st.selectbox("Сколько зубов?", [1, 2, 3])

# ================== РАСЧЁТ ЦЕНЫ ==================
base_price = prices[service]
total_price = base_price * count

st.divider()

if base_price == 0:
    st.info("💰 Консультация — бесплатно")
else:
    st.success(f"💰 Примерная стоимость: {total_price} ₽")
    st.caption("* Точная цена определяется на приёме врача")

st.divider()

# ================== ДАТА И ВРЕМЯ ==================
date = st.date_input("Выберите дату", datetime.date.today())
time = st.selectbox("Выберите время", [
    "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00"
])

# ================== КОНТАКТЫ ==================
name = st.text_input("Ваше имя")
phone = st.text_input("Ваш телефон")

st.divider()

# ================== ОТПРАВКА ЗАЯВКИ НА ПОЧТУ ==================
if st.button("✅ Записаться на приём"):
    if name and phone:
        try:
            send_email(name, phone, service, tooth, count, date, time, total_price)
            st.success(f"Спасибо, {name}! Ваша заявка отправлена. ✅")
            st.write("Администратор свяжется с вами для подтверждения.")
        except Exception as e:
            st.error(f"Не удалось отправить заявку. Ошибка: {e}")
    else:
        st.error("Пожалуйста, заполните имя и телефон.")

st.divider()

# ================== ИИ-КОНСУЛЬТАНТ ==================
st.subheader("💬 ИИ-консультант")
st.write("Задайте вопрос об услугах, ценах или лечении.")

if "messages" not in st.session_state:
    st.session_state.messages = []

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.write(msg["text"])

def ask_gigachat(question):
    system_prompt = (
        "Ты вежливый консультант стоматологической клиники «Улыбка». "
        "Отвечай кратко и понятно. Помогай с вопросами об услугах и ценах. "
        "Не ставь диагнозы. Мягко советуй записаться на приём к врачу."
    )
    with GigaChat(credentials=GIGACHAT_API_KEY, verify_ssl_certs=False) as giga:
        response = giga.chat(f"{system_prompt}\n\nВопрос пациента: {question}")
        return response.choices[0].message.content

user_input = st.chat_input("Напишите ваш вопрос...")

if user_input:
    st.session_state.messages.append({"role": "user", "text": user_input})
    try:
        answer = ask_gigachat(user_input)
    except Exception as e:
        answer = f"Извините, не могу ответить. Ошибка: {e}"
    st.session_state.messages.append({"role": "assistant", "text": answer})
    st.rerun()
