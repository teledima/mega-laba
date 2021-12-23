// *** NPM ***
import express from 'express'
import { serialize, deserialize } from 'v8'
// *** UTILS ***
import { createClient, sendRPCMessage } from '../utils/rabbitmq'
import { uploadMemory } from '../utils/multer'

const router = express.Router()

router.post('/', uploadMemory.single('images'), async (req, res) => {
    const serializeImageObj = serialize({ type: 'upload', data: req.file })
    const channel = await createClient(process.env.RABBIT_URL)
    console.log(`[ ${new Date()} ] Message sent: ${req.file}`)
    const respone = await sendRPCMessage(channel, serializeImageObj, process.env.QUEUE)
    console.log(`[ ${new Date()} ] Message received: ${deserialize(respone)}`)
    return res.json(deserialize(respone))
})

router.get('/:_id', async (req, res) => {
    const { _id } = req.params
    const serializeObj = serialize({ type: 'get', data: { _id } })
    const channel = await createClient(process.env.RABBIT_URL)
    console.log(`[ ${new Date()} ] Message sent: ${req.file}`)
    const respone = await sendRPCMessage(channel, serializeObj, process.env.QUEUE);
    console.log(`[ ${new Date()} ] Message received`);
    return res.type('image/png').send(respone)
})

export default router
