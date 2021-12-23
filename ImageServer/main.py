import uuid
import json
import base64

import pika
import asyncio
import websockets
from minio import Minio
from suds import Client

wsdl = "http://localhost:50919/Service.svc?WSDL"
minio_client = Minio(endpoint='localhost:9000', access_key='minio', secret_key='minio124', secure=False)


class ImageQueue:
    def __init__(self):
        self.response = None
        self.corr_id = None

        credential = pika.PlainCredentials(username='admin', password='admin')
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='localhost', port=5432, virtual_host='/', credentials=credential)
        )

        self.channel = self.connection.channel()

        result = self.channel.queue_declare(queue='', exclusive=True)

        self.callback_queue = result.method.queue
        self.channel.basic_consume(
            queue=self.callback_queue,
            on_message_callback=self.on_response,
            auto_ack=True
        )

    def on_response(self, props, body):
        if self.corr_id == props.correlation_id:
            self.response = body

    def get_image(self, name):
        self.response = None
        self.corr_id = str(uuid.uuid4())
        self.channel.basic_publish(
            exchange='',
            routing_key='test3',
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id
            ),
            body=bytes(json.dumps({"type": "get", "data": {"_id": name}}))
        )

    def upload_image(self, image):
        self.response = None
        self.corr_id = str(uuid.uuid4())
        self.channel.basic_publish(
            exchange='',
            routing_key='test3',
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id
            ),
            body=bytes(json.dumps({"type": "upload", "data": {"buffer": image}}))
        )


def get_new_image(image, new_width, new_height):
    client = Client(wsdl)
    encoded = base64.b64encode(image)
    return client.service.ResizeImage(encoded, new_width, new_height)


def get_all_objects():
    all_object = minio_client.list_objects(bucket_name='test', recursive=True)
    object_names = []
    while True:
        try:
            current_object = next(all_object)
            object_names.append({"name": current_object.object_name})
        except StopIteration:
            all_object.close()
            break
    return object_names


def on_open(websock):
    print('open')
    with minio_client.listen_bucket_notification(bucket_name='test', events=['s3:ObjectCreated:*', 's3:ObjectRemoved:*']) as event_listener:
        for event in event_listener:
            print(event)

    get_all_objects()


async def echo(websocket):
    if websocket.open:
        list_names = get_all_objects()
        response = await websocket.send(json.dumps(list_names))
    async for message in websocket:
        print(message)
        await websocket.send(message)


async def main():
    async with websockets.serve(echo, "localhost", 4000):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
