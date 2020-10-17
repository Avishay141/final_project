
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
const FINAL_CALC = 'N';
const QUEST_TYPE = 'O';
const IS_DEPENDED = 'P';
const DEPENDED_ON = 'Q';
const USER_ANS1 = 'S';

/* ---------- Visual questions variables ----------*/
const AMERICAN = "אמריקאית";
const SLIDER = "סליידר";
const CHECK_BOX = "check box";
const RANGE_VLAUE = 'range_vlaue';
const RANGE_SLIDER = 'range_Slider';
const NA = 'NA';
const RADIO_BTN = 'radio_btn';
const BOX_ANS = 'box_ans';

/* ----- initialize variables --------- */

const NON = 'NON';
var question=QUESTION_M;
var db = firebase.database();
var user_gender; 
var userID = get_userID_from_url();
db.ref("Users/"+userID).on("value", get_gender);

firebase.auth().onAuthStateChanged(async function (user) {
  var hidden_button = document.getElementById("hidden_button");
  if (!user) {
    window.location = "../html_pages/index.html";
  } 
  else {
    userID = user.uid;
    if(await user_is_admin())
      $('.hidden_button').show();
    else
      $('.hidden_button').hide();
    console.log("this line shoud be executed once for each login");
  }
});
async function user_is_admin(){
  var ans=false;
  var a =  await db.ref('Users').child(userID).once('value').then(function(snapshot) {
      var value = snapshot.val();
      if(value.admin)
        ans=true;
  });
 console.log(ans);
 return ans;
}

function get_userID_from_url() {
  var res = location.search.substring(1).split("=")[1];
  console.log("userID from url: " + res);
  return res;
}

/* listener for "Next" button */
$("#next_btn").on("click", function () {
  if(!is_all_question_are_filled()){
    document.getElementById("fill_question_msg").hidden = false;
    return;
  }
  document.getElementById("fill_question_msg").hidden = true;

  save_cluster_answers();
  current_cluster_index++;
    // chcking that we got to the end of the questionnaire - end of the cluster array (clusters)
    if(current_cluster_index > clusters.length - 1)
    return finish_questionnaire();

  show_cluster();

});

$("#prev_btn").on("click", function () {
  if(!is_all_question_are_filled()){
    document.getElementById("fill_question_msg").hidden = false;
    return;
  }
  document.getElementById("fill_question_msg").hidden = true;

  if(current_cluster_index == 0)
    return;

  save_cluster_answers();
  current_cluster_index--;
  show_cluster();

});


function save_cluster_answers(){
  var curr_cluster = clusters[current_cluster_index];
  var quest_arr = curr_cluster.questions;
  for(var i =0; i < quest_arr.length; i++){

    var tmp_quest = quest_arr[i];
    if (tmp_quest.question_type == CHECK_BOX){
      tmp_quest.check_box_ans = Array.from(tmp_quest.check_box_ans);
       /* the user answers of the check_box questions are already updated.
      every time the user check or uncheck a box we update. we only need to convert the Set to an array
      because when converting Set to json the elements are lost
    */
    }
    else if (tmp_quest.question_type == SLIDER){
      var ans = document.getElementById(get_answer_element_id(tmp_quest)).value;
      tmp_quest.user_ans = ans;
      console.log(tmp_quest.line +" ,ans: " + ans);
    }
    else{
      var ans = document.querySelector('input[name='+AMERICAN+tmp_quest.line+']:checked').value;
      tmp_quest.user_ans = ans;
    }
  

  }

}


async function finish_questionnaire(){
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clusters)

  };
  var res = await fetch('/calculate_answers', options);
  clusters = await res.json();
  replace_null_grades_with_zero()
  print_clusters();
  var final_grade = calculate_final_grade()
  update_html_finish_msg(final_grade)
  insert_clusters_to_db();

  console.log("@@@ finish questionnaire, your grade: " + final_grade);

}

function update_html_finish_msg(final_grade){
  var finish_msg_elem = document.getElementById("finish_msg");
  finish_msg_elem.innerHTML = 'סיימת את השאלון בהצלחה!  ציון: ' + final_grade;
  finish_msg_elem.hidden = false;
  document.getElementById("card_questions").hidden = true;
}

function insert_clusters_to_db(){
  var ans_to_db_str=[];
  for(var i =0;i<clusters.length;i++){
    ans_to_db_str.push({cluster_name:clusters[i].name,cluster_questions: []});
    for(var j=0;j<clusters[i].questions.length;j++){
      if(clusters[i].questions[j].question_type==="check box")
        ans_to_db_str[i].cluster_questions.push({question:clusters[i].questions[j].quest,ans:clusters[i].questions[j].check_box_ans});
      else
        ans_to_db_str[i].cluster_questions.push({question:clusters[i].questions[j].quest,ans:clusters[i].questions[j].user_ans});
    }
  }
   var path = "Users/"+userID;
   for(var i =0;i<clusters.length;i++){
      db.ref(path).update({
        clusters_test: ans_to_db_str
   });
 }
}

