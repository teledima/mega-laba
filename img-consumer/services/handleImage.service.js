const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")

const PROTO_PATH = "./services/handleimage.proto"

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
}

const packageDefinition = protoLoader.loadSync(PROTO_PATH, options)

const HandleImage = grpc.loadPackageDefinition(packageDefinition).HandleImage

export default HandleImage
