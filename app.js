//app.js
const express = require('express');
const multer = require("multer");
const app = express();
const port = 8888;
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('uploads'));
//Setting storage engine
const storageEngine = multer.diskStorage({
    destination: "./images",
    filename: (req, file, cb) => {
    cb(null, `${Date.now()}--${file.originalname}`);
    },
    });
//initializing multer
const upload = multer({
    storage: storageEngine,
    limits: { fileSize: 1000000 },
    });
    const path = require("path");

    const checkFileType = function (file, cb) {
    //Allowed file extensions
    const fileTypes = /jpeg|jpg|png|heic|svg/;
    
    //check extension names
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    
    const mimeType = fileTypes.test(file.mimetype);
    
    if (mimeType && extName) {
    return cb(null, true);
    } else {
    cb("Error: You can Only Upload Images!!");
    }
    };

    app.post('/profile-upload-single', upload.single('profile-file'), function (req, res, next) {
        // req.file is the `profile-file` file
        // req.body will hold the text fields, if there were any
        console.log(JSON.stringify(req.file))
        var response = '<a href="/">Home</a><br>'
        response += "Files uploaded successfully.<br>"
        response += `<img src="${req.file.path}" /><br>`
        return res.send(response)
      })
      app.post('/profile-upload-multiple', upload.array('profile-files', 12), function (req, res, next) {
        // req.files is array of `profile-files` files
        // req.body will contain the text fields, if there were any
        var response = '<a href="/">Home</a><br>'
        response += "Files uploaded successfully.<br>"
        for(var i=0;i<req.files.length;i++){
            response += `<img src="${req.files[i].path}" /><br>`
        }
        
        return res.send(response)
    })
    app.listen(port, ()=>{
        console.log(`App is listening on port ${port}`);
        });
        