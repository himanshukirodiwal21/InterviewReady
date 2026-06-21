# 🎯 InterviewReady – AI-Powered Mock Interview Platform

InterviewReady is a full-stack MERN web application that helps students and job seekers prepare for real interviews. It turns a candidate's resume into a realistic mock interview — AI-generated questions, AI follow-ups, and a weighted scorecard that shows exactly what to improve before the interview that counts.

---

## 🚀 Features

### 👥 Candidate Features
- Register / log in, with OTP email verification on signup
- Upload a resume (PDF) — AI extracts skills, projects, technologies, and experience level
- Choose an interview type: HR, Technical, or Mixed
- Choose a difficulty: Beginner, Intermediate, or Advanced
- Take a timed mock interview with AI-generated questions and dynamic follow-ups
- Receive a scorecard broken down by Accuracy, Relevance, Communication, and Completeness
- View interview history and track progress over time (average score, improvement trend, best performance)

### 🛠️ Admin Features
- Secure admin-only dashboard and login
- View, block, or delete users
- Monitor all interview sessions in real time
- Manage interview question categories
- View platform-wide analytics (total users, total interviews, average scores, popular categories)

### 📊 Platform Highlights
- Role-based access control (Admin / Candidate)
- AI-driven question generation and answer evaluation
- REST API-based data handling
- Responsive, clean UI with light & dark mode support
- Scalable, modular architecture

---

## 🧑‍💻 Tech Stack (MERN)

**Frontend**
- React.js + Vite
- React Router
- Axios
- HTML5, CSS3
- JavaScript (ES6+)

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB + Mongoose

**Auth & Security**
- JWT Authentication
- bcrypt password hashing

**AI & Storage**
- Gemini API (question generation & answer evaluation)
- Cloudinary (resume storage)

**Tools**
- Git & GitHub
- RESTful APIs

---

## 📂 Project Structure

```
InterviewReady/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Navbar.css
│   │   │       ├── Footer.jsx
│   │   │       └── Footer.css
│   │   ├── layouts/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Login.css
│   │   │   └── dashboard/
│   │   │       └── Dashboard.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── server.js
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```
git clone https://github.com/himanshukirodiwal21/InterviewReady.git
cd InterviewReady
```

### 2️⃣ Frontend Setup
```
cd frontend
npm install
npm run dev
```

### 3️⃣ Backend Setup
```
cd backend
npm install
npm start
```

### 4️⃣ Environment Variables

Create a `.env` file inside the **frontend** folder:
```
VITE_API_URL=http://localhost:8000
```

Create a `.env` file inside the **backend** folder:
```
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

---

## 🧮 Scoring Model

Every answer is evaluated by AI across four weighted criteria:

| Criterion | Weight |
|---|---|
| Accuracy | 40% |
| Relevance | 25% |
| Communication | 20% |
| Completeness | 15% |

Each report includes a total score, a question-by-question breakdown, and feedback covering strengths, weaknesses, and suggestions.

---

## 🗄️ Database Collections

**Users**
```js
{ _id, name, email, password, resumeUrl, role, createdAt }
```

**Interviews**
```js
{ _id, userId, interviewType, difficulty, score, feedback, createdAt }
```

**Questions**
```js
{ _id, interviewId, question, answer, aiEvaluation }
```

---

## 🚧 Future Enhancements

**Phase 2**
- Voice interviews with speech-to-text
- Interview recording
- ATS resume scoring

**Phase 3**
- AI avatar interviewer
- Video interviews
- Emotion analysis
- Recruiter dashboard

---

## 👨‍🎓 Author

**Himanshu Kirodiwal**
B.Tech (IT), Rajasthan Technical University
Aspiring Full-Stack Developer

GitHub: https://github.com/himanshukirodiwal21

---

## ⭐ Support

If you like this project, don't forget to star ⭐ the repository!