<div align="center">

# 🎓 Ahmad Foundation — MCQ Test Portal

**A full-stack online MCQ practice platform for tuition students.**  
Built with Next.js 15, MongoDB, and Tailwind CSS.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [How It Works](#-how-it-works)
- [Admin Panel](#-admin-panel)
- [Security](#-security)
- [License](#-license)

---

## 🌟 Overview

Ahmad Foundation MCQ Portal is a secure, full-stack web application that allows tuition students to practice MCQ-based mock exams online. Students can unlock classes via coupon codes or WhatsApp, then take timed tests with instant scoring.

---

## ✨ Features

### 👨‍🎓 Student Portal
- 🔐 Secure registration & login (custom PBKDF2 session auth)
- 🏫 Class access via **coupon code** or **WhatsApp request**
- 📚 Cascading subject → test selection
- ⏱️ Timed MCQ exams with live progress bar
- 📊 Instant scorecard with percentage gauge
- 📈 Test history dashboard
- 🔒 Sequential test unlocking (complete Test 1 to unlock Test 2)
- 🛡️ Anti-cheat: server-side scoring, copy/paste disabled during exam

### 🛠️ Admin Panel
- 📦 Manage classes, subjects, and tests
- ➕ Add MCQs one-by-one or via **bulk JSON upload**
- 🎟️ Generate & manage coupon codes per class
- ✅ Approve/reject student access requests
- 📋 View all test submissions with scores

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Frontend | React 19, Tailwind CSS 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | Custom PBKDF2 + HMAC-SHA256 session tokens |
| Password Hashing | bcryptjs (coupons) |
| Testing | Jest + MongoDB Memory Server |

---

## 📁 Project Structure

```
├── app/
│   ├── admin/          # Admin panel pages
│   ├── api/            # All API route handlers
│   │   ├── admin/      # Admin-only APIs
│   │   ├── auth/       # Login, logout, register, me
│   │   ├── user/       # Student APIs (classes, subjects, tests, MCQs)
│   │   └── tests/      # Submit & result APIs
│   ├── user/           # Student portal pages
│   └── (root)/         # Landing, login, register pages
├── components/         # Reusable UI components
├── lib/                # Utilities (auth, mongodb, coupon-code, rate-limit)
├── models/             # Mongoose models
└── public/             # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ahmad-foundation-mcq.git
cd ahmad-foundation-mcq
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local` (see [Environment Variables](#-environment-variables) below).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB connection string
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mcq_quiz_db

# Secret key for signing session tokens (use a long random string)
SESSION_SECRET=your-super-secret-key-here

# Admin credentials (set once, used to seed the admin account)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-admin-password

# WhatsApp group or chat link shown to students for class access
NEXT_PUBLIC_WHATSAPP_GROUP_URL=https://chat.whatsapp.com/YourGroupInviteCode
```

> ⚠️ **Never commit `.env.local` or any `.env` file to Git.**

---

## ⚙️ How It Works

```
Student registers → Selects class → Unlocks via coupon or WhatsApp
       ↓
Selects subject → Selects test → Chooses exam mode (Standard / Full)
       ↓
Takes timed MCQ exam → Submits → Server scores answers
       ↓
Instant scorecard → History saved to dashboard
```

### Class Access Flow

| Method | How |
|---|---|
| **Coupon Code** | Admin generates codes → Student enters code → Instant unlock |
| **WhatsApp** | Student contacts teacher → Admin approves from panel |

### Sequential Test Unlocking

Tests within a subject are locked sequentially. A student must **complete Test 1** before Test 2 becomes available. This is enforced on both the frontend and backend.

---

## 🛠️ Admin Panel

Access the admin panel at `/admin/login` using the credentials set in your environment variables.

| Page | Path | Description |
|---|---|---|
| Dashboard | `/admin/dashboard` | Stats overview |
| Classes | `/admin/classes` | Add / delete grade levels |
| Subjects | `/admin/subjects` | Add subjects per class |
| Tests | `/admin/tests` | Add tests per subject |
| MCQ Bank | `/admin/mcqs` | Browse, edit, delete MCQs |
| Add MCQs | `/admin/mcqs/add` | Single form or bulk JSON upload |
| Coupons | `/admin/access-requests` | Generate & manage coupon codes |
| Submissions | `/admin/registrations` | View all student test results |

---

## 🔒 Security

- ✅ Passwords hashed with **PBKDF2 (SHA-512, 1000 iterations)**
- ✅ Session tokens signed with **HMAC-SHA256**, 7-day expiry
- ✅ `correctAnswer` field **never sent to the client** — scoring is 100% server-side
- ✅ Coupon codes stored as **bcrypt hashes**, never in plaintext
- ✅ Sequential test access enforced **server-side**
- ✅ Rate limiting on login (5/min) and test submission (3/min)
- ✅ Copy/paste, right-click, and DevTools shortcuts disabled during exams

---

## 📄 License

This project is private and proprietary.  
© 2026 Ahmad Foundation. All rights reserved.
