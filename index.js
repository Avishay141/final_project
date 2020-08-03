
// athounivation methods
const  db = firebase.database().ref();

$("#login_btn").on("click",function(){
  var email = $("#email").val();
  var password = $("#password").val();
  var error_msg = document.getElementById("error_msg_id");
  const auth = firebase.auth();
  
  var res = auth.signInWithEmailAndPassword(email, password);
  res.catch(e => error_msg.innerHTML = e.message);


});



$("#sign_up_btn").on("click",function(){

     window.location = "signup/signup.html";

  });




$("#forgot_btn").on("click",function(){
  var auth = firebase.auth();
  var email = $("#email").val();

  auth.sendPasswordResetEmail(email).then(function() {
    // Email sent.
  }).catch(function(error) {
    // An error happened.
  });
});




firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    console.log("!!!!!!!!!: " + user.uid)
    window.location = "questionnaire_page/questionnaire.html?uid="+user.uid;
  } else {
    console.log("User hasn't logged in yet");
  }
});



// ---- Firebase function ------

//###################################################
