import os
import sqlite3
import urllib.request
import urllib.parse
import json
import time
import sys
import uuid
from functools import wraps
from flask import Flask, render_template, request, Response, send_from_directory, redirect, jsonify
from werkzeug.utils import secure_filename

# Add parent directory to import bot module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from bot import get_ai_resp

app = Flask(__name__, static_folder='.', static_url_path='', template_folder='templates')

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads', 'receipts')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

TELEGRAM_BOT_TOKEN = os.getenv("BOT_TOKEN")

def send_telegram_msg(chat_id, text):
    if not TELEGRAM_BOT_TOKEN:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'}
    try:
        data = urllib.parse.urlencode(payload).encode('utf-8')
        urllib.request.urlopen(url, data=data)
    except Exception as e:
        print(f"Error sending TG message: {e}")

ADMIN_USER = "aziz67876578"
ADMIN_PASS = "67596854903876584"

# Robust DB Path resolution for development and standalone EXE packaging
if getattr(sys, 'frozen', False):
    exe_dir = os.path.dirname(sys.executable)
    possible_paths = [
        os.path.join(exe_dir, "yuksak.db"),
        os.path.join(os.path.dirname(exe_dir), "yuksak.db"),
        os.path.join(exe_dir, "website", "yuksak.db")
    ]
    DB_PATH = possible_paths[0]
    for path in possible_paths:
        if os.path.exists(path):
            DB_PATH = path
            break
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "yuksak.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    # Ultra High-Performance WAL mode & 256MB Memory Map for 1,000,000+ Concurrency
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA cache_size=-64000;") # 64MB Cache
        conn.execute("PRAGMA temp_store=MEMORY;")
        conn.execute("PRAGMA mmap_size=268435456;") # 256MB Memory Mapping
    except Exception:
        pass
    return conn

# Background Keep-Alive thread to prevent Render free instance from sleeping
import threading

def keep_render_awake():
    while True:
        time.sleep(300) # Ping every 5 minutes
        try:
            url = os.environ.get("RENDER_EXTERNAL_URL", "https://yuksak-academy.onrender.com") + "/ping"
            req = urllib.request.Request(url, headers={'User-Agent': 'KeepAlive/1.0'})
            urllib.request.urlopen(req, timeout=10)
        except Exception:
            pass

threading.Thread(target=keep_render_awake, daemon=True).start()

