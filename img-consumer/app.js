// *** NPM ***
import amqplib from 'amqplib'
// *** NODE ***
import { serialize, deserialize } from 'v8'
// *** OTHER ***
import minioClient from './configs/minio.config'
import HashImageServices from './services/hashImage.service'
const grpc = require("@grpc/grpc-js")

;(async () => {
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
                            hashImage.GetHash(message.data.buffer.toString('base64'), (error, data) => {
                                if(error) reject(error)
                                resolve(data.hash)
                            })
                        })
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
                    var bufs = []
                    obj.on('data', function(d){ bufs.push(d); })
                    obj.on('end', function(){
                        var buf = Buffer.concat(bufs)
                        channel.sendToQueue(
                            msg.properties.replyTo,
                            buf,
                            {
                              correlationId: msg.properties.correlationId,
                            },
                        )
                    })                    
                    break
            }

            channel.ack(msg)
        }
    })
})()
