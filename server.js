//improts
const express = require("express");
const bodyParser = require("body-parser");
const xlsx = require("xlsx")
const upload = require('express-fileupload');
const excelToJson = require('convert-excel-to-json');
const ExcelJS = require('exceljs');
const FormulaParser = require('hot-formula-parser').Parser;

// Const Variables
const RC_SUCCESS = 0;
const RC_FAILED = 1;
const EXCEL_FILE_PATH = __dirname +"/uploads/input.xlsx"
const ACTION_TYPE = "action_type";
const DOWNLOAD_FILE = "download_file";
const UPLOAD_FILE = "upload_file";
const GET_QUEST = "get_quest";
const AMERICAN = "אמריקאית";
const SLIDER = "סליידר";
const CHECK_BOX = "check box";
const USER_ANSWER_COL = 0; // in sheet B
const FINAL_CALC_COL = 13;

// -----------------------------------------------------------------------------//

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(upload());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('html_pages'));
app.use(express.json());


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

app.post("/calculate_answers", function(req, res){
    console.log("get a calculate_answers request !!!!");
    console.log(req.body);
    var clusters = req.body;
    var tmp_file_path = write_answers_to_excel(clusters);
    var updated_clusters = read_final_grade_and_update_clusters(tmp_file_path, clusters);
    var updated_clusters_json_object = JSON.stringify(updated_clusters);
    res.send(updated_clusters_json_object);     //send the updated clusters back to the user

});
// Handling get request
app.get("/get_questions", function(req, res){
    console.log("@@@ got a tt get request");
    var excel_json_obj = convert_excel_to_json();
    var excel_json_string = JSON.stringify(excel_json_obj)
    res.send(excel_json_string);
 
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

function convert_excel_to_json(){
    console.log("!!!!!!! EXCEL_FILE_PATH: " + EXCEL_FILE_PATH);
    var json_object = excelToJson({
        sourceFile: EXCEL_FILE_PATH
    });
    console.log("json_excel: " + json_object);
    return json_object;
}

function write_answers_to_excel(clusters){
    var execl_file =  xlsx.readFile("./uploads/input.xlsx");
    var worksheet = execl_file.Sheets[execl_file.SheetNames[0]];

    for(var i = 0; i < clusters.length; i++){
        var curr_questions = clusters[i].questions;
        for(var j = 0; j < curr_questions.length; j++){
            curr_quest = curr_questions[j];
            if(curr_quest.question_type == CHECK_BOX){
                console.log("this is a check box question");
            }
            else{
                var user_ans_cell = xlsx.utils.encode_cell({r:curr_quest.line, c:USER_ANSWER_COL});
                
                worksheet[user_ans_cell].v = String(curr_quest.user_ans).trim();
                console.log("user_ans_cell: " + user_ans_cell + ", wiriting: " + worksheet[user_ans_cell].v);
            }
        }
    }

    //var random_num = String(Math.floor(Math.random() * 10000000));
    var random_num = "1";
    var res_file_path = "./tmp/res"+random_num+".xlsx";
    xlsx.writeFile(execl_file, res_file_path);
    console.log("Finish writing answers to excel");
    return res_file_path;
}

const parser = new FormulaParser();

function read_final_grade_and_update_clusters(res_file_path, clusters){

    const execl_with_answers = new ExcelJS.Workbook();
    
    execl_with_answers.xlsx.readFile(res_file_path).then(() => {
        var worksheet = execl_with_answers.getWorksheet(1);
        parser.on('callCellValue', function(cellCoord, done) {
        if (worksheet.getCell(cellCoord.label).formula) {
            done(parser.parse(worksheet.getCell(cellCoord.label).formula).result);
        } else {
            done(worksheet.getCell(cellCoord.label).value);
        }
        });

        for(var i = 0; i < clusters.length; i++){
            var curr_questions = clusters[i].questions;
            for(var j = 0; j < curr_questions.length; j++){
                curr_quest = curr_questions[j];
                if(curr_quest.question_type == CHECK_BOX){
                    console.log("this is a check box question");
                }
                else{
                    var final_calc_cell = xlsx.utils.encode_cell({r:curr_quest.line, c:FINAL_CALC_COL});
                    curr_quest.grade = getCellResult(worksheet, final_calc_cell);
    
                    console.log("final cell " + final_calc_cell + "value : " + curr_quest.grade);
    
                }
            }
        }

        return clusters;
    });
}

function getCellResult(worksheet, cellLabel) {
    if (worksheet.getCell(cellLabel).formula) {
      return parser.parse(worksheet.getCell(cellLabel).formula).result;
    } else {
      return worksheet.getCell(cellCoord.label).value;
    }
  }