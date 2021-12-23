import grpc

import hashimage_pb2
import hashimage_pb2_grpc

if __name__ == "__main__":
  channel = grpc.insecure_channel('localhost:5001')
  stub = hashimage_pb2_grpc.HashImageStub(channel)
  response = stub.GetHash(hashimage_pb2.ImageRequest(image=b'you'))
  print("Greeter client received: " + response.hash)