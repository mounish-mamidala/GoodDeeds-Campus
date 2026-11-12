# GoodDeeds Campus — Flask + MySQL

A full-stack student volunteering board. Build and test the frontend first in demo mode, then connect it to Flask REST APIs and MySQL.

## Stack
- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Python 3.10+, Flask
- Database: MySQL 8+
- ORM: Flask-SQLAlchemy
- Password hashing: Werkzeug
- Sessions: Flask signed session cookie

## Features
Home, opportunities list/search/filter, opportunity details, registration/login, My Contributions, admin dashboard, join opportunity, update completion status and award volunteering hours.

## Project structure
```text
GoodDeedsCampus_Flask/
├── frontend/
│   ├── index.html
│   ├── opportunities.html
│   ├── opportunity-details.html
│   ├── login.html
│   ├── register.html
│   ├── contributions.html
│   ├── admin.html
│   ├── css/style.css
│   └── js/
│       ├── config.js
│       ├── common.js
│       ├── home.js
│       ├── opportunities.js
│       ├── details.js
│       ├── auth.js
│       ├── contributions.js
│       └── admin.js
├── backend/
│   ├── app.py, config.py, extensions.py, models.py
│   ├── routes/
│   ├── requirements.txt
│   └── .env.example
└── database/schema.sql
```

# Part 1 — Frontend first (demo mode)
1. Open the `frontend` folder in VS Code.
2. Start it with the Live Server extension (recommended) or open `index.html`.
3. `frontend/js/config.js` starts with `USE_DEMO_DATA: true`. The site works with sample data in localStorage; no backend is needed yet.
4. Register a demo account, explore opportunities, join one, and view My Contributions.
5. Demo admin: browser DevTools Console:
   ```js
   const u = JSON.parse(localStorage.getItem("gd_user") || "null");
   if (u) { u.role = "ADMIN"; localStorage.setItem("gd_user", JSON.stringify(u)); }
   ```
   Sign out and sign back in to refresh the user state.

# Part 2 — Backend + MySQL
## Requirements
- Python 3.10+
- MySQL Server 8+
- VS Code
- MySQL Workbench (optional)

## Create database
Run `database/schema.sql` in MySQL Workbench, or:
```bash
mysql -u root -p < database/schema.sql
```

## Configure Python
Open a terminal in `backend/`.

Windows PowerShell:
```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```
macOS/Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install:
```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env`. Set your MySQL password and a long random `SECRET_KEY`.
Example:
```env
SECRET_KEY=replace-with-a-long-random-secret
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost/gooddeeds_campus
FRONTEND_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
```
If your MySQL password contains special URL characters, URL-encode it.

## Run Flask
From `backend/`:
```bash
flask --app app run --debug
```
API: `http://127.0.0.1:5000`

## Connect frontend to backend
Change `frontend/js/config.js`:
```js
window.GD_CONFIG = {
  API_BASE: "http://127.0.0.1:5000/api",
  USE_DEMO_DATA: false
};
```
Run frontend with Live Server at port 5500. If your port differs, add that origin to `FRONTEND_ORIGINS` and restart Flask.

## Create the first admin
1. Register a user normally in the website.
2. In MySQL Workbench:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```
3. Log out and log back in. Admin Dashboard becomes visible.

## API endpoints
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/health` | Public |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Public |
| GET | `/api/auth/me` | Public |
| GET | `/api/opportunities` | Public |
| GET | `/api/opportunities/<id>` | Public |
| POST | `/api/opportunities` | Admin |
| PUT | `/api/opportunities/<id>` | Admin |
| DELETE | `/api/opportunities/<id>` | Admin |
| POST | `/api/opportunities/<id>/join` | Student |
| GET | `/api/contributions/me` | Student |
| PATCH | `/api/contributions/<registration_id>/status` | Admin |

## Important
This is a learning-project starter. Before public deployment, add CSRF protection for cookie-authenticated writes, rate limiting, email verification, HTTPS, production secrets, logging, and stronger admin management. Never commit `.env` or real credentials.
