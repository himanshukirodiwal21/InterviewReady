import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

console.log("CORS_ORIGIN =", process.env.CORS_ORIGIN);

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'
import resumeRouter from './routes/resume.routes.js'
import interviewRouter from './routes/interview.routes.js'



//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/resume", resumeRouter)
app.use("/api/v1/interviews", interviewRouter)



// http://localhost:8000/api/v1/users/register

export { app }