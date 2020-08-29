
  const db = firebase.database();
  const files_storage = firebase.storage();
  var questions_list = [];
  var MAX_NUM_OF_ANSWERS = 5;
  var question_to_delete_id;
  var newFileName="";

  var current_excel_file_name = "";

  db.ref("excel_file_name/").on("value", get_excel_file_name);



firebase.auth().onAuthStateChanged(function(user) {
  if (!user) {

     window.location = "index.html";
  } else {
    userID = user.uid;
    console.log("this line shoud be executed once for each login");
  }
});


function get_userID_from_url() {
  var res = location.search.substring(1).split("=")[1];
  console.log("userID from url: " + res);
  return res;
}

$("#logout_btn").on("click", function () {
  firebase.auth().signOut();
});


$("#move_to_main").on("click", function () {
  window.location = "questionnaire.html?uid="+userID;
});



$("#quest_btn").on("click",function(){

  document.getElementById("replyPanel_id").hidden = true;
  document.getElementById("add_questions_id").hidden = false;
  document.getElementById("edit_questions_id").hidden = false;

   
});

$("#users_btn").on("click",function(){

  document.getElementById("add_questions_id").hidden = true;
  document.getElementById("edit_questions_id").hidden = true;
  document.getElementById("replyPanel_id").hidden = false;
   
});

var real_upload_file_btn = document.getElementById("real_upload_file_btn");

$("#upload_excel_btn").on("click",function(event){
  real_upload_file_btn.click();
});

$("#real_upload_file_btn").on("change",function(event){
  console.log("I was here qqqqqqqqqqq");
  if(!real_upload_file_btn.value){
    console.log("exiting function");
    return;
  }

  newFileName = real_upload_file_btn.files[0].name;
  console.log("newFileName: " + newFileName);
  var span = document.getElementById("span_text");
  span.innerHTML = newFileName;

});

$("#save_btn").on("click",function(event){
  update_excel_file();
});


function update_excel_file(){
  var path = "files/"+ current_excel_file_name;
  var storage_ref = files_storage.ref(path);
  // deleting the old excel file
  if(newFileName != ""){
    storage_ref.delete().then(function() {
      console.log("deleting  the old excel file, file deleted: " + current_excel_file_name);
    }).catch(function(error) {
      console.log(error);
    });
  }

  // uplaoding the new image to the storage DB
  //storage_ref = files_storage.ref("files/"+ newFileName);
  storage_ref = files_storage.ref("files/"+ newFileName);
  storage_ref.put(real_upload_file_btn.files[0]);

  db.ref("/").update({excel_file_name: newFileName});


}



function get_excel_file_name(data){
  current_excel_file_name = data.val();
  console.log("@@@@@@@@ excel_name: " + current_excel_file_name);
}






