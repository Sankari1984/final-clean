# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import json
import os
import uuid
import sqlite3
from werkzeug.utils import secure_filename
from urllib.parse import unquote
import requests
import smtplib
from email.message import EmailMessage
from email import policy
from datetime import datetime
from time import time
last_comment_time = {}
from uuid import uuid4



with open('config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)
OPENROUTER_API_KEY = config.get("openrouter_api_key", "")
print("🔑 مفتاح OpenRouter:", OPENROUTER_API_KEY)


app = Flask(__name__, template_folder='templates')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
CORS(app)
import os
import json
from flask import request, jsonify

TOKENS_FILE = 'fcm_tokens.json'

# أنشئ الملف إذا ما كان موجود
if not os.path.exists(TOKENS_FILE):
    with open(TOKENS_FILE, 'w', encoding='utf-8') as f:
        json.dump({}, f)

@app.route('/save-token', methods=['POST'])
def save_token():
    data = request.get_json()
    user_id = data.get('user_id')
    token = data.get('token')

    if not user_id or not token:
        return jsonify({"status": "error", "message": "Missing user_id or token"}), 400

    with open(TOKENS_FILE, 'r', encoding='utf-8') as f:
        tokens = json.load(f)

    tokens[user_id] = token

    with open(TOKENS_FILE, 'w', encoding='utf-8') as f:
        json.dump(tokens, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "success", "message": "Token saved ✅"})
import requests

FCM_API_KEY = "AAAAkUu..."  # 🔐 استبدله بمفتاح السيرفر من Firebase console (Server Key)

# 🔁 استبدل دالة send_notification القديمة بالكود التالي في server.py
# ضعه مكان الدالة القديمة مباشرة

from google.oauth2 import service_account
from google.auth.transport.requests import Request as GoogleRequest

def send_fcm_notification(user_id, title, body):
    with open(TOKENS_FILE, 'r', encoding='utf-8') as f:
        tokens = json.load(f)
    token = tokens.get(user_id)
    if not token:
        return

    credentials = service_account.Credentials.from_service_account_file(
        'service_account_key.json',
        scopes=["https://www.googleapis.com/auth/firebase.messaging"]
    )
    credentials.refresh(GoogleRequest())
    access_token = credentials.token

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json; UTF-8',
    }

    payload = {
        "message": {
            "token": token,
            "notification": {
                "title": title,
                "body": body,
            },
            "webpush": {
                "notification": {
                    "icon": "/icon-192.png"
                }
            }
        }
    }

    requests.post(
        "https://fcm.googleapis.com/v1/projects/offer-me-c0c4b/messages:send",
        headers=headers,
        json=payload
    )


@app.route('/send-notification', methods=['POST'])
def send_notification():
    data = request.get_json()
    user_id = data.get('user_id')
    title = data.get('title', '🛎️ إشعار جديد')
    body = data.get('body', '')

    # تحميل التوكن من الملف
    with open(TOKENS_FILE, 'r', encoding='utf-8') as f:
        tokens = json.load(f)

    token = tokens.get(user_id)
    if not token:
        return jsonify({"status": "error", "message": "🚫 لا يوجد توكن لهذا المستخدم"}), 404

    # تحميل بيانات الخدمة من firebase-adminsdk
    credentials = service_account.Credentials.from_service_account_file(
        'service_account_key.json',  # 🔐 تأكد من وجوده بنفس المجلد
        scopes=["https://www.googleapis.com/auth/firebase.messaging"]
    )
    credentials.refresh(GoogleRequest())
    access_token = credentials.token

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json; UTF-8',
    }

    payload = {
        "message": {
            "token": token,
            "notification": {
                "title": title,
                "body": body,
            },
            "android": {
                "notification": {
                    "icon": "ic_notification",
                    "color": "#fbc02d"
                }
            },
            "webpush": {
                "notification": {
                    "icon": "/icon-192.png"
                }
            }
        }
    }

    response = requests.post(
        f"https://fcm.googleapis.com/v1/projects/offer-me-c0c4b/messages:send",
        headers=headers,
        json=payload
    )

    return jsonify({
        "status": "sent" if response.status_code == 200 else "failed",
        "response": response.text
    })


UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'webm', 'mov'}
DATABASE_FILE = 'products_data.json'
USERS_FILE = 'users.json'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'logos'), exist_ok=True)

if not os.path.exists(DATABASE_FILE):
    with open(DATABASE_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users = json.load(f)

    for user in users:
        if user['username'] == username and user['password'] == password:
            settings_file = f"settings_user_{user['user_id']}.json"
            if not os.path.exists(settings_file):
                with open(settings_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        "tabs": ["إلكترونيات", "ملابس", "ألعاب", "عطور"],
                        "phone": "", "instagram": "", "whatsapp": ""
                    }, f, ensure_ascii=False, indent=2)
            return jsonify({"status": "success", "user_id": user['user_id'], "full_name": user['full_name']})
    return jsonify({"status": "fail"}), 401

@app.route('/upload-logo/<user_id>', methods=['POST'])
def upload_logo(user_id):
    file = request.files.get('file')
    if not file or not allowed_file(file.filename):
        return jsonify({"status": "fail", "message": "ملف غير صالح"}), 400

    logo_folder = os.path.join(UPLOAD_FOLDER, 'logos')
    os.makedirs(logo_folder, exist_ok=True)

    for ext in ['png', 'jpg', 'jpeg', 'gif']:
        old_path = os.path.join(logo_folder, f"{user_id}_logo.{ext}")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception as e:
                print(f"تعذر حذف الشعار القديم: {e}")

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = secure_filename(f"{user_id}_logo.{ext}")
    filepath = os.path.join(logo_folder, filename)
    file.save(filepath)
    logo_url = f"/uploads/logos/{filename}"

    settings_file = f"settings_user_{user_id}.json"
    settings = {}
    if os.path.exists(settings_file):
        with open(settings_file, 'r', encoding='utf-8') as f:
            settings = json.load(f)
    settings['logo'] = logo_url
    with open(settings_file, 'w', encoding='utf-8') as f:
        json.dump(settings, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "success", "message": "✅ تم تحديث الشعار", "logo": logo_url})

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(os.path.join(app.root_path, 'uploads'), filename)

@app.route('/settings/<user_id>', methods=['GET', 'POST'])
def manage_settings(user_id):
    settings_file = f"settings_user_{user_id}.json"

    if request.method == 'GET':
        if os.path.exists(settings_file):
            with open(settings_file, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
        return jsonify({"tabs": ["إلكترونيات", "ملابس", "ألعاب", "عطور"]})

    elif request.method == 'POST':
        data = request.get_json()
        tabs = data.get('tabs', [])
        phone = data.get('phone', '')
        instagram = data.get('instagram', '')
        whatsapp = data.get('whatsapp', '')

        if not isinstance(tabs, list) or len(tabs) > 4:
            return jsonify({"status": "fail", "message": "أقصى عدد 4 تصنيفات"}), 400

        settings = {
            "tabs": tabs,
            "phone": phone,
            "instagram": instagram,
            "whatsapp": whatsapp
        }

        with open(settings_file, 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False, indent=2)

        return jsonify({"status": "success", "message": "✅ تم حفظ التصنيفات والمعلومات"})

from time import time  # ضعه في الأعلى إذا مو موجود

products_cache = {
    "data": [],
    "last_updated": 0
}

def get_cached_products():
    now = time()
    if now - products_cache['last_updated'] > 10:  # يحدث التحديث كل 10 ثواني فقط
        with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
            products_cache['data'] = json.load(f)
        products_cache['last_updated'] = now
    return products_cache['data']

products_cache = {"data": [], "last_updated": 0}
from time import time

def get_cached_products():
    now = time()
    if now - products_cache["last_updated"] > 10:
        with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
            products_cache["data"] = json.load(f)
        products_cache["last_updated"] = now
    return products_cache["data"]

@app.route('/products', methods=['GET'])
def get_products():
    return jsonify(get_cached_products())

   
@app.route('/all_products')
def all_products():
    return render_template('all_products.html')
   

@app.route('/login.html')
def login_html(): return render_template('login.html')

@app.route('/store.html')
def store_page():
    user_id = request.args.get('user_id', '')
    highlight = request.args.get('highlight', '')
    return render_template('store.html', user_id=user_id, highlight=highlight)

@app.route('/admin.html')
def admin_page(): return render_template('admin.html')

@app.route('/upload.html')
def upload_page(): return render_template('upload.html')

@app.route('/upload_logo.html')
def upload_logo_page(): return render_template('upload_logo.html')

@app.route('/manage_tabs.html')
def manage_tabs_page(): return render_template('manage_tabs.html')

@app.route('/change_password.html')
def change_password_page(): return render_template('change_password.html')


@app.route('/users', methods=['GET'])
def get_users():
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f))

