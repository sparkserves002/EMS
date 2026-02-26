EMS - Employee Management System (Skeleton)

Next steps to continue development:

1. Backend
   - cd backend
   - npm install
   - Provide Firebase service account JSON path via FIREBASE_SERVICE_ACCOUNT_JSON env var or place `serviceAccountKey.json` in backend folder.
   - Set FIREBASE_STORAGE_BUCKET env var.
   - npm run dev

2. Frontend
   - cd frontend
   - npm install
   - Add React build tooling (webpack/vite) or use Create React App, and set REACT_APP_FIREBASE_* env vars.
   - npm start

This repository contains a minimal skeleton for the EMS app (Auth, attendance endpoints, React skeleton). Continue by implementing UI components, analytics, payroll, security rules, and Google Maps integration.
