"use strict";
const fs = require("fs");
const Cfg = require("./Cfg");
require('./Extend');
const svgexport = require("svgexport");
const imagemin = require("imagemin");
const redis = require('./redis');
const imageminPngquant = require("imagemin-pngquant");
const PNG = '.png';
const {Storage} = require('@google-cloud/storage');

module.exports = {
    await(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }

            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }

            function step(result) {
                result.done ? resolve(result.value) : new P(function (resolve) {
                    resolve(result.value);
                }).then(fulfilled, rejected);
            }

            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    },

    getTime() {
        return new Date().format("yyyy-MM-dd HH:mm:ss", true);
    },

    deepClone(obj) {
        let newObj = obj instanceof Array ? [] : {};
        for (let i in obj) {
            if (!obj.hasOwnProperty(i)) {
                continue
            }
            newObj[i] = typeof obj[i] === 'object' ? this.deepClone(obj[i]) : obj[i];
        }
        return newObj;
    },

    async putBuffer(fileName, file, isFile = false) {
        try {
            // save to local
            // if Cfg.images_dir not exist, make it.
            if (!fs.existsSync(Cfg.images_dir)) {
                fs.mkdirSync(Cfg.images_dir, { recursive: true });
            }
            // write file to local
            console.log("write file to ", (Cfg.images_dir + fileName));
            fs.writeFileSync(Cfg.images_dir + fileName, file);

            return true;
        } catch (e) {
            console.log("try again", (Cfg.images_dir + fileName), e);
            return false;
        }
    },

    pngToPNG8(pngFile) {
        return this.await(this, void 0, void 0, function* () {
            let png8Files = yield imagemin([pngFile], 'build/images', {
                plugins: [
                    imageminPngquant({quality: '100'})
                ]
            });
            if (png8Files && png8Files.length) { //转png8成功
                return png8Files[0].data;
            }
        });
    },

    generatePNG(svgFile, pngFile, genes) {
        svgexport.render({
            "input": [svgFile, "100%", "800:"],
            "output": [pngFile]
        }, () => {
            return this.await(this, void 0, void 0, function* () {
                let png8File = yield this.pngToPNG8(pngFile); //转png8
                if (png8File) { //转png8成功才覆盖
                    pngFile = png8File;
                }
                let result = false;
                while (!result) {
                    result = yield this.putBuffer(genes + PNG, pngFile, true);
                }
                if (result) { //生成并上传png后再将redis和内存设置已生成
                    redis.redisConnect().sadd('genes', genes);
                    Cfg.genesObjInRedis[genes] = 1;
                }
            });
        });
    },
};

