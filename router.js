"use strict";
const tools = require('./utiles/tools');
const path = require('path');
const url = require('url');
const fs = require('fs');
const Cfg = require("./utiles/Cfg");
const bn = require('big-integer');
const tempy = require("tempy");
const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const PNG = '.png';
const EXT = ".svg";
const EXT_E = ".svge";
const ENCODING_B = "binary";
const mime = {
    ".css": "text/css",
    ".gif": "image/gif",
    ".html": "text/html",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript",
    ".json": "application/json",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".swf": "application/x-shockwave-flash",
    ".tiff": "image/tiff",
    ".txt": "text/plain",
    ".wav": "audio/x-wav",
    ".wma": "audio/x-ms-wma",
    ".wmv": "video/x-ms-wmv",
    ".xml": "text/xml"
};
const SUFFIX_END = '>';
const PREFIX_SVG_NS = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 3000 3000">';
const W3C = 'xmlns="http://www.w3.org/2000/svg"';
const W3C_XLINK = 'xmlns:xlink="http://www.w3.org/1999/xlink"';
const VIEWBOX = 'viewBox="0 0 3000 3000"';
const PREFIX_SVG = "<svg";
const SUFFIX_SVG = "</svg>";
const PREFIX_G = "<g";
const SUFFIX_G = "</g>";
const MIME_SVG = "image/svg+xml";

let parseToXML = text => new DOMParser().parseFromString(text, "text/xml");
let parseToString = node => new XMLSerializer().serializeToString(node);
let checkExt = text => {
    return (text === EXT || text === EXT_E)
};
let checkGeneRedis = genes => {
    return Cfg.genesObjInRedis[genes]
};
let checkGenes = genes => {
    return !(!genes || genes.toString() === "" || isNaN(Number(genes)))
};

let parseGenes = (genes, bigGidObj) => {
    let bitsAllOne;
    let bigGeneTypeArr = Cfg.bigGeneTypeArr;
    let offset = 0;
    bigGeneTypeArr.forEach(function (bgt) {
        let bGeneType = bgt["id"]; //大类id,1-轮廓....
        let bGeneLen = bgt["len"]; //基因占位总长度
        let bD0Len = bgt["d0len"]; //显性基因d0占位长度
        let bigGid;
        if (parseInt(bGeneLen) === 1) { //繁殖能力,性别
            bitsAllOne = bn(1);
            bigGid = bn(genes).shiftRight(offset).and(bitsAllOne);
        }
        else {
            bitsAllOne = bn(2).pow(bD0Len).subtract(1);
            bigGid = bn(genes).shiftRight(offset).and(bitsAllOne);
        }
        bigGidObj[bGeneType] = bigGid;
        offset += bGeneLen;
    });
};
// routes handle
let handleOptionsRequest = (res) => {
    res.writeHead(204, {"Access-Control-Allow-Origin": "*"});
    res.end();
};

let handlePostRequest = (req, res) => {
    let buffers = [];
    let dBuffer;
    req.on('data', function (chunk) {
        buffers.push(chunk);
    });
    req.on('end', () => tools.await(this, void 0, void 0, function* () {
        dBuffer = Buffer.concat(buffers).toString();
        if (dBuffer) {
            let obj = JSON.parse(dBuffer);
            if (!obj) {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end(`非法格式`);
                return;
            }
            let cmd = parseInt(obj["cmd"]);
            if (cmd === 0) {
                let bigType = obj["type"];
                let raceSex = obj["rs"] !== undefined ? obj["rs"].toString() : "";
                let value = obj["value"];
                if (bigType && raceSex !== "") {
                    //改色的配置写入加工后的格式中
                    let geneObj = Cfg.geneObj;
                    let vObj = geneObj[raceSex][bigType][value];
                    let colorObj = obj["colorObj"];
                    for (let type in colorObj) {
                        if (!colorObj.hasOwnProperty(type) || !vObj) {
                            continue
                        }
                        vObj[type] = colorObj[type];
                    }
                    //改色的配置写入初始颜色配置的格式中
                    let geneTypeArr = Cfg.geneTypeArrByBigObj[bigType];
                    let genColorInitObj = Cfg.geneColorInitObj;
                    for (let rs in genColorInitObj) {
                        if (!genColorInitObj.hasOwnProperty(rs)) {
                            continue
                        }
                        let btObj = genColorInitObj[rs];
                        for (let bt in btObj) {
                            if (!btObj.hasOwnProperty(bt)) {
                                continue
                            }
                            if (bt && parseInt(bt) === parseInt(bigType)) {
                                let vObj = btObj[bt];
                                let cvObj = vObj[value];
                                let cvArr = cvObj.cValues;
                                geneTypeArr.forEach(function (type) {
                                    cvArr[j] = colorObj[type];
                                })
                            }
                        }
                    }
                    let outputUrl = path.join(__dirname, "GeneColorConfig.json");
                    fs.writeFileSync(outputUrl, JSON.stringify(Cfg.geneColorInitObj));
                }
            }
        }
        res.writeHead(200, {"Access-Control-Allow-Origin": "*"});
        res.write("");
        res.end();
    }));
};

