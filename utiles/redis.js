'use strict';
const Redis = require('redis');
const Cfg = require("./Cfg");

Cfg.redisPort = process.env.REDIS_PORT || "6379";
Cfg.redisHost = process.env.REDIS_HOST || "localhost";
let redis = Redis.createClient(Cfg.redisPort, Cfg.redisHost);

module.exports = {
    redisConnect(callback) {
        redis.on('ready', function () {
            console.log('Redis Ready !\n');
            redis.smembers('genes', function (err, value) {
                let obj = {};
                value.forEach(function (item) {
                    obj[item] = 1;
                });
                Cfg.genesObjInRedis = obj;
                console.log('Redis Genes OK !\n');
                callback()
            });
        });
        redis.on("error", function (err) {
            console.log('Redis NG !\n' + err);
            Cfg.genesObjInRedis = {};
            redis.quit();
        });
        return redis
    },

};