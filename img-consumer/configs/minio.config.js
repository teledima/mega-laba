var Minio = require('minio')

const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minio',
    secretKey: 'minio124'
})

export default minioClient
