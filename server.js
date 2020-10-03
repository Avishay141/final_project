//improts
const express = require("express");
const bodyParser = require("body-parser");
const xlsx = require("xlsx")
const upload = require('express-fileupload');
const excelToJson = require('convert-excel-to-json');
const ExcelJS = require('exceljs');
const FormulaParser = require('hot-formula-parser').Parser;

// Const Variables
const FAILURE = -1;
const SUCCESS = 0;
const EXCEL_FILE_PATH = __dirname +"/public/uploads/input.xlsx"
const ACTION_TYPE = "action_type";
const DOWNLOAD_FILE = "download_file";
const UPLOAD_FILE = "upload_file";
const GET_QUEST = "get_quest";
const AMERICAN = "אמריקאית";
const SLIDER = "סליידר";
const CHECK_BOX = "check box";
const FINAL_CALC_COL_NUM = 13;

const FIRST_ANS_COL_NUM = 3;
const LAST_ANS_COL_NUM = 12;

const FIRST_USER_ANS_COL_NUM = 18;
const LAST_USER_ANS_COL_NUM = 27;
const DIFF_OF_ANS_AND_USER_ANS_COL_INDEX = FIRST_USER_ANS_COL_NUM - FIRST_ANS_COL_NUM;



// -----------------------------------------------------------------------------//

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(upload());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

app.listen(process.env.PORT ||3000, function(){
    console.log("Server is running on port 3000!!!");
});


// Handling post request
app.post("/html_pages/management.html", function(req, res){
    action_type = req.body[ACTION_TYPE];
    console.log("action_type is: " + action_type);

    if (action_type == DOWNLOAD_FILE){
        /* Send the user the excel file from uploads directory */
        console.log("Sending the file input.xlsx to the user");
        res.download(__dirname +'/public/uploads/input.xlsx','input.xlsx');
    }
    else{
        console.log("Unknown post request");
        res.status(204).send()
    }
    
    console.log("@@@@@@@ got here")
});

app.post("/upload_file", async function(req, res){
    console.log("line 78: get a upload file request !!!!");
    upload_excel_file(req, res);


});

app.post("/calculate_answers", async function(req, res){
    console.log("get a calculate_answers request !!!!");
    console.log(req.body);
    var clusters = req.body;
    var tmp_file_path = write_answers_to_excel(clusters);
    var updated_clusters = await read_final_grade_and_update_clusters(tmp_file_path, clusters);
    var updated_clusters_json_object = JSON.stringify(updated_clusters);
    console.log("this is after calling read_final_grade_and_update_clusters()");
    //console.log(updated_clusters_json_object);
    res.json(updated_clusters);     //send the updated clusters back to the user

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
    res.sendFile(__dirname + "/public/html_pages/index.html");
});

// ------------------- Service Functions -------------------- 

function upload_excel_file(req, res){
    /*upload excel file to uploads folder
    return: success message if the file was uploaded successfully, else error message
    */

    if(req.files){
       console.log(req.files);
       var file = req.files.upload_file;
       var fname = file.name;
       console.log("file name: " + fname);

       file.mv(__dirname + "/public/uploads/" + fname , function(err){
           if(err){
            console.log("Failed to upload to file: " + fname);
                res.send(err);
           }
            else{
                console.log("file uploaded successfully");
                //res.sendStatus(200);
                res.send("file uploaded successfully");
            }
       })

   }
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
    var execl_file =  xlsx.readFile(__dirname + "/public/uploads/input.xlsx");
    var worksheet = execl_file.Sheets[execl_file.SheetNames[0]];

    for(var i = 0; i < clusters.length; i++){
        var curr_questions = clusters[i].questions;
        for(var j = 0; j < curr_questions.length; j++){
            curr_quest = curr_questions[j];
            if(curr_quest.question_type == CHECK_BOX){
                write_check_box_answers(curr_quest, worksheet)
            }
            else{
                var user_ans_cell = xlsx.utils.encode_cell({r:curr_quest.line, c:FIRST_USER_ANS_COL_NUM});
                worksheet[user_ans_cell].v = String(curr_quest.user_ans).trim();
            }
        }
    }

    //var random_num = String(Math.floor(Math.random() * 10000000));
    var random_num = "1";
    var res_file_path = __dirname + "/public/tmp/res"+random_num+".xlsx";
    xlsx.writeFile(execl_file, res_file_path);
    console.log("Finish writing answers to excel");
    return res_file_path;
}

function write_check_box_answers(quest, worksheet){
    var check_box_ans_arr = Array.from(quest.check_box_ans);
    for(var i =0; i < check_box_ans_arr.length; i++){
        var user_ans_col = get_user_ans_col(check_box_ans_arr[i], quest.line, worksheet)
        if(user_ans_col == FAILURE)
            console.log("Failed to write checkbox answers to excel file")
        else{
            var user_ans_cell =  xlsx.utils.encode_cell({r:quest.line, c:user_ans_col});
            worksheet[user_ans_cell].v = String(check_box_ans_arr[i]).trim();
        }
    }
}

function get_user_ans_col(user_ans, line_num, worksheet){
    for(var i = FIRST_ANS_COL_NUM; i <= LAST_ANS_COL_NUM ; i++){
        var ans_cell = xlsx.utils.encode_cell({r:line_num, c:i})
        if(worksheet[ans_cell].v.trim() == user_ans.trim())
            return i + DIFF_OF_ANS_AND_USER_ANS_COL_INDEX;
    }

    console.log("line 195: Failed to find the right user_ans column for answer: " + user_ans);
    return FAILURE
    
}

const parser = new FormulaParser();

 async function read_final_grade_and_update_clusters(res_file_path, clusters){
    console.log("!!! Entered read_final_grade_and_update_clusters");
    const execl_with_answers = new ExcelJS.Workbook();

    await execl_with_answers.xlsx.readFile(res_file_path).then(() => {
        console.log("!!! Entered then part");
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
                var final_calc_cell = xlsx.utils.encode_cell({r:curr_quest.line, c:FINAL_CALC_COL_NUM});
                curr_quest.grade = getCellResult(worksheet, final_calc_cell);
            }
        }
      
    });
    return clusters;
}

function getCellResult(worksheet, cellLabel) {
    if (worksheet.getCell(cellLabel).formula) {
      return parser.parse(worksheet.getCell(cellLabel).formula).result;
    } 
    else {
      return worksheet.getCell(cellCoord.label).value;
    }
  }