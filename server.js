//improts
const express = require("express");
const bodyParser = require("body-parser");
const xlsx = require("xlsx")
const upload = require('express-fileupload');
const excelToJson = require('convert-excel-to-json');
const ExcelJS = require('exceljs');
const FormulaParser = require('hot-formula-parser').Parser;
const {Storage} = require('@google-cloud/storage');
const fs = require("fs")

// Const Variables
const storage = new Storage({ 
    keyFilename: "nutrition-fbeec-firebase-adminsdk-47lpv-5de40ebb8a.json",
    projectId: "nutrition-fbeec"
});
const bucketName = "nutrition-fbeec.appspot.com"
const EXCEL_STORAGE_FILE_PATH = "files/input.xlsx"
const EXCEL_STORAGE_INSTRUCTIONS_FILE_PATH = "files/instructions.pdf"

const NA = 'NA'
const NOT_ANSWERD = -99;
const FAILURE = -1;
const ACTION_TYPE = "action_type";
const DOWNLOAD_EXCEL_DB =  "download_excel_db";
const DOWNLOAD_INSTRUCTIONS = "download_instructions";
const AMERICAN = "אמריקאית";
const SLIDER = "סליידר";
const CHECK_BOX = "check box";
const FINAL_CALC_COL_NUM = 13;

const FIRST_ANS_COL_NUM = 3;
const LAST_ANS_COL_NUM = 12;

const FIRST_USER_ANS_COL_NUM = 20;
const DIFF_OF_ANS_AND_USER_ANS_COL_INDEX = FIRST_USER_ANS_COL_NUM - FIRST_ANS_COL_NUM;

const NAME = "name";
const GENDER = "gender";
const USER_EMAIL = "userEmail";
const GRADE = "grade";
const CLUSTERS_TEST = "clusters_test";
const CLUSTER_QUESTIONS = "cluster_questions";
const QUESTION = "question";
var ANS = "ans";

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

    if(action_type == DOWNLOAD_EXCEL_DB){
        console.log("Sending the file db.xlsx to the user");
        res.download(__dirname +'/public/tmp/db.xlsx','db.xlsx');
    }
    else if (action_type == DOWNLOAD_INSTRUCTIONS){
        send_instructions(req, res);
    }
    else{
        console.log("Unknown post request");
        res.status(204).send()
    }
    
    console.log("@@@@@@@ got here")
});

app.post("/get_updated_excel", async function(req, res){
    console.log("get_updated_excel was called !!!!");
    user_id = parse_user_id(req)
    var destFilename = get_user_excel_file_name(user_id);

    console.log("Getting excel file for user " + user_id);
    var file_path = EXCEL_STORAGE_FILE_PATH;
    const options = {
    // The path to which the file should be downloaded, e.g. "./file.txt"
    destination: destFilename,
    };

    // Downloads the file
    await storage.bucket(bucketName).file(file_path).download(options);
    res.send("Got excel file for user " + user_id);
});


app.post("/calculate_answers", async function(req, res){
    console.log("get a calculate_answers request !!!!");
    var data = req.body;
    var user_id = data.user_id;
    var clusters = data.all_clusters;
    var tmp_file_path = write_answers_to_excel(user_id, clusters);
    var updated_clusters = await read_final_grade_and_update_clusters(tmp_file_path, clusters);
    remove_file(tmp_file_path)
    remove_file(get_user_excel_file_name(user_id))
    console.log("this is after calling read_final_grade_and_update_clusters()");
    res.json(updated_clusters);     //send the updated clusters back to the user

});


app.post("/convert_to_ecxel", function(req, res){
    console.log("!!! got a convert_to_ecxe")
    var json_data = req.body;
    var arr = [];
    var users_id = Object.keys(json_data);

    for(var i =0; i<users_id.length; i++ ){
        var key = users_id[i];
        var user_data = create_2_dim_object(json_data[key]);
        arr.push(user_data);
    }

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@");
    var wb = xlsx.utils.book_new();
    var ws = xlsx.utils.json_to_sheet(arr);
 
    
    xlsx.utils.book_append_sheet(wb, ws, "data");
    xlsx.writeFile(wb, __dirname + "/public/tmp/db.xlsx");
    res.send("good");


});

async function send_instructions(req, res){
    console.log("get_instructions was called !!!!");


    destFilename =  './public/tmp/instructions.pdf';
    
    var file_path = EXCEL_STORAGE_INSTRUCTIONS_FILE_PATH;
    const options = {
    // The path to which the file should be downloaded, e.g. "./file.txt"
    destination: destFilename,
    };

    // Downloads the file
    await storage.bucket(bucketName).file(file_path).download(options);
    // res.download(destFilename,'instructions.pdf');
    res.download(destFilename,'instructions.pdf');
}


function create_2_dim_object(user_object){
    res= {};
    res[NAME] = user_object[NAME];
    res[USER_EMAIL] = user_object[USER_EMAIL];
    res[GENDER] = user_object[GENDER];
    res[GRADE] = user_object[GRADE];

    var clusters_test = user_object[CLUSTERS_TEST];
    if(!clusters_test)
        return res;

    for(var i =0; i < clusters_test.length; i++){
        var cluster_questions = clusters_test[i][CLUSTER_QUESTIONS];

        for(var j = 0; j < cluster_questions.length; j++){
            var tmp_quest = cluster_questions[j];
            if(typeof(tmp_quest[ANS]) == typeof([]))
              res[tmp_quest[QUESTION]] = tmp_quest[ANS].join(', ');
            else
                res[tmp_quest[QUESTION]] = tmp_quest[ANS];
        }
    }

    return res;
}


