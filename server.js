//improts
const express = require("express");
const bodyParser = require("body-parser");
const xlsx = require("xlsx")
const upload = require('express-fileupload');
const excelToJson = require('convert-excel-to-json');

// Const Variables
const RC_SUCCESS = 0;
const RC_FAILED = 1;
const EXCEL_FILE_PATH = __dirname +"/uploads/input.xlsx"
const ACTION_TYPE = "action_type";
const DOWNLOAD_FILE = "download_file";
const UPLOAD_FILE = "upload_file";
const START_QUEST = "start_quest";

// -----------------------------------------------------------------------------//

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(upload());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('html_pages'));


app.listen(4000, function(){
    console.log("server started on port 4000 @@@@");
});

// Handling post request
app.post("/management.html", function(req, res){
    action_type = req.body[ACTION_TYPE];
    console.log("action_type is: " + action_type);
    if (action_type == UPLOAD_FILE){
         upload_excel_file(req, res);
    }
    else if (action_type == DOWNLOAD_FILE){
        download_excel_file(req,res);
    }
    else if (action_type == "test"){
        var json_object = convert_excel_to_json();
        res.render("questionnaire" , {the_excel_file: JSON.stringify(json_object)});
    }
    else{
        console.log("Unknown post request");
        res.status(204).send()
    }
    
    console.log("@@@@@@@ got here")
});

app.post("/questionnaire.html", function(req, res){
    action_type = req.body[ACTION_TYPE];
    console.log("action_type is: " + action_type);

     if (action_type == START_QUEST){
        var json_object = convert_excel_to_json();
        res.render("questionnaire" , {the_excel_file: JSON.stringify(json_object)});
    }
    else if (action_type == "test"){
        var json_object = convert_excel_to_json();
        res.render("questionnaire" , {the_excel_file: JSON.stringify(json_object)});
    }
    else{
        console.log("Unknown post request");
        res.status(204).send()
    }
    
    console.log("@@@@@@@ got here")
});

// Send the home page to the user
app.get("/", function(req, res){
    res.sendFile(__dirname + "/html_pages/index.html");
});

// ------------------- Service Functions -------------------- 

function upload_excel_file(req, res){
    /*upload excel file the uploads folder
    return: RC_SUCCESS if the file was uploaded successfully, else RC_FAILED
    return_typ: int */

    if(req.files){
       console.log(req.files);
       var file = req.files.testFile;
       var fname = file.name;
       console.log("file name: " + fname);

       file.mv('./uploads/'+ fname , function(err){
           if(err){
            console.log("Failed to upload to file: " + fname);
                res.send(err);
                return RC_FAILED;
           }
            else{
                console.log("file uploaded successfully");
                //res.sendStatus(200);
                res.send("file uploaded successfully");
            }
       })

   }
}

function download_excel_file(req, res){
    /* Send the user the excel file from uploads directory */
    console.log("Sending the file input.xlsx to the user");
    res.download(__dirname +'/uploads/input.xlsx','input.xlsx');
}

function xl_func(){
    console.log("path is: " + __dirname)
    var workbook =  xlsx.readFile("./uploads/input.xlsx");

    var first_sheet_name = workbook.SheetNames[0];
    console.log(first_sheet_name)
    var worksheet = workbook.Sheets[first_sheet_name];


    var cell = worksheet['A2'].v;
    console.log(cell);

    // modify value in D4
    worksheet['L2'].v = 'הרבה';

    xlsx.writeFile(workbook, "./uploads/res.xlsx");

    ////////////////////////////////

    workbook =  xlsx.readFile("./uploads/res.xlsx");
    cell = worksheet['L2'].v;
    console.log("L2 cell is: " + cell);

}

function convert_excel_to_json(){
    console.log("!!!!!!! EXCEL_FILE_PATH: " + EXCEL_FILE_PATH);
    var json_object = excelToJson({
        sourceFile: EXCEL_FILE_PATH
    });
    console.log("json_excel: " + json_object);
    return json_object;
}