@app.route('/add-user', methods=['POST'])
def add_user():
    data = request.get_json()

    if not data.get('username') or not data.get('password') or not data.get('full_name'):
        return jsonify({"status": "fail", "message": "الرجاء ملء جميع الحقول"}), 400

    if not data.get('business_type'):
        return jsonify({"status": "fail", "message": "الرجاء اختيار نوع النشاط"}), 400

    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users = json.load(f)

    if any(u['username'] == data['username'] for u in users):
        return jsonify({"status": "fail", "message": "اسم المستخدم موجود مسبقًا"}), 400

    new_user = {
        "user_id": data['username'],
        "username": data['username'],
        "password": data['password'],
        "full_name": data['full_name'],
        "business_type": data['business_type']
    }

    users.append(new_user)

    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=4)

            # ✅ حفظ النشاط الجديد إذا غير موجود مسبقاً
    with open('business_types.json', 'r+', encoding='utf-8') as f:
        business_types = json.load(f)
        if data['business_type'] not in business_types:
            business_types.insert(-1, data['business_type'])  # قبل "أخرى"
            f.seek(0)
            json.dump(business_types, f, ensure_ascii=False, indent=4)
            f.truncate()


    return jsonify({"status": "success", "message": "✅ تم إضافة المستخدم بنجاح"})



def generate_instagram_post(user_name, product_name, description):
    prompt = f"""
اكتب بوست إنستغرام تسويقي مشوّق لمنتج اسمه "{product_name}" ووصفه "{description}".
استخدم 2 إيموجي فقط داخل النص بطريقة جذابة.
لا تذكر اسم الزبون في النص أبداً، فقط أضف هاشتاغ #{user_name} في النهاية.
اجعل البوست قصير، واضح، ويحتوي على كلمات قوية مثل: الآن، حصري، لا تفوّت، الأفضل، اكتشف، جرب.
احرص أن يحتوي على 4 هاشتاغات فقط:
- واحد باسم الزبون: #{user_name}
- واحد ثابت: #قطر
- واثنين آخرين حسب محتوى المنتج.
تجنب التكرار والجمل الطويلة.
البوست مخصص للنسخ والنشر على إنستغرام.
    """

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": "أنت كاتب محتوى تسويقي محترف في إنستغرام."},
            {"role": "user", "content": prompt}
        ]
    }
    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        result = response.json()
        return result['choices'][0]['message']['content'].strip()
    except Exception as e:
        print("فشل في توليد البوست:", e)
        return ""

@app.route('/upload-product', methods=['POST'])
def upload_product():
    user_id = request.form.get('user_id')
    name = request.form.get('name')
    description = request.form.get('description')
    price = request.form.get('price', '')
    file = request.files.get('file')

    if not all([user_id, name , description, file]):
        return jsonify({"status": "fail", "message": "جميع الحقول مطلوبة"}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "fail", "message": "نوع الملف غير مدعوم"}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    file_url = f"/{UPLOAD_FOLDER}/{filename}"

    # جلب اسم الزبون
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users = json.load(f)
    user_name = next((u['full_name'] for u in users if u['user_id'] == user_id), user_id)

    # توليد بوست إنستغرام
    post_text = generate_instagram_post(user_name=user_name.replace(" ", ""), product_name=name, description=description)
    print("📢 تم توليد البوست:", post_text)

    # رجّع الرد فقط دون حفظ المنتج، حتى المستخدم يوافق عليه
    return jsonify({
        "status": "pending",
        "message": "✅ تم توليد البوست. هل ترغب بحفظ المنتج؟",
        "image": file_url,
        "post": post_text,
        "temp_data": {
            "user_id": user_id,
            "name": name,
            "description": description,
            "price": price,
            "image": file_url
        }
    })