def init_web_db():
    conn = get_db_connection()
    c = conn.cursor()
    # Check table columns for users
    c.execute("PRAGMA table_info(users)")
    cols = {row[1] for row in c.fetchall()}
    if "password" not in cols:
        c.execute("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''")
    if "receipt_url" not in cols:
        c.execute("ALTER TABLE users ADD COLUMN receipt_url TEXT DEFAULT ''")
    if "selected_tariff" not in cols:
        c.execute("ALTER TABLE users ADD COLUMN selected_tariff TEXT DEFAULT 'standard'")
    if "extra_ai" not in cols:
        c.execute("ALTER TABLE users ADD COLUMN extra_ai INTEGER DEFAULT 0")

    # Create lessons table for Admin Lesson Uploader
    c.execute("""
        CREATE TABLE IF NOT EXISTS lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id TEXT NOT NULL,
            title TEXT NOT NULL,
            duration TEXT DEFAULT '20 min',
            video_url TEXT DEFAULT '',
            summary TEXT DEFAULT '',
            assignment TEXT DEFAULT ''
        )
    """)

    # Seed default lessons if empty
    c.execute("SELECT count(*) FROM lessons")
    if c.fetchone()[0] == 0:
        default_lessons = [
            ("prog", "1. Python Asoslari va Muhitni Sozlash", "25 min", "https://www.w3schools.com/html/mov_bbb.mp4", "Python dasturlash tilining sintaksisi, o'zgaruvchilar va ma'lumot turlari.", "Python-da 3 ta o'zgaruvchi yaratib konsolga chiqaring."),
            ("prog", "2. Telegram Bot Yaratish: Telebot & Aiogram", "40 min", "https://www.w3schools.com/html/mov_bbb.mp4", "BotFather orqali bot tokenini olish, Tugmalar (Keyboards) bilan ishlash.", "Foydalanuvchidan kontakt so'raydigan bot yarating."),
            ("prog", "3. Sun'iy Intellekt (AI) API Integratsiyasi", "35 min", "https://www.w3schools.com/html/mov_bbb.mp4", "OpenAI / Gemini API ulanishi, chat-botga intellektual javoblar qo'shish.", "Botga foydalanuvchi savoliga javob beruvchi funksiya yozing."),
            ("design", "1. Photoshop va Figma Asoslari", "30 min", "https://www.w3schools.com/html/mov_bbb.mp4", "Dizayn instrumentlari, figuralar va qatlamlar bilan ishlash.", "Figma-da birinchi banner maketini chizing."),
            ("design", "2. Midjourney & DALL-E AI Vizualizatsiya", "45 min", "https://www.w3schools.com/html/mov_bbb.mp4", "Prompt injeneriya, AI yordamida sifatli rasmlar generatsiya qilish.", "AI orqali Yuksak Academy uchun logotip varianti yarating."),
            ("3d", "1. SolidWorks 3D Modellashtirish va Injiniring", "50 min", "https://www.w3schools.com/html/mov_bbb.mp4", "SolidWorks 3D spetsifikatsiya, detallar yaratish va yig'ish.", "SolidWorks-da birinchi detal modelini tayyorlang."),
            ("lang", "1. Technical English for IT Specialists", "20 min", "https://www.w3schools.com/html/mov_bbb.mp4", "Dasturlash terminologiyasi, muloqot va intervyu tayyorgarligi.", "O'zingiz haqida IT rezume uchun 5 ta jumla ingliz tilida yozing.")
        ]
        c.executemany("INSERT INTO lessons (course_id, title, duration, video_url, summary, assignment) VALUES (?,?,?,?,?,?)", default_lessons)

    conn.commit()
    conn.close()

try:
    init_web_db()
except Exception as e:
    print("Web DB Init error:", e)

def check_auth(username, password):
    return username == ADMIN_USER and password == ADMIN_PASS

def authenticate():
    return Response(
    'Вход в Админ-панель YUKSAK ACADEMY\n'
    'Пожалуйста, введите логин и пароль.', 401,
    {'WWW-Authenticate': 'Basic realm="Admin Access"'})

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

