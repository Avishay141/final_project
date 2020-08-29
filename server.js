const express = require("express");
const bodyParser = require("body-parser");
const xlsx = require("xlsx")

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'))
app.use(express.static('views'))

app.get("/", function(req, res){
    res.sendFile(__dirname + "/views/index.html");
});


app.post("/management.html", function(req, res){
   
    console.log("path is: " + __dirname)
    var workbook =  xlsx.readFile("input.xlsx");

    var first_sheet_name = workbook.SheetNames[0];
    console.log(first_sheet_name)
    var worksheet = workbook.Sheets[first_sheet_name];


    var cell = worksheet['A2'].v;
    console.log(cell);

    // modify value in D4
    worksheet['L2'].v = 'הרבה';

    xlsx.writeFile(workbook, "res.xlsx");

    ////////////////////////////////

    workbook =  xlsx.readFile("res.xlsx");
    cell = worksheet['L2'].v;
    console.log("L2 cell is: " + cell);

    res.sendFile( __dirname + "/views/management.html");

});


app.listen(4000, function(){
    console.log("server started on port 4000 @@@");
});