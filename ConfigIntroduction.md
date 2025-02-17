
# GeneConfig说明
### config文件配置说明
```
{
    "20":                           //种族+性别：第一位-["人族","","异形"]；第二位-["女","男"]
                                    //20代表异形女性，21代表异形男性，00代表人类女性，01代表人族男性
     {
        "1": {                      //大类型：["轮廓","轮廓颜色","特征","特征颜色","头发","头发颜色","眼睛","眼睛颜色","表情","背景"]
                                    //1代表轮廓，2代表轮廓颜色，3代表特征，4代表特征颜色，5代表头发，6代表头发颜色，7代表眼睛，8代表眼睛颜色，9代表表情，10代表背景
        
            "0": {                  //大类型中的小类型（以轮廓为例）：[a标准三角,a双色标三，a性感运动....]
                                    //0代表大类型的第一个小类型，1代表大类型第二个小类型，以此类推...
            
                "cValues": [        //部件文件参数路径设置：由其中的各个小部件拼接成一个完整的图片，
                                    //每个大类型都不同，源文件解释非常乱，具体参数设置下面再详解
                    1,
                    1,
                    1,
                    1,
                    0,
                    0,
                    0,
                    0,
                    0
                ],
                "name": "a标准三角"  //大类型中小类型的名称
            }

```
#### 详解cValues
在GeneRegConfig.json文件中有对应的文件路径，用于设置小部件文件路径
```
{
            "id": 1,            //大类型id
            "name": "轮廓",     //大类型名称
            "len": 20,          //基因位长度
            "d0len": 5,         //d0位长度，显性基因
            "r1len": 5,         //r1位长度
            "r2len": 5,         //r2位长度
            "r3len": 5,         //r3位长度
            "cids": [           //cValues对应位数，
                                图片组件路径为/种族/性别/cids/cvalues.svg
                1,
                27,
                39,
                41,
                35,
                37,
                19,
                12
            ]
        },
```

geneConfig与geneRegConfig结合,该形象由以下组件组成：
```
                2/0/1/1.svg,
                2/0/27/1.svg,
                2/0/39/1.svg,
                2/0/41/1.svg,
                2/0/35/0.svg,
                2/0/37/0.svg,
                2/0/19/0.svg,
                2/0/12/0.svg
```

##### 具体组件文件夹的含义在GeneRegConfig.json里面的"geneTypeArr"中
```
{
            "name": "头",    // 中文名，意思是组件1文件夹存的都是头
            "id": 1,    // 意思是组件1文件夹
            "z": 20,
            "en": "head",   // 英文名
            "len": 2,
            "cid": 2
        },

```

### 图片配置说明：
https://gitlab.com/itering/evolution-land/apostle_svg/tree/master/种族/性别/组件类文件夹/组件文件名.svg



### 例子
如果要修改的话，先找到对应的部位，

以 增加  异形  女性  背景  第100小类 为例

#### json文件查找:
- 找到GeneRegConfig.json文件
- 找到10背景结构
```
"10":...
{
            "id": 10,
            //大类型id
            "name": "轮廓",     //大类型名称
            "len": 20,          //基因位长度
            "d0len": 5,         //d0位长度，显性基因
            "r1len": 5,         //r1位长度
            "r2len": 5,         //r2位长度
            "r3len": 5,         //r3位长度
            "cids": [           //cValues对应位数，
                                图片组件路径为/种族/性别/47/cvalues.svg
                47
            ]
        },
```
找到背景图片配置文件在47文件夹，cvalue配置结构为数组第一位


#### config文件配置
- 先找到第一层20：异形+女性     
- 再找到第二层10：背景
- 然后增加一项第100小类的组件配置和姓名

```
{
    "20":   
    ...                       
     {
        "10": {                      
        
            "99": {                  
            
                "cValues": [        
                    100,0,0,0,0,0,0,0,0
                ],
                "name": "（新）第100类背景"  
            }

```
#### 图片文件配置：

增加图片：https://gitlab.com/itering/evolution-land/apostle_svg/tree/master/2/0/47/100.svg

