import asyncio
import logging
import os

import PIL.Image
import grpc
import hashlib
import handleimage_pb2
import handleimage_pb2_grpc

import io
import base64
from PIL import Image


class HandleImage(handleimage_pb2_grpc.HandleImageServicer):
    async def GetHash(self,
                      request: handleimage_pb2.Image,
                      context: grpc.aio.ServicerContext) -> handleimage_pb2.Hash:
        cipher = hashlib.sha512(bytes(request.image, encoding='utf-8'))
        return handleimage_pb2.Hash(hash=cipher.hexdigest())

    async def Resize(self, request: handleimage_pb2.ResizeRequest, context) -> handleimage_pb2.Image:
        decoded_image = base64.b64decode(request.image)
        image = Image.open(io.BytesIO(decoded_image))
        resized_image = image.resize(size=(request.new_width, request.new_height), resample=PIL.Image.LANCZOS)

        buffer = io.BytesIO()
        resized_image.save(buffer, format='PNG')
        return handleimage_pb2.Image(image=base64.b64encode(buffer.getvalue()).decode('utf-8'))


async def serve() -> None:
    # create server
    server = grpc.aio.server()

    # add services
    handleimage_pb2_grpc.add_HandleImageServicer_to_server(HandleImage(), server)

    # add secure port
    listen_addr = f'[::]:{os.environ.get('PORT')}'
    server.add_insecure_port(listen_addr)
    logging.info("Starting server on %s", listen_addr)
    await server.start()
    await server.wait_for_termination()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(serve())