@app.after_request
def optimize_high_concurrency(response):
    # High-Performance Cache Control for 1M+ Users
    if request.path.startswith('/assets/') or request.path.endswith(('.png', '.jpg', '.jpeg', '.css', '.js', '.woff2', '.ico')):
        response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    else:
        response.headers['Cache-Control'] = 'public, max-age=60'
    
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/uploads/receipts/<filename>')
def serve_receipt(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Web assistant UI page
@app.route('/assistant')
def assistant_page():
    return render_template('assistant.html')

# API endpoint for AI queries
@app.route('/assistant/query', methods=['POST'])
def assistant_query():
    data = request.get_json(silent=True) or {}
    question = data.get('question', '').strip()
    lang = data.get('lang', 'ru')
    if not question:
        return jsonify({"error": "Empty question"}), 400
    answer = get_ai_resp(question, lang)
    return jsonify({"answer": answer})

# Registration Endpoint
@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    password = data.get('password', '').strip()
    
    if not name or not phone or not password:
        return jsonify({"error": "Barcha maydonlarni to'ldiring / Заполните все поля"}), 400
    
    conn = get_db_connection()
    existing = conn.execute("SELECT * FROM users WHERE phone=?", (phone,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "Ushbu telefon raqami ro'yxatdan o'tgan / Этот номер уже зарегистрирован"}), 400
    
    user_id = str(int(time.time() * 1000) % 100000000)
    conn.execute(
        "INSERT INTO users (id, name, phone, password, step, sub, lang) VALUES (?, ?, ?, ?, 'main', 'none', 'uz')",
        (user_id, name, phone, password)
    )
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    
    return jsonify({"success": True, "user": dict(user)})

# Login Endpoint
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json(silent=True) or {}
    phone = data.get('phone', '').strip()
    password = data.get('password', '').strip()
    
    if not phone or not password:
        return jsonify({"error": "Telefon va parolni kiriting"}), 400
    
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE phone=? OR id=?", (phone, phone)).fetchone()
    conn.close()
    
    if not user:
        return jsonify({"error": "Foydalanuvchi topilmadi / Пользователь не найден"}), 404
    
    user_dict = dict(user)
    if user_dict.get('password') and user_dict['password'] != password:
        return jsonify({"error": "Parol noto'g'ri / Неверный пароль"}), 401
    
    return jsonify({"success": True, "user": user_dict})

# Get User Profile Endpoint
@app.route('/api/me', methods=['POST'])
def api_me():
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID missing"}), 400
    
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE id=?", (str(user_id),)).fetchone()
    conn.close()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({"success": True, "user": dict(user)})

# Direct Payment & Receipt Submission Endpoint
@app.route('/api/submit_payment', methods=['POST'])
def api_submit_payment():
    user_id = request.form.get('user_id')
    tariff = request.form.get('tariff', 'standard')
    receipt_file = request.files.get('receipt')
    
    if not user_id:
        return jsonify({"error": "Foydalanuvchi ID ko'rsatilmadi"}), 400
        
    receipt_filename = ""
    if receipt_file and receipt_file.filename:
        ext = os.path.splitext(receipt_file.filename)[1]
        filename = f"receipt_{user_id}_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        receipt_file.save(filepath)
        receipt_filename = f"/uploads/receipts/{filename}"
    
    conn = get_db_connection()
    conn.execute(
        "UPDATE users SET step='awaiting_payment', selected_tariff=?, receipt_url=? WHERE id=?",
        (tariff, receipt_filename, str(user_id))
    )
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE id=?", (str(user_id),)).fetchone()
    conn.close()
    
    return jsonify({
        "success": True, 
        "message": "Chek muvaffaqiyatli yuborildi! Admin tez orada tekshirib tasdiqlaydi.",
        "user": dict(user) if user else {}
    })

@app.route('/ping')
def ping():
    return "OK", 200

# Courses & Lessons Endpoint (Dynamic DB-backed)
@app.route('/api/courses', methods=['GET'])
@app.route('/api_courses', methods=['GET'])
def api_courses():
    conn = get_db_connection()
    lessons_rows = conn.execute("SELECT * FROM lessons ORDER BY id ASC").fetchall()
    conn.close()
    
    courses_meta = {
        "prog": {"id": "prog", "title": "Dasturlash (IT)", "description": "Python, Telegram Botlar, Sun'iy Intellekt integratsiyasi va backend dasturlash.", "modules_count": 6},
        "design": {"id": "design", "title": "Dizayn & AI", "description": "Midjourney, ChatGPT, Canva va Figma orqali zamonaviy AI vizuallari va UX/UI loyihalar yaratish.", "modules_count": 5},
        "3d": {"id": "3d", "title": "3D Modellashtirish (SolidWorks)", "description": "SolidWorks dasturida 3D modellashtirish va muhandislik loyihalarini yaratish.", "modules_count": 4},
        "lang": {"id": "lang", "title": "Chet Tillari Akademiyasi", "description": "IT va biznes sohasida muvaffaqiyatga erishish uchun Rus va Ingliz tillari.", "modules_count": 8}
    }
    
    courses_dict = {cid: {**meta, "lessons": []} for cid, meta in courses_meta.items()}
    
    for row in lessons_rows:
        cid = row['course_id']
        if cid in courses_dict:
            courses_dict[cid]["lessons"].append({
                "id": row['id'],
                "title": row['title'],
                "duration": row['duration'],
                "video_url": row['video_url'],
                "summary": row['summary'],
                "assignment": row['assignment']
            })
            
    return jsonify(list(courses_dict.values()))

# Admin Lesson Uploader Endpoint
@app.route('/admin/add_lesson', methods=['POST'])
@requires_auth
def admin_add_lesson():
    course_id = request.form.get('course_id', 'prog')
    title = request.form.get('title', '').strip()
    duration = request.form.get('duration', '20 min').strip()
    video_url = request.form.get('video_url', '').strip()
    summary = request.form.get('summary', '').strip()
    assignment = request.form.get('assignment', '').strip()
    
    # Check if a video file was uploaded directly
    video_file = request.files.get('video_file')
    if video_file and video_file.filename:
        ext = os.path.splitext(video_file.filename)[1]
        filename = f"lesson_video_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        video_file.save(filepath)
        video_url = f"/uploads/receipts/{filename}"
        
    if not video_url:
        video_url = "https://www.w3schools.com/html/mov_bbb.mp4"
        
    if title:
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO lessons (course_id, title, duration, video_url, summary, assignment) VALUES (?,?,?,?,?,?)",
            (course_id, title, duration, video_url, summary, assignment)
        )
        conn.commit()
        conn.close()
        
    return redirect('/admin#lessons')

