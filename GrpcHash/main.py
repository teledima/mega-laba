# Copyright 2020 gRPC authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""The Python AsyncIO implementation of the GRPC helloworld.Greeter server."""

import asyncio
import logging

import grpc
import hashlib
import hashimage_pb2
import hashimage_pb2_grpc


class HashImage(hashimage_pb2_grpc.HashImageServicer):
    async def GetHash(self,
                      request: hashimage_pb2.ImageRequest,
                      context: grpc.aio.ServicerContext) -> hashimage_pb2.Reply:
        print(request.image)
        cipher = hashlib.sha512(bytes(request.image, encoding='utf-8'))
        return hashimage_pb2.Reply(hash=cipher.hexdigest())


async def serve() -> None:
    # create server
    server = grpc.aio.server()

    # add services
    hashimage_pb2_grpc.add_HashImageServicer_to_server(HashImage(), server)

    # add secure port
    listen_addr = '[::]:5001'
    server.add_insecure_port(listen_addr)
    logging.info("Starting server on %s", listen_addr)
    await server.start()
    await server.wait_for_termination()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(serve())
