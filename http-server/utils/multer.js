// *** NPM ***
import multer from 'multer'

const storage = multer.memoryStorage()
const uploadMemory = multer({ storage: storage })

export { uploadMemory }