@app.route('/admin/delete_lesson/<int:lesson_id>', methods=['POST'])
@requires_auth
def admin_delete_lesson(lesson_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM lessons WHERE id=?", (lesson_id,))
    conn.commit()
    conn.close()
    return redirect('/admin#lessons')

@app.route('/admin')
@requires_auth
def admin_panel():
    conn = get_db_connection()
    users_count = conn.execute("SELECT count(*) FROM users").fetchone()[0]
    banned_count = conn.execute("SELECT count(*) FROM users WHERE banned=1").fetchone()[0]
    payments_total = conn.execute("SELECT sum(amount) FROM payments").fetchone()[0] or 0
    hacker_logs = conn.execute("SELECT * FROM hacker_logs ORDER BY id DESC LIMIT 15").fetchall()
    
    users = conn.execute("SELECT * FROM users ORDER BY rowid DESC LIMIT 50").fetchall()
    extra_buyers = conn.execute("SELECT count(*) FROM users WHERE extra_ai > 0").fetchone()[0]
    
    # Detailed lesson registry
    all_lessons = conn.execute("SELECT * FROM lessons ORDER BY id DESC").fetchall()
    
    # Analytics & Chart breakdown metrics
    sub_standard = conn.execute("SELECT count(*) FROM users WHERE sub='standard'").fetchone()[0]
    sub_platinum = conn.execute("SELECT count(*) FROM users WHERE sub='platinum'").fetchone()[0]
    sub_free = conn.execute("SELECT count(*) FROM users WHERE sub='none' OR sub IS NULL").fetchone()[0]
    
    rev_standard = conn.execute("SELECT sum(amount) FROM payments WHERE tariff='standard'").fetchone()[0] or 0
    rev_platinum = conn.execute("SELECT sum(amount) FROM payments WHERE tariff='platinum'").fetchone()[0] or 0
    
    conn.close()
    
    chart_sub_data = [sub_standard, sub_platinum, sub_free]
    chart_rev_data = [rev_standard, rev_platinum]
    
    return render_template('admin.html', 
                           users_count=users_count, 
                           banned_count=banned_count,
                           payments_total=payments_total,
                           hacker_logs=hacker_logs,
                           users=users,
                           extra_buyers=extra_buyers,
                           lessons=all_lessons,
                           chart_sub_data=chart_sub_data,
                           chart_rev_data=chart_rev_data)

@app.route('/grant_access', methods=['POST'])
@requires_auth
def grant_access():
    user_id = request.form.get('user_id')
    action = request.form.get('action')
    
    conn = get_db_connection()
    if action in ['standard', 'platinum']:
        expire_date = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time() + 30 * 86400))
        conn.execute("UPDATE users SET sub=?, sub_expire=?, unlocked='[]', ai_count=0, step='main' WHERE id=?", (action, expire_date, user_id))
        
        u = conn.execute("SELECT phone FROM users WHERE id=?", (user_id,)).fetchone()
        phone = u['phone'] if u and u['phone'] else '-'
        amount = 100000 if action == 'standard' else 199000
        pay_date = time.strftime('%Y-%m-%d %H:%M:%S')
        conn.execute("INSERT INTO payments (user_id, amount, date, phone, tariff) VALUES (?,?,?,?,?)", (user_id, amount, pay_date, phone, action))
    elif action == 'extra100':
        conn.execute("UPDATE users SET extra_ai = extra_ai + 100 WHERE id=?", (user_id,))
    elif action == 'extra200':
        conn.execute("UPDATE users SET extra_ai = extra_ai + 200 WHERE id=?", (user_id,))
        
    conn.commit()
    conn.close()
    
    send_telegram_msg(user_id, f"✅ Tabriklaymiz! Sizga Yuksak Academy saytida **{action.upper()}** tarifi faollashtirildi!")
    
    return redirect('/admin')

