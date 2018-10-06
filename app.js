const express = require('express');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const qn = require('qn');
let mysql = require("mysql");
const multiparty = require('multiparty');
const app = express();

app.use(express.static(__dirname + '/public'));//设置静态文件路径
app.set('views',path.join(__dirname,"./views"))
app.set('view engine','ejs')  //搜索引擎的配置

//配置七牛云
let bucket = 'photos'
let client = qn.create({
  accessKey:'4gfsshJTyiE7eRSvOhArGI2xc58bE2jOGmNBG86N',
  secretKey:'pn9HbbGEa0SHNX5syVFPFXuAdt2erPC-oyzJ7Qtk',
  bucket:bucket,
  origin:'pfw7bg8so.bkt.clouddn.com'
})

//配置数据库
var connection = mysql.createConnection({
  //host:'localhost',
  host:'127.0.0.1',   //无网络的情况下可连接 
  user:'root',
  password:'root',
  port:'3306',
  database:'zhuyang'
})
connection.connect();

app.get('/', function (req, res) {
    res.send('hello world')
})
app.get('/upload', function (req, res) {
    res.render('upload.ejs')
})
app.post('/upload/play', function (req, res) {
  connection.query('select * from photos_all WHERE name="zhuyang"',(err,response)=>{
    if(err) throw err;
    res.send(response[0]);
  });
})
app.post('/uploadFile',function(req,res){
    //生成multiparty对象，并配置上传目标路径
  var form = new multiparty.Form({uploadDir:path.join(__dirname,"./images")});
  form.parse(req, function(err, fields, files) {
    if(err){
      console.log('parse error: ' + err);
    } else {
      console.log("filesTmp",files);
      let oldPath = files.file[0].path;
      let imageUrlArr = files.file[0].originalFilename.split(".");
      let renameImg = new Date().getTime()+"."+imageUrlArr[imageUrlArr.length-1];
      client.uploadFile(oldPath,{key:`/avater/${renameImg}`},function(err1,result){
        if(err1){
          console.log("上传失败");
          res.json({
            status:1,
            msg:"error"
          })
        }else{
          var userModSql = 'UPDATE photos_all SET image = ? WHERE name = ?';
          var userModSql_Params = [result.url,'zhuyang'];
          console.log("result",result)
          connection.query(userModSql,userModSql_Params,function (err, resultx) {
             if(err){
                console.log('[UPDATE ERROR] - ',err.message);
                return;
             }       
            console.log('成功修改数据',resultx);

          });
          res.render('success.ejs');
        }
     })
     fs.unlink(oldPath)
    }
  });
});
app.listen('8888')