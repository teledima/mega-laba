// *** NPM ***
import amqplib from 'amqplib'
var soap = require('soap')
// *** NODE ***
import { serialize, deserialize } from 'v8'
// *** OTHER ***
import minioClient from './configs/minio.config'
import HashImageServices from './services/hashImage.service'
const grpc = require("@grpc/grpc-js")


const getFileFromStream = (stream) => 
    new Promise((resolve) => {
        const bufs = []
        stream.on('data', (d) => { bufs.push(d) })
        stream.on('end', () => {
            resolve(Buffer.concat(bufs))
        })    
    })

;(async () => {
    const resizeClient = await soap.createClientAsync(process.env.RESIZE_URL)
    const hashImage = new HashImageServices(process.env.HASHIMAGE_ADDR, grpc.credentials.createInsecure())
    const connection = await amqplib.connect(process.env.RABBIT_URL)
    console.log(`[ ${new Date()} ] Server started`)
    const channel = await connection.createChannel()
    await channel.assertQueue(process.env.RABBIT_QUEUE)
    await channel.consume(process.env.RABBIT_QUEUE, async (msg) => {
        if (msg !== null) {
            const message = deserialize(msg.content)
            console.log(`[ ${new Date()} ] Message get: ${message}`)

            switch(message.type) {
                case 'upload':
                    {
                        const hash = await new Promise((resolve, reject) => {
                            console.log('base64: ', message.data.buffer.toString('base64').length)
                            hashImage.GetHash({image: message.data.buffer.toString('base64')}, (error, data) => {
                                if(error) reject(error)
                                resolve(data.hash)
                            })
                        })
                        console.log('hash: ', hash)
                        await minioClient.putObject('test', hash, message.data.buffer, { 'Content-type': message.data.mimetype })
                        const response = {
                            hash: hash,
                        }
                        
                        console.log(`[ ${new Date()} ] Message sent: ${JSON.stringify(response)}`)
                        channel.sendToQueue(
                            msg.properties.replyTo,
                            serialize(response),
                            {
                            correlationId: msg.properties.correlationId,
                            },
                        )
                    }
                    break
                case 'get':
                    const obj = await minioClient.getObject('test', message.data._id)
                    const file = await getFileFromStream(obj)
                    channel.sendToQueue(
                        msg.properties.replyTo,
                        file,
                        {
                          correlationId: msg.properties.correlationId,
                        },
                    )                    
                    break
                case 'resize':
                    {
                        console.log('request to resize', message.data)
                        const obj = await minioClient.getObject('test', message.data._id)
                        const file = await getFileFromStream(obj)
                        const imgBase64 = await resizeClient.ResizeImageAsync({
                            imageArr: file.toString('base64'),
                            new_width: message.data.new_width,
                            new_height: message.data.new_height,
                        })
                        
                        channel.sendToQueue(
                            msg.properties.replyTo,
                            serialize(imgBase64),
                            {
                            correlationId: msg.properties.correlationId,
                            },
                        )
                    }
                    break
            }

            channel.ack(msg)
        }
    })
})()
