// *** NPM ***
import express from 'express'
// *** ROUTES ***
import imagesRouter from './images.route' 

const router = express.Router()

router.use('/images', imagesRouter)

export default router
