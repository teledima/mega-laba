import express from 'express'
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const Gateway = require('micromq/gateway');

import indexRouter from './routes'

var app = express();

const gateway = new Gateway({
    // названия микросервисов, к которым мы будем обращаться
    microservices: ['users'],
    // настройки rabbitmq
    rabbit: {
        // ссылка для подключения к rabbitmq (default: amqp://guest:guest@localhost:5672)
        url: process.env.RABBIT_URL,
    },
});

// apply middleware
app.use(gateway.middleware());

// создаем два эндпоинта /friends & /status на метод GET
app.get(['/friends', '/status'], async (req, res) => {
  // делегируем запрос в микросервис users
  await res.delegate('users');
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// *** CORS ***
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    }),
)

app.use('/', indexRouter)

module.exports = app;
