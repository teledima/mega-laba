FROM python:3.9
WORKDIR /app
COPY requirements.txt /app
RUN pip install -r requirements.txt
RUN pip install suds-py3
COPY . .
EXPOSE 4001
CMD ["python", "main.py"]
