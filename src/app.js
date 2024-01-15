import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
//Means Who can Acess the Backend , where from the request come, here we set to all in env file =*
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,

}))
// how much json it is going to accept 
app.use(express.json({ limit: "16kb" }))


// How it is going to encode the request from url
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

//Public Asset , Everyone is going to acces this folder
app.use(express.static("public"))

app.use(cookieParser())

export { app } 