let handleGetGeneName = (req, res, genesUrl) => {
    let genes = genesUrl.substr(3, genesUrl.length); //基因id序列号
    genes = genes.replace(EXT_E, "");
    //检查基因格式
    if (!checkGenes(genes)) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end(`非法基因序列`);
        return;
    }
    let bigGidObj = {};
    parseGenes(genes, bigGidObj);
    let arr = [];
    //整理读取文件path、提取种族、性别
    let raceSex = "";
    Cfg.geneRegArr.forEach(function (geneReg) {
        if (geneReg) {
            let bgType = geneReg["pid"];
            let bigGid = bigGidObj[bgType];
            raceSex += bigGid;
            bigGidObj[bgType] = undefined;
            delete bigGidObj[bgType];
            let cns = geneReg["cns"];
            arr.push({"id": +bgType, "value": +bigGid, "name": cns[bigGid]});
        }
    });
    if (raceSex.toString() !== "") {
        let geneObj = Cfg.geneObj;
        for (let bigType in bigGidObj) {
            if (bigType) {
                let value = +bigGidObj[bigType];
                if (geneObj[raceSex][bigType]) {
                    let vObj = geneObj[raceSex][bigType][value];
                    if (vObj) {
                        arr.push({
                            "id": +bigType,
                            "value": value,
                            "name": vObj["name"],
                            "name_en": vObj["name_en"]
                        });
                    }
                }
            }
        }
    }
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        'Content-Type': "application/json;charset=utf-8"
    });
    // let str = encodeURIComponent(JSON.stringify(arr));
    // res.write(str);
    res.end(JSON.stringify(arr));
};

let handleGetEditorNameConfig = (req, res, genesUrl) => {
    genesUrl = genesUrl.substr(2, genesUrl.length);
    let rs = genesUrl.replace(EXT_E, "");
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        'Content-Type': "application/json;charset=utf-8"
    });
    let str = encodeURIComponent(JSON.stringify(Cfg.geneObj[rs]));
    res.write(str, ENCODING_B);
    res.end();
};

let handleGetEditorColorConfig = (req, res, genesUrl) => {
    genesUrl = genesUrl.substr(2, genesUrl.length);
    let genes = genesUrl.replace(EXT_E, "");
    let arr = genes.split("-");
    let id15 = +arr[0];
    let id14 = +arr[1];
    let cType = +arr[2];
    let cid = +arr[3];
    let raceSex = "" + id15 + "" + id14;
    let cvObj = Cfg.geneObj[raceSex][cType][cid];
    if (cvObj) {
        let cValueObj = {};
        for (let key in cvObj) {
            let num = +key;
            if (!cvObj.hasOwnProperty(key)) {
                continue
            }
            if (!isNaN(num)) {
                cValueObj[key] = cvObj[key];
            }
        }
        res.writeHead(200, {"Access-Control-Allow-Origin": "*", 'Content-Type': "text/plain"});
        res.write(JSON.stringify(cValueObj), ENCODING_B);
    }
    res.end();
};

