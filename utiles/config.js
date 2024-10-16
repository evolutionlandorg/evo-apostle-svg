const fs = require("fs");
const tools = require("./tools");
const Cfg = require("./Cfg");
const ENCODING_U = "utf8";

function loadCfg(cfgPath) {
    Cfg.serverPort = process.env.SERVER_PORT || "1337";
}

function loadGeneRegCfg(cfgPath) {
    let json = fs.readFileSync(cfgPath, ENCODING_U);
    let obj = JSON.parse(json);

    let zGeneTypeArr = [];
    obj.geneTypeArr.forEach(function (item) {//整理小基因arr
        if (item["z"] !== undefined) {
            zGeneTypeArr.push(item);
        }
    });


    let geneTypeArrByBigObj = {}; //整理大基因包含小基因obj
    obj.bigGeneTypeArr.forEach(function (item) {
        geneTypeArrByBigObj[item.id] = item.cids;
    });

    //整理颜色属性obj
    let colorAttrObj = {};
    obj.colorAttrArr.forEach(function (item) {
        colorAttrObj[item.id] = item.attr;
    });

    Cfg.bigGeneTypeArr = obj.bigGeneTypeArr; //身体大基因
    Cfg.geneRegArr = obj.geneRegArr; //种族，性别
    Cfg.zChangeObj = obj.zChange; // todo
    Cfg.zGeneTypeArr = zGeneTypeArr;//小基因arr
    Cfg.geneTypeArrByBigObj = geneTypeArrByBigObj; //大基因包含小基因obj {id=>cids}cids 是各个部件的id
    Cfg.colorAttrObj = colorAttrObj; //颜色属性obj {id=>attr}
    console.log("LoadGeneRegCfg OK !\n");
}

function parseGeneMapping(obj) {
    let geneTypeArrByBigObj = Cfg.geneTypeArrByBigObj; // {大类型id=>小类型数组cids}
    for (let rs in obj) { //加工程序方便使用的配置格式
        if (!obj.hasOwnProperty(rs)) { //
            continue
        }
        let btObj = obj[rs]; // 种族男女
        for (let bt in btObj) { //bt =>大类型
            if (!btObj.hasOwnProperty(bt)) {
                continue
            }
            let vObj = btObj[bt]; //大类型值object arr
            for (let cv in vObj) {
                if (!vObj.hasOwnProperty(cv)) {
                    continue
                }
                let cvObj = vObj[cv];//小类型 {cValues:[],name,name_en}
                let cvArr = cvObj["cValues"];// cValues color是16进制颜色数组，genes是值数组
                let cidArr = geneTypeArrByBigObj[bt];
                if (cidArr !== undefined) {
                    cidArr.forEach(function (item, i) {
                        cvArr !== undefined ? cvObj[item] = cvArr[i] : 0; //item是cid 对应的颜色/部件的类型
                    })
                }
            }
        }
    }
}

function loadGeneColorCfg(cfgPath) {
    let json = fs.readFileSync(cfgPath, ENCODING_U); //种族男女->轮廓特征头发眼睛颜色->颜色值数组->
    console.log("LoadGeneColorCfg OK !\n");
    let cObj = JSON.parse(json);
    let ciObj = Cfg.geneColorInitObj = tools.deepClone(cObj); //保存初始配置格式

    parseGeneMapping(cObj);
    let giObj = Cfg.geneInitObj; //初始颜色配置加入到初始基因配置中，汇总
    for (let rs in ciObj) {
        if (!ciObj.hasOwnProperty(rs)) {//大类
            continue
        }
        let rsObj = ciObj[rs];
        for (let bt in rsObj) {
            if (!rsObj.hasOwnProperty(bt)) {//小类
                continue
            }
            if (giObj[rs] !== undefined) {
                giObj[rs][bt] = rsObj[bt]; //基因加上对应颜色的配置
            }
        }
    }
    let obj = Cfg.geneObj; //颜色配置加入到基因配置中，汇总
    for (let rs in cObj) {
        if (!cObj.hasOwnProperty(rs)) { //大类
            continue
        }
        let rsObj = cObj[rs];   //小类
        for (let bt in rsObj) {
            if (!rsObj.hasOwnProperty(bt)) {
                continue
            }
            if (giObj[rs] !== undefined) {
                obj[rs][bt] = rsObj[bt];////基因加上对应颜色的配置
            }
        }
    }
    console.log("ParseGeneColorCfg OK !\n");
}

module.exports = {
    LoadGlobalConfig() {
        loadCfg();
    },
    LoadGeneRegConfig(configPath) {
        loadGeneRegCfg(configPath);
    },
    LoadGeneCfg(configPath) {
        let json = fs.readFileSync(configPath, ENCODING_U);
        let obj = Cfg.geneObj = JSON.parse(json);
        Cfg.geneInitObj = tools.deepClone(obj); //保存初始配置格式
        parseGeneMapping(obj);
        console.log("LoadGeneCfg OK !\n");
    },
    LoadGeneColorConfig(configPath) {
        loadGeneColorCfg(configPath);
    },
};