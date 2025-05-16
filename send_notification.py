import json
import requests
import firebase_admin
from firebase_admin import credentials, messaging

# تحميل ملف الخدمة
cred = credentials.Certificate("service_account_key.json")
firebase_admin.initialize_app(cred)

# تحميل التوكن من الملف
with open('fcm_tokens.json', 'r', encoding='utf-8') as f:
    tokens = json.load(f)

# اختَر التوكن تبع زبون (مثال: haytham)
token = tokens.get("haytham")

if not token:
    print("❌ لم يتم العثور على التوكن")
    exit()

# إعداد رسالة الإشعار
message = messaging.Message(
    notification=messaging.Notification(
        title="🛍️ منتج جديد!",
        body="تم إضافة منتج جديد في متجرك 🎉"
    ),
    token=token
)

# إرسال الإشعار
response = messaging.send(message)
print("✅ تم الإرسال بنجاح! ID:", response)