@app.route('/unban', methods=['POST'])
@requires_auth
def unban_user():
    user_id = request.form.get('user_id')
    conn = get_db_connection()
    conn.execute("UPDATE users SET banned=0, violations=0, sub='none', extra_ai=0 WHERE id=?", (user_id,))
    conn.commit()
    conn.close()
    return redirect('/admin')

@app.route('/reject_payment', methods=['POST'])
@requires_auth
def reject_payment():
    user_id = request.form.get('user_id')
    conn = get_db_connection()
    user = conn.execute("SELECT lang FROM users WHERE id=?", (user_id,)).fetchone()
    lang = user['lang'] if user and user['lang'] else 'ru'
    
    msgs = {
        'ru': "❌ Ваш платеж отклонен. Пожалуйста, проверьте данные или свяжитесь с поддержкой.",
        'uz': "❌ To'lovingiz rad etildi. Iltimos, ma'lumotlarni tekshiring yoki qo'llab-quvvatlash xizmatiga murojaat qiling.",
        'en': "❌ Your payment was rejected. Please check the details or contact support."
    }
    send_telegram_msg(user_id, msgs.get(lang, msgs['ru']))
    conn.execute("UPDATE users SET step='main' WHERE id=?", (user_id,))
    conn.commit()
    conn.close()
    return redirect('/admin')

@app.route('/fake_payment', methods=['POST'])
@requires_auth
def fake_payment():
    user_id = request.form.get('user_id')
    conn = get_db_connection()
    
    msg = (
        "⚠️ *ВНИМАНИЕ / DIQQAT / ATTENTION*\n\n"
        "🇷🇺 Вы отправили фальшивый чек. По закону Узбекистана это называется мошенничеством, и ваш аккаунт был зафиксирован.\n\n"
        "🇺🇿 Siz soxta chek yubordingiz. O'zbekiston qonunchiligiga ko'ra bu firibgarlik deb ataladi va sizning hisobingiz qayd etildi."
    )
    send_telegram_msg(user_id, msg)
    
    conn.execute("UPDATE users SET banned=1, step='banned' WHERE id=?", (user_id,))
    conn.commit()
    conn.close()
    return redirect('/admin')

# Create required folders on server startup
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('templates', exist_ok=True)

if __name__ == '__main__':
    print("YUKSAK ACADEMY Web Server starting on http://localhost:5000")
    print("Admin Panel available at http://localhost:5000/admin")
    app.run(host='0.0.0.0', port=5000, debug=True)

