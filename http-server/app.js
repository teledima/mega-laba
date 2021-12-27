// *** NPM ***
import express from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import cors from 'cors'
// *** ROUTES ***
import indexRouter from './routes'

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// *** CORS ***
app.use(
    cors({
        origin: "http://192.168.1.44:3000",
        credentials: true,
    }),
)

app.use('/', indexRouter)

export default app