let handleUnSupportFile = (req, res) => {
    let realPath = url.parse(req.url).pathname.trim();
    if (!realPath || realPath === "/") {
        realPath = "/index.html";
    }
    realPath = path.join(__dirname, realPath);
    let ext = path.extname(realPath);
    fs.exists(realPath, function (exists) {
        if (!exists) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.write(`无法找到文件${realPath}`);
            res.end();
        } else {
            fs.readFile(realPath, ENCODING_B, function (err, file) {
                if (err) {
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.end(err);
                }
                else {
                    let contentType = mime[ext] || "text/plain";
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        'Content-Type': contentType
                    });
                    res.write(file, ENCODING_B);
                    res.end();
                }
            });
        }
    });
};

let handleSvgeRequest = (req, res, genesUrl) => {
    genesUrl = genesUrl.substr(1, genesUrl.length);
    genesUrl = genesUrl.replace(EXT_E, "");
    let arr = genesUrl.split("-");
    let id15 = arr[0];
    let id14 = arr[1];
    let type = arr[2];
    let id = arr[3];
    let cType = arr[4] || 0;
    let cid = arr[5] || 0;
    if (isNaN(Number(id15)) || isNaN(Number(id14)) || isNaN(Number(type)) || isNaN(Number(id)) || isNaN(Number(cType)) || isNaN(Number(cid))) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end(`非法基因序列`);
        return;
    }
    //整理小基因值集合obj
    let geneObj = Cfg.geneObj;
    let zGeneTypeArr = Cfg.zGeneTypeArr;
    let colorAttrObj = Cfg.colorAttrObj;
    let gidObj = {};
    let bigGidObj = {"15": id15, "14": id14};
    bigGidObj[type] = id;
    bigGidObj[cType] = cid;
    let raceSex = id15 + "" + id14 + "";
    let svgArr = [];
    Cfg.bigGeneTypeArr.forEach(function (bgt) {
        let bigGeneType = bgt["id"];
        let bigGid = bigGidObj[bigGeneType];
        let cGeneTypeArr = bgt["cids"];
        if (cGeneTypeArr) { //配置了基因子部位
            cGeneTypeArr.forEach(function (cGeneType) {
                if (geneObj[raceSex]) {
                    let vObj = geneObj[raceSex][bigGeneType];
                    gidObj[cGeneType] = (vObj !== undefined && vObj[bigGid] !== undefined) ? vObj[bigGid][cGeneType] : ~~bigGid;
                }
            })
        }
    });
    let inputPath = path.join(__dirname, id15, id14);
    let inputUrl;
    zGeneTypeArr.forEach(function (gt) { //按层级小基因配置遍历
        let gType = gt["id"];
        let gZ = gt["z"];
        let gcType = gt["cid"]; // 颜色类别
        let gcid = gidObj[gcType]; // 颜色id
        let gid = gidObj[gType]; // 单基因id
        if (!gid) {
            return
        }
        let filePath = path.join(inputPath, gType + "");
        inputUrl = path.join(filePath, gid + EXT); //绝对路径名
        if (fs.existsSync(inputUrl)) {
            let file = fs.readFileSync(inputUrl, ENCODING_B);
            if (file) {
                let xml = parseToXML(file);
                if (gcType) { //需要设置颜色
                    let ccObj = gcid;
                    if (ccObj) {
                        for (let key in ccObj) {
                            if (!ccObj.hasOwnProperty(key)) {
                                continue;
                            }
                            if (key && key.toString() !== "") {
                                let e = xml.getElementById(key);
                                if (e) {
                                    let str2 = key.substr(0, 2);
                                    e.setAttribute(colorAttrObj[str2], ccObj[key]);
                                }
                            }
                        }
                    }
                }
                svgArr[gZ] = parseToString(xml); //按深度整理到集合中,从1开始
            } else {
                console.error(`无法读取文件${inputUrl} !${tools.getTime()}\n`);
            }
        }
    });

    if (svgArr) {
        let strList = "";
        svgArr.forEach(function (svg) {
            if (svg !== undefined) {
                let startIdx = 0;
                let endIdx = svg.lastIndexOf(SUFFIX_SVG);
                if (strList.toString() !== "") {
                    startIdx = svg.indexOf(SUFFIX_END) + 1;
                }
                strList += svg.substring(startIdx, endIdx);
            }
        });
        strList += SUFFIX_SVG; //拼成完整svg
        let contentType = mime[EXT] || MIME_SVG;
        res.writeHead(200, {"Access-Control-Allow-Origin": "*", 'Content-Type': contentType});
        res.write(strList, ENCODING_B);
        res.end();
    }
};

