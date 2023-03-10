/*********************************************************************************
* WEB322 – Assignment 04
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students. *
* Name: _Harjot Singh Vasdev_ Student ID: _154870216_ Date: _March 10, 2023_ *
* Online (Cyclic) Link: https://itchy-deer-beanie.cyclic.app
* ********************************************************************************/

const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const data = require("./data-service.js");
// const bodyParser = require('body-parser');
const fs = require("fs");
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')

const app = express();

const HTTP_PORT = process.env.PORT || 8080;
  
cloudinary.config({
    cloud_name: 'dsgc8xz9e',
    api_key: '172819332412276',
    api_secret: 'jwtSzwwqrayjN5zmlNTmw4bhUyM',
    secure: true
});

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer();

app.engine('.hbs', exphbs.engine({ 
    extname: '.hbs',
    defaultLayout:'main',
    helpers:{
      navLink:function(url, options){
          return '<li' + 
          ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
          '><a href="' + url + '">' + options.fn(this) + '</a></li>';
      },
      equal:function(lvalue, rvalue, options){
          if(arguments.length<3)
              throw new Error("Handlerbars Helper equal needs 2 parameters");
          if(lvalue != rvalue){
              return options.inverse(this);
          } else{
              return options.fn(this);
          }
      }
    }
  }));

  app.use(function(req, res, next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

app.set('view engine', '.hbs');


app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req,res) => {
    res.render(path.join(__dirname, "/views/home.hbs"));
});

app.get("/about", (req,res) => {
    res.render(path.join(__dirname, "/views/about.hbs"));
});

app.get("/images/add", (req,res) => {
    res.render(path.join(__dirname, "/views/addImage.hbs"));
});

app.get("/students/add", (req,res) => {
    res.render(path.join(__dirname, "/views/addStudent.hbs"));
});

app.get("/images", (req,res) => {

    data.getImages().then((data) => {
        res.render("images", {images: data});
    }).catch((err) => {
        res.render("images",{ message: "no results" });
    });
});

app.get("/students", (req, res) => {
    if (req.query.status) {
        data.getStudentsByStatus(req.query.status).then((data) => {
            res.render("students", {students: data});
        }).catch((err) => {
            res.render("students", { message: "no results" });
        });
    } else if (req.query.program) {
        data.getStudentsByProgramCode(req.query.program).then((data) => {
            res.render("students", {students: data});
        }).catch((err) => {
            res.render("students", { message: "no results" });
        });
    } else if (req.query.credential) {
       data.getStudentsByExpectedCredential(req.query.credential).then((data) => {
        res.render("students", {students: data});
    }).catch((err) => {
        res.render("students", { message: "no results" });
       });
    } else {
        data.getAllStudents().then((data) => {
            res.render("students", {students: data});
        }).catch((err) => {
            res.render("students", { message: "no results" });
        });
    }
});

app.get("/student/:studentId", (req, res) => {
    data.getStudentById(req.params.studentId)
        .then(data => {
            res.render("student", { student: data });
        })
        .catch(err => {
            res.render("student",{message: "no results"});
        });
});
app.get("/intlstudents", (req,res) => {
    data.getInternationalStudents().then((data)=>{
        res.json(data);
    });
});

app.get("/programs", (req,res) => {
    data.getPrograms().then((data)=>{
        res.render("programs", {programs: data});
    });
});


app.post("/students/add", (req, res) => {
    data.addStudent(req.body).then(()=>{
      res.redirect("/students");
    });
});

app.post("/student/update", (req, res) => {    
    data.updateStudent(req.body)
        .then(() => {
            res.redirect("/students");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error updating student.");
        });
});


app.post("/images/add", upload.single("imageFile"), (req,res) =>{
    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
    
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
    
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }
    
        upload(req).then((uploaded)=>{
            processForm(uploaded.url);
        });
    }else{
        processForm("");
    }

    function processForm(imageUrl){
        
        data.addImage(imageUrl).then(img=>{ 
            res.redirect("/images");
        }).catch(err=>{
            res.status(500).send(err);
        })
    }   
    
});


app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });

data.initialize().then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});