import sqlite3

# إنشاء الاتصال بقاعدة البيانات
conn = sqlite3.connect('likes.db')
cursor = conn.cursor()

# إنشاء جدول الإعجابات إذا لم يكن موجوداً
cursor.execute('''
CREATE TABLE IF NOT EXISTS likes (
    product_id TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0
)
''')

conn.commit()
conn.close()

print("✅ تم إنشاء جدول likes داخل قاعدة البيانات likes.db")