let handleSvgRequest = async (req, res, inputUrl, isPngRequest, genes, gExt) => {
    let bigGidObj = {};
    parseGenes(genes, bigGidObj);
    //整理读取文件path、提取种族、性别
    let raceSex = "";
    let inputPath = __dirname;
    Cfg.geneRegArr.forEach(function (geneReg) {
        let bgType = geneReg["pid"];
        let bigGid = bigGidObj[bgType];
        raceSex += bigGid;
        inputPath = path.join(inputPath, bigGid + "");
    });

    //整理小基因值集合obj
    let gidObj = {};
    let geneObj = Cfg.geneObj;
    Cfg.bigGeneTypeArr.forEach(function (bgt) {
        let bigGeneType = bgt["id"];
        let bigGid = bigGidObj[bigGeneType];
        let cGeneTypeArr = bgt["cids"];
        if (!cGeneTypeArr) { //配置了基因子部位
            return
        }
        cGeneTypeArr.forEach(function (cGeneType) {
            if (geneObj[raceSex]) {
                let vObj = geneObj[raceSex][bigGeneType];
                gidObj[cGeneType] = (vObj && vObj[bigGid]) ? vObj[bigGid][cGeneType] : ~~bigGid;
            }
        })
    });


    let svgArr = [];
    let colorAttrObj = Cfg.colorAttrObj;
    Cfg.zGeneTypeArr.forEach(function (gt) {
        let gType = gt["id"];
        let gZ = gt["z"];
        let gcType = gt["cid"]; //颜色类别
        let gcid = gidObj[gcType]; //颜色id
        let gid = gidObj[gType]; //单基因id
        if (gid) {
            let filePath = path.join(inputPath, gType + "");
            inputUrl = path.join(filePath, gid + EXT); //绝对路径名
            if (fs.existsSync(inputUrl)) {
                let file = fs.readFileSync(inputUrl, ENCODING_B);
                if (file) {
                    let xml = parseToXML(file);
                    if (gcType) { //需要设置颜色
                        let ccObj = gcid;
                        if (ccObj) {
                            for (let key in ccObj) {
                                if (!ccObj.hasOwnProperty(key)) {
                                    continue
                                }
                                if (key && key !== "") {
                                    let e = xml.getElementById(key);
                                    if (e) {
                                        let str2 = key.substr(0, 2);
                                        e.setAttribute(colorAttrObj[str2], ccObj[key]);
                                        e.setAttribute("id", gcType + "_" + key);
                                    }
                                }
                            }
                        }
                    }
                    svgArr[gZ] = {"type": gType, "svg": parseToString(xml)}; //按深度整理到集合中,从1开始
                    //console.log(inputUrl);
                } else {
                    console.error(`无法读取文件${inputUrl} !${tools.getTime()}\n`);
                }
            }
            else if (gZ !== undefined) {
                //if (errorLogArr.indexOf(inputUrl) == -1) {
                console.error(`无法找到文件${inputUrl} !${tools.getTime()}\n`);
                //}
            }
        }
    });

    //console.log("roll   end, cost " + getCost());
    //特殊层级调整 目前是头发高于耳朵，不能被遮挡时，提高耳朵层级
    let zChangeObj = Cfg.zChangeObj;
    if (zChangeObj) {
        let rsZChangeObj = zChangeObj[raceSex];
        let bigType = rsZChangeObj["thanBigId"];
        let bigValue = +bigGidObj[bigType]; //目标大类的值
        let thanBigValues = rsZChangeObj["thanBigValues"];
        if (thanBigValues && thanBigValues.indexOf(bigValue) !== -1) { //大类值符合调整范围
            let topSvgObj;
            let type = rsZChangeObj["id"]; //被调整的小类
            let len = svgArr.length;
            for (let k = 0; k < len; k++) {
                let svgObj = svgArr[k];
                if (svgObj && svgObj["type"] === type) {
                    topSvgObj = svgObj;
                    svgArr[k] = undefined;
                    break;
                }
            }
            let z = rsZChangeObj["z"];
            svgArr[z] = topSvgObj;
        }
    }
    //化零为整 多个svg拼成一个svg
    if (svgArr) {
        let strList = "";
        svgArr.forEach(function (svgObj) {
            if (svgObj) {
                let svg = svgObj["svg"];
                if (svg) {
                    let strSVG = svg.replace(PREFIX_SVG, PREFIX_G);
                    strSVG = strSVG.replace(SUFFIX_SVG, SUFFIX_G);
                    strSVG = strSVG.replace(W3C, "");
                    strSVG = strSVG.replace(W3C_XLINK, "");
                    strSVG = strSVG.replace(VIEWBOX, "");
                    strList += strSVG;
                }
            }
        });

        if (strList && strList !== "") { //拼成完整svg 返回最终svg
            strList = PREFIX_SVG_NS + strList + SUFFIX_SVG;
            let contentType = mime[EXT] || MIME_SVG;
            res.writeHead(200, {"Access-Control-Allow-Origin": "*", 'Content-Type': contentType});
            res.write(strList, ENCODING_B);
            res.end();
            //存储最终svg
            //如果请求为png使徒文件，相同处理，进行存储
            // console.log(`${gExt} ${isPngRequest}`);
            // if (gExt === EXT || isPngRequest) { //正式的存Redis、存阿里云
            //     let result = false;
            //     while (!result) {
            //         result = await tools.putBuffer(genes + EXT, strList);
            //     }
            //     let svgFile = tempy.file({extension: 'svg'});
            //     let pngFile = tempy.file({extension: 'png'});
            //     fs.writeFileSync(svgFile, strList);
            //     console.log(`${tools.getTime()} ${svgFile} ${pngFile}`);
            //     await tools.generatePNG(svgFile, pngFile, genes);
            // }
        }
        else {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(`无效基因序列`);
        }
    }
};

