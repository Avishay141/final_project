

const QUESTION = 'A';
const CLUSTER = 'B';
const ANS1 = 'C';
const ANS2 = 'D';
const ANS3 = 'E';
const ANS4 = 'F';
const ANS5 = 'G';
const ANS6 = 'H';
const ANS7 = 'I';
const ANS8 = 'K';
const ANS9 = 'K';
const ANS10 = 'L';
const USER_ANS = 'M';
const FINAL_CALC = 'N';
const QUEST_TYPE = 'O';
const IS_DEPENDED = 'P';
const DEPENDED_ON = 'Q';

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
var user_answers_ai = {};

var NONE = -1;
var userID;
var answers;




$("h1").css("color", "white");
/* listener for "Next" button */
$(".next_button").on("click", function () {
  checked_answer = get_user_answer(current_question_num);

  if (checked_answer != NONE) {
    user_answers.push(questions_list[current_question_num].question + " " + checked_answer);
    user_answers_ai[questions_list[current_question_num].id] = checked_answer;
  }
  else {
    user_answers.push("user not filled");
    user_answers_ai[questions_list[current_question_num].id] = "user not filled";
  }
  if (document.getElementById("nextAndSumbitBTN").innerHTML == "הזן תוצאות") {
    add_answers_to_db();
    console.log(user_answers);
    $(".questions_card").hide();
  }
  current_question_num++;
  update_question_card();

});






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
    answers_ai: user_answers_ai,
    answers: user_answers
  });
  console.log(user_answers + "  " + user_answers_ai);
  user_answers = [];
  user_answers_ai = {};
  document.getElementById("nextAndSumbitBTN").innerHTML = "הבא";

}



var clusters = [];
var excel_json_obj = "";
function load_questions_from_excel_json() {
  var root = Object.keys(excel_json_obj);
  var num_of_questions = (excel_json_obj[root].length) - 1;

  for (var i = 1; i <= num_of_questions; i++) {
    var question = create_question(i); 
    if (!(cluster_exist(question.cluster))) {   
      var new_cluster = {
        name: (excel_json_obj[root][i][CLUSTER]),
        questions: []
      }
      new_cluster.questions.push(question);
      clusters.push(new_cluster);
    }
    else 
      add_question_to_cluster(question);
  }
  console.log(clusters);
}

function add_question_to_cluster(question) {
  for (var i = 0; i < clusters.length; i++) {
    if (question.cluster === clusters[i].name)
      clusters[i].questions.push(question);
  }
}


function cluster_exist(cluster_name) {
  for (var i = 0; i < clusters.length; i++) 
    if (clusters[i].name === cluster_name)
      return true; 
  return false; 
}

function create_question(i) {
  var root = Object.keys(excel_json_obj);
  var curr_row = excel_json_obj[root][i];
  return {
    quest: curr_row[QUESTION],
    cluster: curr_row[CLUSTER],
    answers: [curr_row[ANS1], curr_row[ANS2], curr_row[ANS3], curr_row[ANS4], curr_row[ANS5],
    curr_row[ANS6], curr_row[ANS7], curr_row[ANS8], curr_row[ANS9], curr_row[ANS10]],
    user_ans: curr_row[USER_ANS],
    question_type: curr_row[QUEST_TYPE],
    is_depended: curr_row[IS_DEPENDED],
    depended_on: curr_row[DEPENDED_ON],
    check_box_ans: new Set(),
    line: i
  }
}
