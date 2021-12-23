// *** NPM ***
import express from 'express'
import multer from 'multer'
import { serialize, deserialize } from 'v8'

import { createClient, sendRPCMessage } from '../utils/rabbitmq'

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const router = express.Router()

router.post('/', upload.single('images'), async (req, res) => {
    console.log(req.file)
    const serializeImageObj = serialize({ type: 'upload', data: req.file })

    const channel = await createClient('amqp://guest:guest@localhost:5672');

    console.log(`[ ${new Date()} ] Message sent: ${req.file}`);

    const respone = await sendRPCMessage(channel, serializeImageObj, 'test3');

    console.log(`[ ${new Date()} ] Message received: ${deserialize(respone)}`);

    return res.json(deserialize(respone))
})

router.get('/:_id', async (req, res) => {
    const { _id } = req.params
    const serializeObj = serialize({ type: 'get', data: { _id } })

    const channel = await createClient('amqp://guest:guest@localhost:5672');

    console.log(`[ ${new Date()} ] Message sent: ${req.file}`);

    const respone = await sendRPCMessage(channel, serializeObj, 'test3');

    console.log(`[ ${new Date()} ] Message received`);

    return res.type('image/png').send(respone)
})

export default router