@app.route('/delete-product/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    # تحميل المنتجات
    with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)

    # إيجاد المنتج المطلوب حذفه
    product_to_delete = next((p for p in products if p.get("id") == product_id), None)
    if not product_to_delete:
        return jsonify({"status": "fail", "message": "❌ المنتج غير موجود"}), 404

    # حذف صورة المنتج من السيرفر
    image_path = product_to_delete.get('image', '').lstrip('/')
    if os.path.exists(image_path):
        try: os.remove(image_path)
        except: pass

    # حذف المنتج من القائمة
    products = [p for p in products if p.get("id") != product_id]
    with open(DATABASE_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=4)

    # حذف التعليقات الخاصة بهذا المنتج
    try:
        with open('comments.json', 'r', encoding='utf-8') as f:
            comments = json.load(f)
    except:
        comments = {}

    if product_id in comments:
        del comments[product_id]
        with open('comments.json', 'w', encoding='utf-8') as f:
            json.dump(comments, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "success", "message": "✅ تم حذف المنتج وتعليقاته بنجاح"})



@app.route('/delete-user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    user_id = unquote(user_id)

    # حذف المستخدم من ملف users.json
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users = json.load(f)
    users = [u for u in users if u['user_id'] != user_id]
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=4)

    # حذف المنتجات والصور وتعليقاتها
    with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    try:
        with open('comments.json', 'r', encoding='utf-8') as f:
            comments = json.load(f)
    except:
        comments = {}

    updated_products = []
    for p in products:
        if p.get('user_id', '').strip() == user_id.strip():
            # حذف الصورة
            image_path = p.get('image', '').lstrip('/')
            if os.path.exists(image_path):
                try: os.remove(image_path)
                except: pass

            # حذف تعليقات المنتج
            product_id = p.get('id')
            if product_id in comments:
                del comments[product_id]
        else:
            updated_products.append(p)

    # حفظ المنتجات بعد حذف منتجات المستخدم
    with open(DATABASE_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated_products, f, ensure_ascii=False, indent=4)

    # حفظ التعليقات بعد الحذف
    with open('comments.json', 'w', encoding='utf-8') as f:
        json.dump(comments, f, ensure_ascii=False, indent=2)

    # حذف الشعار
    logo_folder = os.path.join(UPLOAD_FOLDER, 'logos')
    for ext in ['png', 'jpg', 'jpeg', 'gif']:
        logo_path = os.path.join(logo_folder, f"{user_id}_logo.{ext}")
        if os.path.exists(logo_path):
            try: os.remove(logo_path)
            except: pass

    # حذف ملف الإعدادات
    settings_file = f"settings_user_{user_id}.json"
    if os.path.exists(settings_file):
        try: os.remove(settings_file)
        except: pass

    return jsonify({"status": "success", "message": "✅ تم حذف المستخدم وكل ملفاته وتعليقاته بنجاح"})


