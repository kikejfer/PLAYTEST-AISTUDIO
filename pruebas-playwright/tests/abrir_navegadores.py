from selenium import webdriver
import subprocess
import time

# URL a abrir
url = "https://playtest-frontend.onrender.com"

browsers = []

# Chrome
try:
    browsers.append(webdriver.Chrome())
except Exception as e:
    print("⚠️ No se pudo abrir Chrome:", e)

# Firefox
try:
    browsers.append(webdriver.Firefox())
except Exception as e:
    print("⚠️ No se pudo abrir Firefox:", e)

# Edge
try:
    browsers.append(webdriver.Edge())
except Exception as e:
    print("⚠️ No se pudo abrir Edge:", e)

# Abrir URL en los navegadores que funcionen
for driver in browsers:
    driver.get(url)

# --- Programas ---
programas = [
    r"C:\Users\kikej\AppData\Local\Programs\Microsoft VS Code\Code.exe",
    r"C:\Program Files\PostgreSQL\17\pgAdmin 4\runtime\pgAdmin4.exe"
]

for prog in programas:
    try:
        subprocess.Popen(prog)
    except Exception as e:
        print(f"⚠️ No se pudo abrir {prog}: {e}")

# Mantener navegadores abiertos 15 seg.
time.sleep(15)

# Cerrar navegadores
for driver in browsers:
    driver.quit()
