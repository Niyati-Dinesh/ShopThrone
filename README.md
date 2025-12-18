# <img src="frontend/public/logo.png" height="40px" width="40px"> ShopThrone: AI-Powered E-Commerce Aggregator

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Backend-Python-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![AI](https://img.shields.io/badge/AI-Vision%20Transformer-FF6F00?logo=pytorch&logoColor=white)](https://huggingface.co/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Real-time price comparison engine featuring AI-powered visual search.** > *Developed as part of the Infosys Springboard Internship.*

---

## 📖 Overview

**ShopThrone** is an advanced e-commerce aggregator designed to solve the problem of manual price checking across multiple platforms. Unlike static aggregators, ShopThrone uses **real-time scraping** to fetch live data from giants like Amazon and Flipkart, ensuring users always see the current price.

The standout feature is the **AI Visual Search**, integrated using a **Vision Transformer (ViT)** model. This allows users to upload an image of a product (e.g., a specific sneaker or gadget) and instantly find purchase links across platforms with **90% accuracy**.

---

## 🚀 Key Features

### 🔍 Real-Time Data Aggregation
- **Cross-Platform Scraping:** utilizes **Selenium** and **Beautiful Soup** to scrape pricing and stock status from Amazon, Flipkart, Snapdeal, Croma, Reliance Digital, and Ajio in real-time.
- **Performance Optimized:** Engineered data pipelines that reduced data retrieval latency by **40%**, ensuring a lag-free user experience.

### 🧠 AI Visual Search
- **Vision Transformer (ViT):** Integrated a pre-trained ViT model to classify and identify products from user-uploaded images.
- **High Speed:** Optimized inference time to process images in **under 2 seconds**.
- **Accuracy:** Achieved **90% accuracy** in product identification during testing.

### 📊 Admin & User Dashboards
- **React-Based UI:** A minimalist, high-performance interface built with **React.js** and **Tailwind CSS**.
- **Analytics:** Comprehensive admin dashboard to visualize search trends, user growth, and platform traffic.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Vite |
| **Backend** | Python (Flask/Django), Node.js |
| **Scraping** | Selenium, Beautiful Soup, Playwright |
| **AI / ML** | PyTorch, Vision Transformer (ViT), Hugging Face |
| **Tools** | Git, Postman, Docker |

---

## 📸 Screenshots


| Landing Page | How it Works |
| :---: | :---: |
| <img src="/frontend/public/Screenshot (567).png"> | <img src="/frontend/public/work.png"> |


| Product comparison | Profile |
| :---: | :---: |
| <img src="/frontend/public/prices.png"> | <img src="/frontend/public/profile.png"> |

| Admin Analytics | Admin Settings |
| :---: | :---: |
| <img src="/frontend/public/admin.png"> | <img src="/frontend/public/settings.png"> |
---

## ⚙️ Installation & Setup

Prerequisites: `Python 3.8+`, `Node.js 16+`, `Google Chrome` (for Selenium).

### 1. Clone the Repository
```bash
git clone https://github.com/Niyati-Dinesh/ShopThrone.git
cd ShopThrone
```

### 2. Setup Frontend
```bash
cd frontend
npm install
```

### 3. Go back to root, then into Backend
```bash
cd ../backend 
python -m venv venv
```

### 4. Activate venv (Windows)
```bash .\venv\Scripts\activate 
# OR Mac/Linux:
source venv/bin/activate
```

### 5. Install backend requirements
```bash
pip install -r requirements.txt
```

### 6. Setup .env
```bash
# Database
DATABASE_URL=

#Admin credentials
ADMIN_EMAIL =
ADMIN_PASSWORD =
ADMIN_SECRET_KEY =

# JWT Authentication
SECRET_KEY=
ALGORITHM=
ACCESS_TOKEN_EXPIRE_MINUTES=

#SMPT CONFIG
SMTP_SERVER = 
SMTP_PORT= 
SMTP_USERNAME = # Your Gmail
SMTP_PASSWORD = 

```

### 7. Run Backend
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 5555
```
