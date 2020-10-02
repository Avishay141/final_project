
firebase.auth().onAuthStateChanged(function(user) {
  if (!user) {

     window.location = "../html_pages/index.html";
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
  window.location = "../html_pages/questionnaire.html?uid="+userID;
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
