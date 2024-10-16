/**
 * 对数字进行补0操作
 * @param value 要补0的数值
 * @param length 要补的总长度
 * @return 补0之后的字符串
 */
function zeroize(value, length = 2) {
    let str = "" + value;
    let zeros = "";
    for (let i = 0, len = length - str.length; i < len; i++) {
        zeros += "0";
    }
    return zeros + str;
}
Object.defineProperties(Object.prototype, {
    copyto: {
        value: function (to) {
            for (let p in this) {
                to[p] = this[p];
            }
        },
        writable: true
    }
});
Object.defineProperties(Date.prototype, {
    format: {
        value: function (mask, local) {
            let d = this;
            return mask.replace(/"[^"]*"|'[^']*'|(?:d{1,2}|m{1,2}|yy(?:yy)?|([hHMs])\1?)/g, function ($0) {
                switch ($0) {
                    case "d": return gd();
                    case "dd": return zeroize(gd());
                    case "M": return gM() + 1;
                    case "MM": return zeroize(gM() + 1);
                    case "yy": return (gy() + "").substr(2);
                    case "yyyy": return gy();
                    case "h": return gH() % 12 || 12;
                    case "hh": return zeroize(gH() % 12 || 12);
                    case "H": return gH();
                    case "HH": return zeroize(gH());
                    case "m": return gm();
                    case "mm": return zeroize(gm());
                    case "s": return gs();
                    case "ss": return zeroize(gs());
                    default: return $0.substr(1, $0.length - 2);
                }
            });
            function gd() { return local ? d.getDate() : d.getUTCDate(); }
            function gM() { return local ? d.getMonth() : d.getUTCMonth(); }
            function gy() { return local ? d.getFullYear() : d.getUTCFullYear(); }
            function gH() { return local ? d.getHours() : d.getUTCHours(); }
            function gm() { return local ? d.getMinutes() : d.getUTCMinutes(); }
            function gs() { return local ? d.getSeconds() : d.getUTCSeconds(); }
        },
        writable: true
    }
});
//# sourceMappingURL=Extend.js.map