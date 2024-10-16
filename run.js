"use strict";
let isDebug = process.env.NODE_ENV !== 'production';
const path = require("path");
const http = require("http");
const Cfg = require('./utiles/Cfg');
const config = require('./utiles/config');
const router = require('./router');
const redis = require('./utiles/redis');
const configPath = 'config/';

const initConfig = async () => {
    // get 
    config.LoadGlobalConfig();

    console.log(`${isDebug ? 'DEVELOPMENT' : 'PRODUCTION'} MODE, loading config ....`);
    await config.LoadGeneRegConfig(path.join(__dirname, configPath + "GeneRegConfig.json")); //加载基因配置
    await config.LoadGeneCfg(path.join(__dirname, configPath + "GeneConfig.json")); //加载基因配置
    await config.LoadGeneColorConfig(path.join(__dirname, configPath + "GeneColorConfig.json")); //加载基因配置
};
let createServer = () => {
    http.createServer(router.onRequest).listen(Cfg.serverPort);
    console.log(`Server Started. Please visit http://127.0.0.1:${Cfg.serverPort}/index.html`);
};
const run = async () => {
    redis.redisConnect(createServer);
};

initConfig();
run();