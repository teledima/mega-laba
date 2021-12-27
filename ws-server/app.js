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
        const responseJson = deserialize(response)[0].ResizeImageResult

        console.log('Get response: ', responseJson.length)
        // console.log(`[ ${new Date()} ] Message received: ${JSON.stringify(response)}`)
        wsClient.send(JSON.stringify({type: 'resize', resizeResult: responseJson}))
      }

      /*
      console.log('Новый пользователь');

      // отправка приветственного сообщения клиенту
      const messange = { type: 'resize', data: { _id: 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e', new_width: 100, new_height: 100 } }
      console.log(`[ ${new Date()} ] Message sent: ${JSON.stringify(messange)}`)
      const serializeMessange = serialize(messange)
      const respone = await sendRPCMessage(rabbitChannel, serializeMessange, process.env.QUEUE)
      const responeJson = deserialize(respone)
      console.log(`[ ${new Date()} ] Message received: ${JSON.stringify(responeJson)}`)
      wsClient.send(JSON.stringify(responeJson))
      
      wsClient.on('message', function(message) {
        // обработчик сообщений от клиента
      })
      wsClient.on('close', function() {
        // отправка уведомления в консоль
        console.log('Пользователь отключился');
      })
      */
  }
})()
