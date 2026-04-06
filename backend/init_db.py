#!/usr/bin/env python3
"""
Run this ONCE after schema.sql has been loaded:
  python init_db.py
Creates the default admin and customer users.
"""
import os
import sys
from dotenv import load_dotenv
load_dotenv()

import pymysql
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "root")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "insurance_db")

conn = pymysql.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, database=DB_NAME)
cur  = conn.cursor()

users = [
    ("admin",   "admin123",   "admin",    None),
    ("avleen",  "user123",    "customer", 1),
    ("rishab",  "user123",    "customer", 2),
    ("daksh",   "user123",    "customer", 3),
    ("priya",   "user123",    "customer", 4),
    ("arjun",   "user123",    "customer", 5),
]

for username, password, role, customer_id in users:
    hashed = pwd.hash(password)
    cur.execute(
        "INSERT IGNORE INTO users (username, password_hash, role, customer_id) VALUES (%s, %s, %s, %s)",
        (username, hashed, role, customer_id)
    )
    print(f"  ✓ Created user: {username} ({role})")

conn.commit()
cur.close()
conn.close()
print("\nDone! Default credentials:")
print("  Admin  → username: admin   password: admin123")
print("  Users  → username: avleen/rishab/daksh/priya/arjun   password: user123")