function is_all_question_are_filled(){
  var curr_cluster = clusters[current_cluster_index];
  var quest_arr = curr_cluster.questions;
  for(var i =0; i < quest_arr.length; i++){
    var quest = quest_arr[i];
    if(quest.question_type != AMERICAN)
      continue;

    var radio_btn_ans_elem = document.querySelector('input[name='+AMERICAN+quest.line+']:checked');
    if(!radio_btn_ans_elem)
      return false;

  }
  return true;
}

$("#logout_btn").on("click", function () {
  firebase.auth().signOut();
});


$("#manage_btn").on("click", function () {
  window.location = "../html_pages/management.html?uid=" + userID;
});

$("#start_quest_btn").on("click", function () { 
  run_questionnaire();

});

async function run_questionnaire(){
  var quest_json_object = await get_questions_from_server();
  load_questions_from_excel_json(quest_json_object);
  hide_and_show_relevant_html_elements();
  show_cluster();
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

// function add_answers_to_db() {

//   db.ref("Users/" + userID).update({
//     answers_ai: user_answers_ai,
//     answers: user_answers
//   });
//   console.log(user_answers + "  " + user_answers_ai);
//   user_answers = [];
//   user_answers_ai = {};
//   document.getElementById("nextAndSumbitBTN").innerHTML = "הבא";

// }


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
    user_ans: NON,
    question_type: curr_row[QUEST_TYPE].trim(),
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

function show_cluster(){
  /* iterating over the questions in the cluster  and putting the auestions in the screen */
  console.log("entered show_cluster");
  $(".cluster").empty();
  var current_cluster = clusters[current_cluster_index];
  document.getElementById("cluster_name_title").innerHTML = current_cluster.name;
  var cluster_size = current_cluster.questions.length;

  for( var i =0; i < cluster_size; i++){
      var quest_obj = current_cluster.questions[i];
      var curr_quest_html = get_question_html(quest_obj);
      $(".cluster").append(curr_quest_html);
      if(quest_obj.question_type == SLIDER)
            set_slider(quest_obj);

      // Converting check_box_ans to Set(), every time we save cluster we convert it back to Array
      if(quest_obj.question_type == CHECK_BOX)
        quest_obj.check_box_ans = new Set(quest_obj.check_box_ans)
       
      set_user_answers_in_html(quest_obj);
  }
}

function set_user_answers_in_html(quest){
    if(quest.question_type == CHECK_BOX){
      if(quest.check_box_ans.size == 0)
          return;
      var arr = Array.from(quest.check_box_ans);
      for(var i =0; i < arr.length; i++){
        var elem_id = get_answer_element_id(quest, arr[i]);
        document.getElementById(elem_id).checked = true;
      }
      return;
    }

    if(quest.user_ans == NON)
      return;
    
    var elem =  document.getElementById(get_answer_element_id(quest, quest.user_ans));

    if(quest.question_type == AMERICAN)
      elem.checked = true;
    
    else
      elem.value = quest.user_ans;
    
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
      quest += '<li><label><input type="radio" name="'+AMERICAN+q.line+'" value="'+q.answers[i]+'" id="'+get_answer_element_id(q, q.answers[i])+'"><span>  '+q.answers[i]+'</span></label></li>';
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
  quest +=  '<input class="rangeSlider" id="'+get_answer_element_id(q)+'" type="range" min="0" max="100" value="0" step="0.1" />';
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
      //console.log("ans type: " + typeof(ans) + " , val: " + ans);
      quest += '<input type="checkbox" name="'+q.line+'" value="'+q.answers[i]+'" id="'+get_answer_element_id(q, q.answers[i])+'" onclick="return update_checkbox_answers('+q.line+',\''+q.answers[i]+'\');"> '+q.answers[i]+'<br>';
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

function get_answer_element_id(quest, ans=NON){
  if(quest.question_type == AMERICAN)
     return String(quest.line+RADIO_BTN+ans).trim();
  
  if(quest.question_type == CHECK_BOX)
    return String(quest.line+BOX_ANS+ans).trim();

  if(quest.question_type == SLIDER)
    return String(RANGE_SLIDER+quest.line).trim();

  console.log('ERROR: Unknown question type: ' + quest.question_type);
}

function replace_null_grades_with_zero(){
  for(var i = 0; i < clusters.length; i++){
    var curr_questions = clusters[i].questions;
    for(var j = 0; j < curr_questions.length; j++){
        var quest = curr_questions[j];
        if(!quest.grade)
        quest.grade =0;
    }
  }

}
function print_clusters(){
  for(var i = 0; i < clusters.length; i++){
    var curr_questions = clusters[i].questions;
    for(var j = 0; j < curr_questions.length; j++){
        var q = curr_questions[j];
        var user_ans = q.user_ans;
        if(q.question_type == CHECK_BOX)
           user_ans = q.check_box_ans;

        console.log("question " +q.line + ", user_ans: " + user_ans +", grade: " + q.grade);
  
    }
  }
}

function calculate_final_grade(){
  var final_grade = 0;
  for(var i = 0; i < clusters.length; i++){
    var curr_questions = clusters[i].questions;
    for(var j = 0; j < curr_questions.length; j++)
        final_grade += Number(curr_questions[j].grade);
  }
  return final_grade;
}

