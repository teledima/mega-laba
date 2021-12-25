import amqplib from 'amqplib'
const EventEmitter = require('events')
const uuid = require('uuid')

const REPLY_QUEUE = 'amq.rabbitmq.reply-to'

const createClient = async (rabbitmqconn) => {
    const connection = await amqplib.connect(rabbitmqconn)
    const channel = await connection.createChannel()
    channel.responseEmitter = new EventEmitter()
    channel.responseEmitter.setMaxListeners(0)
    channel.consume(
        REPLY_QUEUE,
        (msg) => {
            channel.responseEmitter.emit(
                msg.properties.correlationId,
                msg.content,
            )
        },
        { noAck: true },
    )
    return channel
}

const sendRPCMessage = (channel, message, rpcQueue) => 
    new Promise(resolve => {
        const correlationId = uuid.v4()
        channel.responseEmitter.once(correlationId, resolve)
        channel.sendToQueue(rpcQueue, message, {
            correlationId,
            replyTo: REPLY_QUEUE,
        })
    })

export { createClient, sendRPCMessage }