let handleIllegalGenes = (req, res) => {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end(`非法基因序列`);
};


module.exports = {
    onRequest(req, res) {
        return tools.await(this, void 0, void 0, function* () {
                switch (req.method) {
                    case "OPTIONS":
                        handleOptionsRequest(res);
                        break;
                    case "POST":
                        handlePostRequest(req, res);
                        break;
                    default:
                        let isPngRequest = false;
                        let genesUrl = req.url;
                        let gExt = path.extname(genesUrl);
                        // 如果请求为使徒png文件，并且不是本地UI资源的,按照svg后缀进行处理
                        if (gExt === PNG && genesUrl.indexOf("/resource/assets") === -1) {
                            isPngRequest = true;
                            gExt = EXT;
                            genesUrl = genesUrl.replace(PNG, EXT);
                        } else if (genesUrl.indexOf("/gn") === 0 && gExt === EXT_E) { //编辑器 根据基因序列获取各大类名字
                            handleGetGeneName(req, res, genesUrl);
                        } else if (genesUrl.indexOf("/n") === 0 && gExt === EXT_E) { //编辑器的名字配置请求
                            handleGetEditorNameConfig(req, res, genesUrl);
                        } else if (genesUrl.indexOf("/c") === 0 && gExt === EXT_E) { //编辑器的颜色配置请求
                            handleGetEditorColorConfig(req, res, genesUrl);
                        } else if (!checkExt(gExt)) { //非svg、svge的其他文件
                            handleUnSupportFile(req, res);
                        } else if (gExt === EXT_E && genesUrl.indexOf("-") !== -1) {//是编辑器单基因的请求
                            handleSvgeRequest(req, res, genesUrl);
                        } else {
                            let genes = genesUrl.substr(1, genesUrl.length);  //提取基因序列,基因id序列号
                            genes = (gExt === EXT_E) ? genes.replace(EXT_E, "") : genes.replace(EXT, "");
                            if (!checkGenes(genes)) { //检查基因格式
                                handleIllegalGenes(req, res);
                            } else {//检查是否已生成过svg
                                let inputUrl = genes + EXT
                                handleSvgRequest(req, res, inputUrl, isPngRequest, genes, gExt);
                            }
                        }
                }
            }
        );
    }
};