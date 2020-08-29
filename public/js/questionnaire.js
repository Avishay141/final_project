

// class Question {
//   constructor(question_data) {
//     this.id = question_data.id;
//     this.question = question_data.question;
//     this.answers = question_data.answers;
//   }
// }


/* ----- initialize variables --------- */
$(".questions_card").hide();
var db = firebase.database();
var current_question_num = 0;
var n = 0;
var questions_list = [];
var show_questions = false;
var num_of_questions;
var MAX_NUM_OF_ANSWERS = 5;
var EMPTY = "";
var user_answers = [];
var user_answers_ai = [];

var NONE = -1;
var userID;
var answers;
// questions.push("What is your name?");
// questions.push("How old are you?");
// questions.push("What do tou want from me?");
// questions.push("?שאלה בעברית");




$("h1").css("color", "white");
/* listener for "Next" button */
$(".next_button").on("click", function () {
  checked_answer = get_user_answer(current_question_num);
 
  if (checked_answer != NONE) {
    user_answers.push(questions_list[current_question_num].question+" "+checked_answer);
    user_answers_ai.push({key:questions_list[current_question_num].id ,value: checked_answer});
  }
  else
    user_answers_ai.push = "user not filled";

  if (document.getElementById("nextAndSumbitBTN").innerHTML == "הזן תוצאות") {
    add_answers_to_db();
    console.log(user_answers);
    $(".questions_card").hide();
  }
  current_question_num++;
  update_question_card();

});

/* listener for "התחל שאלון" button */
$(".start_questions").on("click", function () {



  show_questions = !show_questions;
  if (show_questions)
    $(".questions_card").show();

  get_questions_from_db();
});


/* getting the questions from db */
function get_questions_from_db() {
  var ref_questions = db.ref("questions/");
  ref_questions.on("value", got_questions_data, error_questions_data);

}

function got_questions_data(data) {
  questions_list = [];

  var questions_obj = data.val();
  var keys = Object.keys(questions_obj);


  for (var i = 0; i < keys.length; i++) {
    num_of_questions = keys.length - 1;
    if (keys[i] != 'next_id') {
      k = keys[i];
      add_question_to_list(questions_obj[k]);
    }
  }
  update_question_card();
}

function add_question_to_list(quest_obj) {
  new_quest = {
    id: quest_obj.id,
    question: quest_obj.question,
    answers: quest_obj.answers
  }

  questions_list.push(new_quest);
}

function update_question_card() {

  if (num_of_questions - 1 == current_question_num) {
    document.getElementById("nextAndSumbitBTN").innerHTML = "הזן תוצאות";
    //add_answers_to_db();
  }
  if (num_of_questions == current_question_num) {
    window.alert("Thanks for your help");
    current_question_num = 0;
  }
  else {
    quest = questions_list[current_question_num];
    $(".card .card-title").text("Question " + (current_question_num + 1));
    $(".card .card-text").text(quest.question);

    for (var i = 1; i < 6; i++) {
      document.getElementById("rd" + i + "_id").hidden = true;

    }
    var max_num_of_answers = quest.answers.length;

    for (var i = 0; i < max_num_of_answers; i++) {
      $("#rd_txt" + (i + 1)).text(quest.answers[i]);
      document.getElementById("rd" + (i + 1) + "_id").hidden = false;
    }
  }
}


function error_questions_data(err) {
  console.log("enter error_data");
  console.log(err.val());
}


function get_user_answer(question_number) {
  for (var i = 1; i <= MAX_NUM_OF_ANSWERS; i++) {

    if (document.getElementById('customRadio' + i).checked)
      return document.getElementById('rd_txt' + i).innerText;

  }
  return NONE;
}


firebase.auth().onAuthStateChanged(function (user) {
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


$("#manage_btn").on("click", function () {
  window.location = "/management.html?uid=" + userID;
});



function add_answers_to_db() {

  db.ref("Users/" + userID).update({
    answers_ai:user_answers_ai,
    answers:user_answers
  });

  // db.ref("questions/").update({
  //   next_id: new_question.id + 1
  // });

}

