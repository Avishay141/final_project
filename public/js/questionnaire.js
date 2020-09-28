
/* ---------- Excel file columns variables mapping ----------*/

const QUESTION_M = 'A';
const QUESTION_F = 'B';
const CLUSTER = 'C';
const ANS1 = 'D';
const ANS2 = 'E';
const ANS3 = 'F';
const ANS4 = 'G';
const ANS5 = 'H';
const ANS6 = 'I';
const ANS7 = 'J';
const ANS8 = 'K';
const ANS9 = 'L';
const ANS10 = 'M';
const USER_ANS = 'N';
const FINAL_CALC = 'O';
const QUEST_TYPE = 'P';
const IS_DEPENDED = 'Q';
const DEPENDED_ON = 'R';

/* ---------- Visual questions variables ----------*/
const AMERICAN = "אמריקאית";
const SLIDER = "סליידר";
const CHECK_BOX = "check box";
const RANGE_VLAUE = 'range_vlaue';
const RANGE_SLIDER = 'range_Slider';
const NA = 'NA';

/* ----- initialize variables --------- */

const NON = -1;
var question=QUESTION_M;
var db = firebase.database();
var user_gender; 
var userID = get_userID_from_url();
db.ref("Users/"+userID).on("value", get_gender);

$("h1").css("color", "white");

/* listener for "Next" button */
$(".next_button").on("click", function () {

  save_cluster_answers(current_cluster_index);
  current_cluster_index++;
    // chcking that we got to the end of the questionnaire - end of the cluster array (clusters)
    if(current_cluster_index > clusters.length - 1)
    return finish_questionnaire();

  show_cluster(current_cluster_index);

});


