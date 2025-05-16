import sqlite3

# الاتصال بقاعدة البيانات
conn = sqlite3.connect("likes.db")
cursor = conn.cursor()

# التحقق من وجود جدول likes
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='likes';")
result = cursor.fetchone()

if result:
    print("✅ جدول 'likes' موجود داخل قاعدة البيانات.")
else:
    print("❌ جدول 'likes' غير موجود، تحتاج إلى إنشائه.")

conn.close()