app.post("/get_questions", function(req, res){
    console.log("@@@ got a tt get request");
    var user_id = parse_user_id(req);
    var excel_json_obj = convert_excel_to_json(user_id);
    var excel_json_string = JSON.stringify(excel_json_obj)
    res.send(excel_json_string);
 
});

// Handling get request

// Send the home page to the user
app.get("/", function(req, res){
    res.sendFile(__dirname + "/public/html_pages/index.html");
});

// ------------------- Service Functions -------------------- 

function convert_excel_to_json(user_id){
    var user_excel_file_name = get_user_excel_file_name(user_id);
    console.log("!!!!!!! user_excel_file_name: " + user_excel_file_name);
    var json_object = excelToJson({
        sourceFile: user_excel_file_name
    });
    console.log("json_excel: " + json_object);
    return json_object;
}

function write_answers_to_excel(user_id, clusters){
    var user_excel_file_name = get_user_excel_file_name(user_id);
    var execl_file =  xlsx.readFile(user_excel_file_name);
    var worksheet = execl_file.Sheets[execl_file.SheetNames[0]];

    for(var i = 0; i < clusters.length; i++){
        var curr_questions = clusters[i].questions;
        for(var j = 0; j < curr_questions.length; j++){
            curr_quest = curr_questions[j];
            if(curr_quest.question_type == CHECK_BOX){
                write_check_box_answers(curr_quest, worksheet)
            }
            else{
                var user_ans_cell = xlsx.utils.encode_cell({r:curr_quest.line-1, c:FIRST_USER_ANS_COL_NUM});
                worksheet[user_ans_cell].v = String(curr_quest.user_ans).trim();
            }
        }
    }

    var res_file_path = __dirname + "/public/tmp/res"+user_id+".xlsx";
    xlsx.writeFile(execl_file, res_file_path);
    console.log("Finish writing answers to excel");
    return res_file_path;
}

function write_check_box_answers(quest, worksheet){
    var check_box_ans_arr = Array.from(quest.check_box_ans);
    for(var i =0; i < check_box_ans_arr.length; i++){
        var user_ans_col = get_user_ans_col(check_box_ans_arr[i], quest.line-1, worksheet)
        if(user_ans_col == FAILURE)
            console.log("Failed to write checkbox answers to excel file")
        else{
            var user_ans_cell =  xlsx.utils.encode_cell({r:quest.line-1, c:user_ans_col});
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
                var final_calc_cell = xlsx.utils.encode_cell({r:curr_quest.line-1, c:FINAL_CALC_COL_NUM});
                curr_quest.grade = getCellResult(worksheet, final_calc_cell);
                if(curr_quest.question_type != CHECK_BOX)
                    update_recomendation_in_quest_obj(worksheet, res_file_path, curr_quest);

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

  function update_recomendation_in_quest_obj(res_file_path,res_file_path, curr_quest){
    if(curr_quest.user_ans == NOT_ANSWERD)
        return;

    var execl_file =  xlsx.readFile(res_file_path);
    var worksheet_A = execl_file.Sheets[execl_file.SheetNames[0]];
    var worksheet_B = execl_file.Sheets[execl_file.SheetNames[1]];
    var ans_cell = xlsx.utils.encode_cell({r:curr_quest.line-1, c:FIRST_USER_ANS_COL_NUM});
    if(curr_quest.question_type == SLIDER){
        // calculating the relevant col num in the recomoendation sheet according to the answer number
        var rec_col = Math.ceil(parseInt(worksheet_A[ans_cell].v, 10)/10) * 2;
    }else{
        for(var i = FIRST_ANS_COL_NUM; i <= LAST_ANS_COL_NUM; i++ ){
            var tmp_cell = xlsx.utils.encode_cell({r:curr_quest.line-1, c:i});
            if(worksheet_A[tmp_cell].v.trim() == worksheet_A[ans_cell].v.trim()){
                 // calculating the relevant col num in the recomoendation sheet according to the answer number
                var rec_col = (i-2)*2 -1;
                break;
            }
        }
    }

    var rec_cell = xlsx.utils.encode_cell({r:curr_quest.line-1, c:rec_col});
    var rec_val = worksheet_B[rec_cell].v;
    if(rec_val == NA){
        console.log("No recomondation for this answer. question: " + curr_quest.line-1 + ", answer: " + curr_quest.user_ans);
        return;
    }
        
    try {
        curr_quest.recomendation = rec_val.split('$')[0].trim();
        curr_quest.recomendation_link = rec_val.split('$')[1].trim();
        // the delimiter that seperate the recomendation and the recomenation link in the excel file is '$'
      }
      catch(err) {
        console.log("ERROR: The recomendation for question number: " + curr_quest.line-1 + " is not written in the right foramt.");
        console.log("The relevant cell in file: " + rec_val);
        console.log("The correct foramt is: 'link : recomendation'");
        console.log("For example: www.telhai.co.il : מומלץ להפחית סוכר");
        console.log(err.message)
      }

  }

function parse_user_id(req){
    var json_data = req.body;
    var user_id_key = Object.keys(json_data)[0];
    var user_id =  json_data[user_id_key];
    return user_id;
}

function get_user_excel_file_name(user_id){
    return './public/tmp/input'+user_id+'.xlsx';
}

function remove_file(file_path){
    try {
         fs.unlinkSync(file_path)
    //file removed
    } catch(err) {
        console.error(err)
    }
}