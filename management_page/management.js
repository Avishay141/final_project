
  const db = firebase.database();


$(".submit_btn").on("click" , create_new_questions);





function create_new_questions(){
  var max_num_of_answers = 5;
  answers_arr = {};
  var question = $(".input_question").val();

  for(var i =1; i <= max_num_of_answers; i++){
    var ans = $("#answer"+i).val();
    if(ans !="")
      answers_arr[""+i] = ans;
  }

    var db_questions = db.ref("questions/");
    db_questions.once("value").then(function(snapshot) {

         var current_num_of_questions = snapshot.child("next_id").val();
         var new_question ={id:current_num_of_questions, quest:question, answers:answers_arr};
         add_question_to_db(new_question);
    });
}



function add_question_to_db(new_question){
  db.ref("questions/" + new_question.id).set({
    question : new_question.quest,
    id: new_question.id,
    answers: new_question.answers
  });

  db.ref("questions/").update({
    next_id: new_question.id+1
  });

}


firebase.auth().onAuthStateChanged(function(user) {
  if (!user) {

     window.location = "../index.html";
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
  window.location = "../questionnaire_page/questionnaire.html?uid="+userID;
});