@app.route('/change-password/<user_id>', methods=['POST'])
def change_password(user_id):
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users = json.load(f)
    for user in users:
        if user['user_id'] == user_id:
            if user['password'] == old_password:
                user['password'] = new_password
                with open(USERS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(users, f, ensure_ascii=False, indent=4)
                return jsonify({"status": "success", "message": "✅ تم تغيير كلمة المرور بنجاح"})
            return jsonify({"status": "fail", "message": "❌ كلمة المرور القديمة غير صحيحة"}), 400
    return jsonify({"status": "fail", "message": "❌ المستخدم غير موجود"}), 404

@app.route('/confirm-product', methods=['POST'])
def confirm_product():
    user_id = request.form.get('user_id')
    name = request.form.get('name')
    description = request.form.get('description')
    price = request.form.get('price', '')
    post = request.form.get('post')
    file = request.files.get('file')

    if not all([user_id, name, description, post, file]):
        return jsonify({"status": "fail", "message": "❌ جميع الحقول مطلوبة"}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "fail", "message": "❌ نوع الملف غير مدعوم"}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    file_url = f"/{UPLOAD_FOLDER}/{filename}"

    # ✅ توليد صورة مصغّرة إن كان فيديو
    if ext in ['mp4', 'mov', 'webm']:
        try:
            from moviepy.editor import VideoFileClip
            thumbnail_folder = os.path.join(UPLOAD_FOLDER, 'thumbnails')
            os.makedirs(thumbnail_folder, exist_ok=True)
            thumb_file = os.path.join(thumbnail_folder, f"{user_id}.jpg")
            clip = VideoFileClip(filepath)
            clip.save_frame(thumb_file, t=1.0)
            clip.close()
        except Exception as e:
            print("❌ فشل توليد الصورة المصغرة:", e)

    # ✅ حفظ المنتج
    with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)

    new_product = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": name,
        "description": description,
        "price": price,
        "image": file_url,
        "post": post
    }

    products.append(new_product)

    with open(DATABASE_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=4)

    # ✅ الرد النهائي
    return jsonify({"status": "success", "message": "✅ تم حفظ المنتج بنجاح"})

    

@app.route('/generate-post', methods=['POST'])
def generate_post_api():
    data = request.get_json()
    name = data.get('name')
    desc = data.get('description')
    user_id = data.get('user_id', '').replace(" ", "")
    if not name or not desc or not user_id:
        return jsonify({"status": "fail", "message": "البيانات ناقصة"}), 400
    post = generate_instagram_post(user_name=user_id, product_name=name, description=desc)
    return jsonify({"status": "success", "post": post})

@app.route('/pin-product/<product_id>', methods=['POST'])
def pin_product(product_id):
    with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)

    updated = False
    for product in products:
        if product['id'] == product_id:
            product['pinned'] = True
            updated = True
        else:
            product['pinned'] = False  # نزيل التثبيت عن باقي المنتجات

    if not updated:
        return jsonify({'status': 'error', 'message': 'Product not found'}), 404

    with open(DATABASE_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    return jsonify({'status': 'success', 'message': 'Product pinned successfully'})
@app.route('/likes/<product_id>', methods=['GET'])
def get_likes(product_id):
    conn = sqlite3.connect('likes.db')
    cursor = conn.cursor()
    cursor.execute('SELECT count FROM likes WHERE product_id = ?', (product_id,))
    row = cursor.fetchone()
    conn.close()
    return jsonify({'likes': row[0] if row else 0})
@app.route('/like/<product_id>', methods=['POST'])
def like_product(product_id):
    conn = sqlite3.connect('likes.db')
    cursor = conn.cursor()
    cursor.execute('SELECT count FROM likes WHERE product_id = ?', (product_id,))
    row = cursor.fetchone()

    if row:
        new_count = row[0] + 1
        cursor.execute('UPDATE likes SET count = ? WHERE product_id = ?', (new_count, product_id))
    else:
        new_count = 1
        cursor.execute('INSERT INTO likes (product_id, count) VALUES (?, ?)', (product_id, new_count))

    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'likes': new_count})

@app.route('/comments/<product_id>')
def get_comments(product_id):
    try:
        with open('comments.json', 'r', encoding='utf-8') as f:
            comments = json.load(f)
    except:
        comments = {}
    return jsonify(comments.get(product_id, []))




