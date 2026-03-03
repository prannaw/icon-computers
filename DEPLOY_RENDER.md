# Deploy on Render (Frontend + Backend)

## 1) Backend Web Service

- Service type: `Web Service`
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`

Set these environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL` = your frontend URL (for example `https://icon-computers-ui.onrender.com`)
- `CORS_ORIGIN` = your frontend URL (or comma-separated URLs)
- `CASHFREE_ENV` = `sandbox` or `production`
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `CASHFREE_API_VERSION` = `2023-08-01`
- `CASHFREE_RETURN_URL` = `https://your-frontend-domain/my-orders`
- Optional: `CASHFREE_WEBHOOK_SECRET`
- Optional OTP later:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`

## 2) Frontend Static Site

- Service type: `Static Site`
- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `build`

Set environment variable:

- `REACT_APP_API_BASE_URL` = `https://your-backend-service.onrender.com/api`

## 3) CMD commands before deploy

```cmd
cd /d c:\icon-computers
git add .
git commit -m "prepare render deployment config"
git push
```

