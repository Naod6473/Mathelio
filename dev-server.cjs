'use strict';
process.env.PORT ||= '4318';
const {createApp}=require('./server.cjs');
const app=createApp();
require('node:http').createServer(app.handler).listen(Number(process.env.PORT),'127.0.0.1',()=>console.log('Mathélio v2 : http://127.0.0.1:'+process.env.PORT));
