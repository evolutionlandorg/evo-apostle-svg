Apostle Configuration Server
============================

Make development config file first.

When requesting svge files, system operates in configuration mode, will not generate physical files.
When requesting svg or png files, system will generate final apostle image (svg and png version) and upload to remote oss storage.

    cp config/Debug.json.sample config/Debug.json

run in development mode
-----------------------
load `Debug.json`
  
    npm start
    
run in production mode
----------------------
load `Config.json`

    npm run production
----------------------
```
0x0001     00000 00000 00005 0001e 00005 00004 00003 0001c 00019 0001e 0000c 00001
             12   11   10      9     8     7     6     5     4     3     2     1

0b0000_0000_0000_ 00 0  1
                  15 14 13
                  
```
