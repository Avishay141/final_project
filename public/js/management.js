// //const JSONToCSV = require("json2csv").parse;
// // const FileSystem = require("fs");
// const xlsx = require("xlsx");

var db = firebase.database();

firebase.auth().onAuthStateChanged(function(user) {
  if (!user) {

     window.location = "../html_pages/index.html";
  } else {
    userID = user.uid;
    console.log("this line shoud be executed once for each login");
  }
});



async function create_admins_list(){
  $('.list-group').empty();
  var a =  await db.ref('Users').orderByChild('admin').equalTo(true).on("child_added" ,async function(snapshot) {
    var value = await snapshot.val();
    $('.list-group').append("<li class='list-group-item list-group-item-primary'> <b>" + "Name: "+'</b>'+value.name+ '<b>'+"  Email: " +'</b>' +value.userEmail +"</li>");
  });

}

function get_userID_from_url() {
  var res = location.search.substring(1).split("=")[1];
  console.log("userID from url: " + res);
  return res;
}

$("#logout_btn").on("click", function () {
  firebase.auth().signOut();
});


$("#move_to_main").on("click", function () {
  window.location = "../html_pages/questionnaire.html?uid="+userID;
});

$("#quest_btn").on("click", function () {
  var admins_div = document.getElementById('admins_list');
  admins_div.style.visibility = 'hidden';
  var questions_div = document.getElementById('edit_quest_div');
  questions_div.style.visibility = 'visible';
});

$("#add_admin_btn").on("click", async function () {
  
  var new_admin_email = document.getElementById("user_email_for_admin").value;
  var uid_of_new_admin = await email_is_valid(new_admin_email);
  var path = "Users/"+uid_of_new_admin;
  if(uid_of_new_admin!=null){
    await $('.list-group').empty();
    await db.ref(path).update({
      admin: true
    });
    await create_admins_list()
  }
  else
  {
    document.getElementById("error_message").innerHTML = "User dosen't exist";
    $('#modalInputError').modal('show');
  }
 
});

$("#remove_admin_btn").on("click", async function () {
  
  var admin_email = document.getElementById("user_email_for_admin").value;
  var uid_of_admin = await email_is_valid(admin_email);
  var path = "Users/"+uid_of_admin;
  if(uid_of_admin!=null){
    await $('.list-group').empty();
    await db.ref(path).update({
      admin: false
    });
    await create_admins_list()
  }
  else
  {
    document.getElementById("error_message").innerHTML = "User dosen't exist";
    $('#modalInputError').modal('show');
  }
});




async function email_is_valid(new_admin_email){
  var path=null;
  var a =  await db.ref('Users').orderByChild('userEmail').equalTo(new_admin_email).once('value').then(function(snapshot) {
      var value = snapshot.val();
      if(value!=null)
      path=Object.keys(value);
  });;
 return path;
}




$("#manage_admins_btn").on("click", function () {
  create_admins_list();
  var questions_div = document.getElementById('edit_quest_div');
  questions_div.style.visibility = 'hidden';
  var admins_div = document.getElementById('admins_list');
  admins_div.style.visibility = 'visible';
});

$("#upload_btn").on("click",async function(event){
  var input_file = document.getElementById("input_file");
  var form_data = new FormData();
  var file = input_file.files[0];
  if(!file)
    return;

  form_data.append("upload_file" , file);


  const options = {
    method: 'POST',
    body: form_data
  };
  var res = await fetch('/upload_file', options);
  var msg_from_server = await res.text();
  console.log(msg_from_server);
  document.getElementById("upload_msg").innerHTML = msg_from_server;
  $('#upload_file_modal').modal('show');


});

$("#export_data_to_excel_btn").on("click", function (event) {
  db.ref("Users/").on("value", read_data);
});

async function read_data(data) {

  var converted_data = await data.val();
  var ids = Object.keys(converted_data);
  console.log("converted_data:")
  console.log(converted_data);

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(converted_data)

  };
  // var res = await fetch('/convert_to_ecxel', options);
  //clusters = await res.json();
  var res = await fetch('/convert_to_ecxel', options);
  text_res = await res.text();
  if(text_res == "good"){
    console.log("Sending request for download excel DB");
    document.getElementById("excel_db_btn").click();
  }
  else
    console.log("Failed to get excel DB file");
}
