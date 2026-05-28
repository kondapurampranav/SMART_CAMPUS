# Smart Campus Information System

## Setup & Run

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Project structure
```
smart_campus/
├── main.py
├── requirements.txt
├── templates/
│   └── index.html
└── static/          ← auto-created on first analysis
```

### 3. Run the server
```bash
uvicorn main:app --reload
```

Open your browser at: **http://127.0.0.1:8000**

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Serves the frontend |
| POST | `/register` | Register a new student |
| POST | `/course` | Assign course to student |
| POST | `/hostel_fee` | Save hostel & mess fees |
| GET | `/records` | Get all student records |
| GET | `/search/{sid}` | Search student by ID |
| GET | `/sort` | Get students sorted by marks |
| GET | `/save` | Export records to .txt |
| GET | `/analysis` | Generate performance charts |
# SMART_CAMPUS

## LINK
The project is live: https://smart-campus-6hp2.onrender.com/
