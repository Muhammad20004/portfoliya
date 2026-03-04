# Student Projects Platform — Backend

Texnologiyalar: **Express.js**, **MongoDB Atlas (Mongoose)**, **Multer** (avatar upload), **Supabase Storage** (loyiha fayllari/rasmlar), **JWT Auth**.

## 1) O‘rnatish
```bash
cd student-project-platform-backend
npm i
cp .env.example .env
# .env ichini to‘ldiring
npm run dev
```

## 2) Supabase Storage sozlash
- Supabase’da 2 ta bucket yarating:
  - `avatars`
  - `projects`
- Bucket’larni **public** qilsangiz, URL’lar to‘g‘ridan-to‘g‘ri ochiladi.
  - Yoki private bo‘lsa: signed URL ishlatish kerak (bu starterda public bucket tavsiya).

## 3) Rollar
- `HEAD` — kafedra mudiri
- `TEACHER` — ustoz
- `STUDENT` — talaba

## 4) Admin (HEAD) yaratish
Starterda avtomatik seed yo‘q. Eng tez yo‘l:
1) MongoDB’da `users` collection’ga HEAD user qo‘shing (passwordHash bcrypt bo‘lishi kerak)
2) Yoki vaqtincha `src/utils/seed.js` yozib ishlatib yuborasiz.

> Agar xohlasangiz, keyingi bosqichda men sizga **HEAD seed script** ham qo‘shib beraman.

## 5) API Docs
`src/docs/api.json` faylida endpointlar ro‘yxati bor.

