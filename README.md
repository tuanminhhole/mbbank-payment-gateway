<div align="center">

# MBBank Payment Gateway

**Production-Ready Payment Integration for MB Bank (Vietnam)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](#-docker)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)

A self-hosted payment gateway built on top of MB Bank's unofficial API.  
Handles the full payment lifecycle: **create transaction → generate QR → detect incoming transfer → reconcile → confirm → webhook callback**.

---

<a href="#-mục-lục">
  <img src="https://flagcdn.com/28x21/vn.png" width="28" height="21" alt="Vietnam" />&nbsp;<strong>Tiếng Việt</strong>
</a>&emsp;|&emsp;
<a href="#-table-of-contents">
  <img src="https://flagcdn.com/28x21/gb.png" width="28" height="21" alt="English" />&nbsp;<strong>English</strong>
</a>

</div>

---

<!-- ==================== VIETNAMESE ==================== -->

## 📑 Mục Lục

- [So Sánh](#-so-sánh-với-các-thư-viện-hiện-có)
- [Tính Năng](#-tính-năng)
- [Kiến Trúc](#️-kiến-trúc)
- [Bắt Đầu](#-bắt-đầu)
- [API Reference](#-api-reference)
- [Session Management](#-session-management)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Disclaimer / Tuyên Bố Miễn Trừ](#️-disclaimer--tuyên-bố-miễn-trừ-trách-nhiệm)
- [Credits](#-credits)

---

## 🔍 So Sánh Với Các Thư Viện Hiện Có

Dự án này được xây dựng dựa trên thư viện [`mbbank`](https://github.com/CookieGMVN/MBBank) của CookieGMVN và lấy cảm hứng từ [MBBank Python](https://github.com/thedtvn/MBBank) của thedtvn.

| Tính năng | [CookieGMVN/MBBank](https://github.com/CookieGMVN/MBBank) | [thedtvn/MBBank](https://github.com/thedtvn/MBBank) | **Repo này** |
|:---|:---:|:---:|:---:|
| Ngôn ngữ | Node.js (TS) | Python | Node.js (Express) |
| Login + Captcha OCR | ✅ | ✅ | ✅ |
| Lấy số dư | ✅ | ✅ | ✅ |
| Lịch sử giao dịch | ✅ | ✅ | ✅ |
| Chuyển tiền | ❌ | ✅ | ❌ |
| **Docker deployment** | ❌ | ❌ | ✅ |
| **Session keep-alive** | ❌ | ❌ | ✅ |
| **API endpoint patching** | ❌ | ❌ | ✅ |
| **Đối soát giao dịch** | ❌ | ❌ | ✅ |
| **VietQR integration** | ❌ | ❌ | ✅ |
| **Webhook architecture** | ❌ | ❌ | ✅ |
| **Payment gateway API** | ❌ | ❌ | ✅ |

> **Tóm lại:** CookieGMVN và thedtvn cung cấp *thư viện raw* để gọi API. Repo này cung cấp **hệ thống thanh toán hoàn chỉnh** sẵn sàng production.

---

## ✨ Tính Năng

| | Tính năng | Mô tả |
|:--|:--|:--|
| 🔐 | **Login tự động** | Đăng nhập MB Bank Internet Banking với giải captcha OCR |
| 🔄 | **Session keep-alive** | Tự động ping để giữ session, re-login khi hết hạn |
| 🔧 | **API Patching** | Tự động patch endpoint khi MB Bank thay đổi API |
| 💳 | **Payment Gateway** | REST API tạo giao dịch thanh toán hoàn chỉnh |
| 📊 | **Đối soát tự động** | Match giao dịch theo payment note + số tiền |
| 📱 | **VietQR** | Tạo mã QR thanh toán động theo chuẩn VietQR |
| 🐳 | **Docker** | Dockerfile sẵn sàng deploy |

---

## 🏗️ Kiến Trúc

```
┌──────────────────────────────────────────────────┐
│            Payment Gateway Server                │
│                                                  │
│   ┌──────────┐  ┌───────────┐  ┌─────────────┐  │
│   │  Login   │  │  Session  │  │   Recon-    │  │
│   │  + OCR   │  │  Keeper   │  │  ciliation  │  │
│   └────┬─────┘  └─────┬─────┘  └──────┬──────┘  │
│        │               │               │         │
│   ┌────▼───────────────▼───────────────▼──────┐  │
│   │          MB Bank API Client               │  │
│   │   (login · getBalance · getHistory)       │  │
│   └───────────────────────────────────────────┘  │
│                                                  │
│   ┌───────────────────────────────────────────┐  │
│   │  REST API (Express)                       │  │
│   │  POST /api/transactions                   │  │
│   │  GET  /api/transactions/:tx_id            │  │
│   │  GET  /api/health                         │  │
│   └───────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## 🚀 Bắt Đầu

### Yêu cầu

- **Node.js** ≥ 18
- **npm** ≥ 9
- Tài khoản **MB Bank Internet Banking**

### 1. Clone & cài đặt

```bash
git clone https://github.com/tuanminhhole/mbbank-payment-gateway.git
cd mbbank-payment-gateway
cp .env.example .env
npm install
```

### 2. Cấu hình

Chỉnh sửa file `.env`:

```env
# === MB Bank Credentials ===
MB_USERNAME=your_mb_username
MB_PASSWORD=your_mb_password
MB_ACCOUNT_NUMBER=your_account_number
```

> Xem [`.env.example`](.env.example) để biết toàn bộ biến cấu hình.

### 3. Chạy

```bash
# Development
node src/server.js

# Hoặc với hot-reload
npm run dev
```

### 🐳 Docker

```bash
docker build -t mbbank-gateway .
docker run -p 3456:3456 --env-file .env mbbank-gateway
```

---

## 📖 API Reference

### `POST /api/transactions` — Tạo giao dịch

```bash
curl -X POST http://localhost:3456/api/transactions \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: your_api_key" \
  -d '{"amount": 150000, "description": "Order #123"}'
```

<details>
<summary><strong>Response (200 OK)</strong></summary>

```json
{
  "tx_id": "tx_abc123def456",
  "payment_note": "MPAB12CD",
  "amount": 150000,
  "qr_url": "https://img.vietqr.io/image/970422-ACCOUNT-compact2.png?amount=150000&addInfo=MPAB12CD",
  "status": "pending",
  "expires_at": "2026-03-19T01:30:00Z"
}
```

</details>

### `GET /api/transactions/:tx_id` — Kiểm tra trạng thái

```bash
curl http://localhost:3456/api/transactions/tx_abc123def456 \
  -H "X-Api-Key: your_api_key"
```

### `GET /api/health` — Health check

```bash
curl http://localhost:3456/api/health
```

### Reconciliation Flow

Server tự động poll lịch sử giao dịch MB Bank và match theo:

1. **Payment note** (VD: `MPAB12CD`) xuất hiện trong nội dung chuyển khoản
2. **Số tiền** khớp (cho phép sai lệch ±1 VND)

Khi match → status chuyển sang `completed` → gửi webhook callback đến URL đã đăng ký.

---

## 🔧 API Endpoint Patching

MB Bank thường xuyên thay đổi API endpoint. Script `patch-mbbank.js` tự động xử lý:

| Endpoint cũ (broken) | Endpoint mới (patched) |
|:---|:---|
| `/api/retail-web-internetbankingms/getCaptchaImage` | `/api/retail-internetbankingms/getCaptchaImage` |
| `/api/retail-web-accountms/getBalance` | `/api/retail-accountms/accountms/getBalance` |

```bash
# Chạy thủ công (tự động chạy sau npm install)
npm run patch
```

---

## 🔐 Session Management

| Thông số | Giá trị |
|:---|:---|
| Ping interval | Mỗi 4 phút (`getBalance()`) |
| Auto re-login | Khi nhận error `GW200` (session expired) |
| Max failures | 3 lần ping thất bại → force re-login |

---

## 📂 Cấu Trúc Dự Án

```
mbbank-payment-gateway/
├── src/
│   ├── server.js                # Express server entry point
│   ├── config.js                # Environment configuration
│   └── services/
│       ├── bank-connector.js    # MB Bank API client
│       ├── session-keeper.js    # Session keep-alive service
│       └── reconciliation.js    # Transaction reconciliation
├── scripts/
│   └── patch-mbbank.js          # Auto-patch MB Bank endpoints
├── .env.example                 # Environment template
├── Dockerfile                   # Production Docker image
├── LICENSE                      # MIT License
└── README.md
```

---

## ⚠️ Disclaimer / Tuyên Bố Miễn Trừ Trách Nhiệm

> [!CAUTION]
> **Vui lòng đọc kỹ trước khi sử dụng / Please read carefully before use.**

1. **Unofficial API** — Dự án sử dụng unofficial API của MB Bank. API có thể thay đổi hoặc bị chặn bất cứ lúc nào mà không báo trước.  
   *This project uses MB Bank's unofficial API. It may change or become blocked at any time without notice.*

2. **Account Risk** — Việc sử dụng API không chính thức có thể dẫn đến tài khoản bị tạm khóa. Tác giả **KHÔNG CHỊU TRÁCH NHIỆM** cho bất kỳ hậu quả nào.  
   *Using unofficial APIs may result in your account being suspended. The authors accept **NO RESPONSIBILITY** for any consequences.*

3. **No Malicious Code** — Source code công khai hoàn toàn. Không chứa malware, backdoor, hay code gửi thông tin đến bên thứ ba.  
   *Source code is fully open. Contains no malware, backdoors, or code sending credentials to third parties.*

4. **Educational Purpose** — Chia sẻ với mục đích giáo dục và tham khảo kỹ thuật.  
   *Shared for educational and technical reference purposes only.*

5. **No Affiliation** — Dự án **KHÔNG** liên kết với Ngân hàng TMCP Quân đội (MB Bank).  
   *This project is **NOT** affiliated with, sponsored by, or endorsed by MB Bank.*

---

## 🙏 Credits

| Project | Description |
|:---|:---|
| [CookieGMVN/MBBank](https://github.com/CookieGMVN/MBBank) | Node.js MB Bank API library (`mbbank` npm package) |
| [thedtvn/MBBank](https://github.com/thedtvn/MBBank) | Python MB Bank API library |
| [thedtvn/mbbank-capcha-ocr](https://github.com/thedtvn/mbbank-capcha-ocr) | OCR model for MB Bank captcha |
| [VietQR](https://vietqr.io/) | Vietnamese payment QR standard |

---

<div align="center">

**[⬆ Back to Top](#mbbank-payment-gateway)**

Made with ❤️ in Vietnam

</div>