function save_cluster_answers(){
  var curr_cluster = clusters[current_cluster_index];
  var quest_arr = curr_cluster.questions;
  for(var i =0; i < quest_arr.length; i++){

    var tmp_quest = quest_arr[i];
    if (tmp_quest.question_type == CHECK_BOX)
      continue;
    // the user answers of the check_box questions are already updated. every time the user check or uncheck a box we update.

    if (tmp_quest.question_type == SLIDER){
      var ans = document.getElementById(RANGE_SLIDER+tmp_quest.line).value;
      tmp_quest.user_ans = ans;
      console.log(tmp_quest.line +" ,ans: " + ans);
    }
    else{
      var ans = document.querySelector('input[name='+AMERICAN+tmp_quest.line+']:checked').value;
      tmp_quest.user_ans = ans;
      console.log(tmp_quest.line +" ,ans: " + ans);
    }
  

  }

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

async function finish_questionnaire(){
  // todo: implement
  console.log("@@@ finish questionnaire");
  const options = {
    method: 'POST',
    headers: {
      // 'Content-Type': 'text/plain'
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clusters)

  };
  var res = await fetch('/calculate_answers', options);
  // var quest_json_str = await res.text();
  // console.log("@@@ quest_json_object after stringify: \n "+ quest_json_str);
  // var quest_json_object = JSON.parse(quest_json_str);

}

$("#logout_btn").on("click", function () {
  firebase.auth().signOut();
});


$("#manage_btn").on("click", function () {
  window.location = "/management.html?uid=" + userID;
});

$("#start_quest_btn").on("click", function () { 
  run_questionnaire();

});

async function run_questionnaire(){
  var quest_json_object = await get_questions_from_server();
  load_questions_from_excel_json(quest_json_object);
  hide_and_show_relevant_html_elements();
  show_cluster(0); // calling show_cluster with the first cluster
}

async function get_questions_from_server(){
  const options = {
    method: 'GET',
    headers: {
      //'Content-Type': 'application/json'
      'Content-Type': 'text/plain'
    }
  };
  var res = await fetch('/get_questions', options);
  var quest_json_str = await res.text();
  var quest_json_object = JSON.parse(quest_json_str);
  return quest_json_object;
}

function hide_and_show_relevant_html_elements(){
  // hiding and showing relevant elements in html
  document.getElementById("start_quest_btn").hidden = true;
  document.getElementById("card_questions").hidden = false;
}

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


/* ---------- Functions that create the question objects from Json object ------- */
var clusters = [];
var current_cluster_index = 0;

function load_questions_from_excel_json(excel_json_obj) {
  var root = Object.keys(excel_json_obj)[0];
  var num_of_questions = (excel_json_obj[root].length) - 1;

  for (var i = 1; i <= num_of_questions; i++) {
    var question = create_question(i, excel_json_obj); 
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

function create_question(i, excel_json_obj) {
  var root = Object.keys(excel_json_obj)[0];
  var curr_row = excel_json_obj[root][i];
  var valid_answers = get_valid_answers(curr_row);
  if(user_gender=="Male")
    question=QUESTION_M;
  else
    question=QUESTION_F;
    
  return {
    quest: curr_row[question],
    cluster: curr_row[CLUSTER],
    answers: valid_answers,
    user_ans: curr_row[USER_ANS],
    question_type: curr_row[QUEST_TYPE],
    is_depended: curr_row[IS_DEPENDED],
    depended_on: curr_row[DEPENDED_ON],
    check_box_ans: new Set(),
    line: i,
    grade: NON,
    gender: user_gender
  }
}

function get_gender(data){
  var user= data.val();
  user_gender=user.gender;
}

function get_valid_answers(curr_row){
  var all_answers = [curr_row[ANS1], curr_row[ANS2], curr_row[ANS3], curr_row[ANS4], curr_row[ANS5],
  curr_row[ANS6], curr_row[ANS7], curr_row[ANS8], curr_row[ANS9], curr_row[ANS10]];

  var valid_answers = [];
  for(var i =0; i < all_answers.length; i++){
    if(all_answers[i] != NA)
    valid_answers.push(all_answers[i]);
  }
  return valid_answers;
}


/* ---------- Functions that create the visual html questions ------- */

function show_cluster(cluster_index){
  /* iterating over the questions in the cluster  and putting the auestions in the screen */


  console.log("entered show_cluster");
  $(".cluster").empty();
  var current_cluster = clusters[cluster_index];
  document.getElementById("cluster_name_title").innerHTML = current_cluster.name;
  var cluster_size = current_cluster.questions.length;

  for( var i =0; i < cluster_size; i++){
      var quest_obj = current_cluster.questions[i];
      var curr_quest_html = get_question_html(quest_obj);
      $(".cluster").append(curr_quest_html);
      if(quest_obj.question_type == SLIDER)
            set_slider(quest_obj);
  }
}

function get_question_html(quest_obj){
  if(quest_obj.question_type == AMERICAN)
      return create_american_quest(quest_obj)

  if(quest_obj.question_type == SLIDER)
      return create_slider_quest(quest_obj)

  if(quest_obj.question_type == CHECK_BOX)
      return create_check_box_quest(quest_obj)
  
  console.log("Question number " + quest_obj.line + " has unknown question type: " + quest_obj.question_type);
  
}

function create_american_quest(q){
  var quest = '<li>';
  quest += '<h6>' +q.quest+ '</h6>';
  for(var i =0; i < q.answers.length; i++){
      quest += '<li><label><input type="radio" name="'+AMERICAN+q.line+'" value="'+q.answers[i]+'"><span>  '+q.answers[i]+'</span></label></li>';
  }
  quest +='</li>';

  return quest;
}

function create_slider_quest(q){
  var quest = '<li>' 
  quest += '<h6>' +q.quest+ '</h6>'

  quest += '<div class="range-wrap">';
  quest += '<span class="font-weight-bold indigo-text mr-2 mt-1">0</span>';
  quest += '<div class="range-value" id="'+RANGE_VLAUE+q.line+'"> </div>';
  quest += '<form>';
  quest +=  '<input class="rangeSlider" id="'+RANGE_SLIDER+q.line+'" type="range" min="0" max="100" value="0" step="0.1" />';
  quest += '</form>'
  quest +=  '<span class="font-weight-bold blue-text mr-2 mt-1">100</span>';
  quest += '</div>';
  quest +='</li>';
  return quest;

}

function create_check_box_quest(q){
  var quest = '<li>' 
  quest += '<h6>' +q.quest+ '</h6>'
  quest += '<form>';
  quest +=' <fieldset>';

  for(var i =0; i < q.answers.length; i++){
      var ans = q.answers[i];
      console.log("ans type: " + typeof(ans) + " , val: " + ans);
      quest += '<input type="checkbox" name="'+q.line+'" value="'+q.answers[i]+'" onclick="return update_checkbox_answers('+q.line+',\''+q.answers[i]+'\');"> '+q.answers[i]+'<br>';
      // quest += '<input type="checkbox" name="'+q.line+'" value="'+q.answers[i]+'" onclick="return test(\''+ans+'\');"> '+q.answers[i]+'<br>';

    }

  quest +=' </fieldset>';
  quest += '</form>';
  quest +='</li>';
  return quest;
}

function update_checkbox_answers(quest_line, answer){

  console.log("@@@ entered update_checkbox_answers");
  clusters[current_cluster_index].questions.forEach(q => {
     if(q.line == quest_line){
          if(q.check_box_ans.has(answer)){
              console.log("Removing " + answer);
              q.check_box_ans.delete(answer);
          }
          else{
              console.log("Adding " + answer);
              q.check_box_ans.add(answer);
          }
     }
  });

}

function set_slider(quest){
  var range = document.getElementById(RANGE_SLIDER+quest.line);
  var rangeV = document.getElementById(RANGE_VLAUE+quest.line);
  setValue = () => {
    var newValue = Number((range.value - range.min) * 100 / (range.max - range.min));
    var newPosition = 10 - (newValue * 0.2);
    rangeV.innerHTML = `<span>${range.value}</span>`;
    rangeV.style.right = `calc(${newValue}% + (${newPosition}px))`;
  };
document.addEventListener("DOMContentLoaded", setValue);
range.addEventListener('input', setValue);
}