@app.route('/add_comment', methods=['POST'])
def add_comment():
    user_ip = request.remote_addr
    now = time()
    if user_ip in last_comment_time and now - last_comment_time[user_ip] < 5:
        return jsonify({"success": False, "message": "⏳ الرجاء الانتظار قليلاً قبل إرسال تعليق آخر"}), 429
    last_comment_time[user_ip] = now

    data = request.get_json()
    product_id = data['product_id']
    comment_text = data['comment']

    try:
        with open('comments.json', 'r', encoding='utf-8') as f:
            comments = json.load(f)
    except:
        comments = {}

    new_comment = {
        "id": str(uuid4()),
        "comment": comment_text
    }

    comments.setdefault(product_id, []).append(new_comment)
    with open('comments.json', 'w', encoding='utf-8') as f:
        json.dump(comments, f, ensure_ascii=False, indent=2)

    with open('products_data.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    product = next((p for p in products if p['id'] == product_id), None)

    if product:
        user_id = product.get('user_id')
        product_name = product.get('name', 'منتج بدون اسم')

        try:
            send_fcm_notification(user_id, title="💬 تعليق جديد!", body=f"تمت إضافة تعليق على منتجك: {product_name}")
        except Exception as e:
            print("❌ فشل إرسال الإشعار:", e)

        notif_file = f'notifications_user_{user_id}.json'
        try:
            with open(notif_file, 'r', encoding='utf-8') as f:
                notifications = json.load(f)
        except:
            notifications = []

        notifications.append({
            "product_id": product.get('id'),
            "product_name": product_name,
            "comment": comment_text,
            "timestamp": datetime.now().isoformat()
        })

        with open(notif_file, 'w', encoding='utf-8') as f:
            json.dump(notifications, f, ensure_ascii=False, indent=2)

    return jsonify({'success': True})


@app.route('/notifications/<user_id>')
def get_notifications(user_id):
    file_path = f'notifications_user_{user_id}.json'
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    return jsonify([])  # يرجع قائمة فاضية إذا لا يوجد إشعارات

@app.route('/business-types', methods=['GET'])
def get_business_types():
    with open('business_types.json', 'r', encoding='utf-8') as f:
        types = json.load(f)
    return jsonify(types)
from flask import send_from_directory

@app.route('/firebase-messaging-sw.js')
def serve_firebase_sw():
    return send_from_directory('.', 'firebase-messaging-sw.js')

from email.message import EmailMessage

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

@app.route('/submit-service-request', methods=['POST'])
def submit_service_request():
    data = request.get_json()
    user_id = str(data.get('user_id', 'غير معروف')).strip()
    service_type = str(data.get('type', 'غير محدد')).strip()
    description = str(data.get('desc', '')).replace('\n', '<br>').strip()

    # جلب اسم الزبون من users.json
    full_name = user_id
    try:
        with open('users.json', 'r', encoding='utf-8') as f:
            users = json.load(f)
            user = next((u for u in users if u['user_id'] == user_id), None)
            if user:
                full_name = user.get('full_name', user_id)
    except:
        pass

    # جلب رقم الهاتف والواتساب من settings_user_<user_id>.json
    phone = ""
    whatsapp = ""
    settings_file = f"settings_user_{user_id}.json"
    if os.path.exists(settings_file):
        try:
            with open(settings_file, 'r', encoding='utf-8') as f:
                settings = json.load(f)
                phone = settings.get("phone", "")
                whatsapp = settings.get("whatsapp", "")
        except:
            pass

    # نصوص الإيميل
    clean_description = description.replace('<br>', '\n')
    plain_text = f"""طلب جديد من {full_name}
     المعرف: {user_id}
    رقم الهاتف: {phone}
    رقم الواتساب: {whatsapp}
    نوع الخدمة: {service_type}
    التفاصيل:
    {clean_description}"""
    html_content = f"""<html><body dir="rtl" style="font-family: Arial;">
    <h3>طلب خدمة جديدة</h3>
    <p><strong>👤 الاسم:</strong> {full_name}</p>
    <p><strong>🆔 المعرف:</strong> {user_id}</p>
    <p><strong>📞 رقم الهاتف:</strong> {phone}</p>
    <p><strong>📱 رقم الواتساب:</strong> {whatsapp}</p>
    <p><strong>📌 نوع الخدمة:</strong> {service_type}</p>
    <p><strong>📝 التفاصيل:</strong><br>{description}</p>
    <hr><small>📬 مرسل من منصة Offer ME</small>
    </body></html>"""

    # إعداد الرسالة
    msg = MIMEMultipart("alternative")
    msg['From'] = 'haythamsankari@gmail.com'
    msg['To'] = 'haythamsankari@gmail.com'
    msg['Subject'] = " طلب خدمة جديدة"

    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls()
            smtp.login("haythamsankari@gmail.com", "gcis qmpa gqel ciap")
            smtp.sendmail(msg["From"], msg["To"], msg.as_bytes())
    except Exception as e:
        print("❌ فشل إرسال الإيميل:", e)
        return jsonify({"status": "fail", "message": str(e)}), 500

    return jsonify({"status": "success", "message": "✅ تم إرسال الطلب بنجاح"})

@app.route('/user-settings/<user_id>')
def get_user_settings(user_id):
    file_path = f'settings_user_{user_id}.json'
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    return jsonify({"error": "User settings not found"}), 404

@app.route('/notifications.html')
def notifications_page():
    return render_template('notifications.html')

from flask import jsonify
from datetime import datetime

@app.route('/user-comments/<user_id>')
def get_user_comments(user_id):
    try:
        with open('products_data.json', 'r', encoding='utf-8') as f:
            products = json.load(f)
        with open('comments.json', 'r', encoding='utf-8') as f:
            comments = json.load(f)
    except:
        return jsonify([])

    user_comments = []
    for p in products:
        if p.get("user_id") == user_id:
            product_id = p.get("id")
            product_name = p.get("name", "بدون اسم")
            for c in comments.get(product_id, []):
                user_comments.append({
                    "product_id": product_id,
                    "product_name": product_name,
                    "comment": {
                        "id": c.get("id"),
                        "comment": c.get("comment"),
                        "read": c.get("read", False)
                    }
                })

    return jsonify(user_comments)



@app.route("/mark-comment-read", methods=["POST"])
def mark_comment_read():
    data = request.json
    user_id = data.get("user_id")
    comment_id = data.get("comment_id")

    with open("comments.json", "r", encoding="utf-8") as f:
        comments = json.load(f)

    updated = False
    for product_id, comment_list in comments.items():
        for comment in comment_list:
            if comment.get("id") == comment_id:
                comment["read"] = True
                updated = True
                break

    if updated:
        with open("comments.json", "w", encoding="utf-8") as f:
            json.dump(comments, f, ensure_ascii=False, indent=2)
        return jsonify({"status": "success", "message": "✅ تمت القراءة"})
    else:
        return jsonify({"status": "not_found", "message": "❌ لم يتم العثور على التعليق"})


from flask import render_template

@app.route('/stories.html')
def serve_stories_page():
    return render_template('stories.html')


@app.route('/user-videos/<user_id>')
def user_videos(user_id):
    with open('products_data.json', 'r', encoding='utf-8') as f:
        products = json.load(f)

    videos = []
    for p in products:
        if p.get('user_id') == user_id:
            image = p.get('image', '')
            if image.endswith(('.mp4', '.mov', '.webm')):
                videos.append({
                    "filename": image.lstrip('/')  # نحذف الـ / من البداية حتى /uploads/...
                })

    return jsonify(videos)

@app.route('/save-location', methods=['POST'])
def save_location():
    data = request.get_json()
    user_id = data.get("user_id")
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    # تحميل ملف إعدادات الزبائن
    with open('settings_user.json', 'r+', encoding='utf-8') as f:
        settings = json.load(f)
        if user_id not in settings:
            settings[user_id] = {}
        settings[user_id]['location'] = {
            'lat': latitude,
            'lng': longitude
        }
        f.seek(0)
        json.dump(settings, f, ensure_ascii=False, indent=2)
        f.truncate()

    return jsonify({"message": "✅ تم حفظ موقعك بنجاح"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
