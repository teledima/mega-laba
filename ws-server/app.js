// *** NPM ***
import WebSocket from 'ws'
// *** NODE ***
import { serialize, deserialize } from 'v8'
// *** UTILS ***
import { createClient, sendRPCMessage } from './utils/rabbitmq'
import minioClient from './configs/minio.config';

const getFileFromStream = (stream) => 
    new Promise((resolve) => {
        const bufs = []
        stream.on('data', (d) => { bufs.push(d) })
        stream.on('end', () => {
            resolve(bufs)
        })    
    })

;(async () => {
  const wsServer = new WebSocket.Server({port: process.env.PORT})
  // const rabbitChannel = await createClient(process.env.RABBIT_URL)

  wsServer.on('connection', onConnect)

  let listObjects = []
  async function onConnect(wsClient) {
      wsClient.on('message', onMessage)
      const stream = minioClient.listObjects('test', '', true)
      listObjects = await getFileFromStream(stream)

      console.log(listObjects)
      wsClient.send(JSON.stringify({type: 'all_objects', list: listObjects}))


      var listener = minioClient.listenBucketNotification(process.env.MINIO_BUCKET, '', '', ['s3:ObjectCreated:*', 's3:ObjectRemoved:*'])

      listener.on('notification', async(record) => {
        const stream = minioClient.listObjects('test', '', true)
        listObjects = await getFileFromStream(stream)

        wsClient.send(JSON.stringify({type: 'new_image', list: listObjects}))
      })

      async function onMessage(data) {
        console.log('Get message from client: ', JSON.parse(data.toString()))
        const message = {type: 'resize', data: JSON.parse(data.toString())}
        const rabbitChannel = await createClient(process.env.RABBIT_URL)
        const response = await sendRPCMessage(rabbitChannel, serialize(message), process.env.QUEUE)
        
        // console.log(`[ ${new Date()} ] Message received: ${JSON.stringify(response)}`)
        wsClient.send(JSON.stringify({type: 'resize', resizeResult: deserialize(response)}))
      }
  }
})()
