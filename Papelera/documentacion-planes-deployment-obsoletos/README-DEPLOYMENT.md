# PlayTest Frontend Deployment

## Stack
- **Frontend**: HTML + React (CDN) + Tailwind CSS
- **Backend API**: Node.js + Express + PostgreSQL (deployed separately)
- **Hosting**: Render.com

## Architecture
- **Frontend URL**: https://playtest-frontend.onrender.com
- **Backend API**: https://playtest-backend.onrender.com
- **Database**: PostgreSQL on Render

## Features
- User authentication with JWT
- Question creation (AI, manual, file upload)
- Block and game management
- Multi-language support (ES/EN)
- Responsive design

## Environment
- Production backend: https://playtest-backend.onrender.com/api
- All authentication and data persisted in PostgreSQL
- Session management with localStorage + token validation