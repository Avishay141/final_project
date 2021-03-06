
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
const CLUSTER_WEIGHT = 'O';
const MAX_QUEST_SCORE = 'P'
const QUEST_TYPE = 'Q';
const EFFECTS_THIS_QUESTS = 'R';
const ANS_THAT_EFFECT = 'S';
const COMMENTS = 'T';
const USER_ANS1 = 'U';

/* ---------- Visual questions variables ----------*/
const AMERICAN = "אמריקאית";
const SLIDER = "סליידר";
const CHECK_BOX = "check box";
const RANGE_VLAUE = 'range_vlaue';
const RANGE_SLIDER = 'range_Slider';
const NA = 'NA';
const RADIO_BTN = 'radio_btn';
const BOX_ANS = 'box_ans';
const NOT_ANSWERD = -99;
const QUEST_DIV_ID_PREFIX = 'div_q_';

/* ----- initialize variables --------- */

const NON = 'NON';
var question = QUESTION_M;
var db = firebase.database();
var user_gender;
var userID = get_userID_from_url();
db.ref("Users/" + userID).on("value", get_gender);
/* ----- hide html elements --------- */
var start_hidden_button = document.getElementById('manage_btn');
start_hidden_button.style.visibility = 'hidden';

firebase.auth().onAuthStateChanged(async function (user) {
  var hidden_button = document.getElementById("manage_btn");
  if (!user) {
    window.location = "../html_pages/index.html";
  }
  else {
    userID = user.uid;
    if(await user_is_admin())
      hidden_button.style.visibility = 'visible';
    else
    hidden_button.style.visibility = 'hidden';
    console.log("this line shoud be executed once for each login");
  }
});
async function user_is_admin() {
  var ans = false;
  var a = await db.ref('Users').child(userID).once('value').then(function (snapshot) {
    var value = snapshot.val();
    if (value.admin)
      ans = true;
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
  
  if (!is_all_question_are_filled()) {
    document.getElementById("fill_question_msg").hidden = false;
    return;
  }
  document.getElementById("fill_question_msg").hidden = true;

  save_cluster_answers();
  current_cluster_index++;
  // chcking that we got to the end of the questionnaire - end of the cluster array (clusters)
  if (current_cluster_index > clusters.length - 1){
    update_answers_of_hidden_quests()
    return finish_questionnaire();
  }

  show_cluster();
  scroll_to_top()

});

$("#prev_btn").on("click", function () {
  if (!is_all_question_are_filled()) {
    document.getElementById("fill_question_msg").hidden = false;
    return;
  }
  document.getElementById("fill_question_msg").hidden = true;

  if (current_cluster_index == 0)
    return;

  save_cluster_answers();
  current_cluster_index--;
  show_cluster();
  scroll_to_top()

});

function scroll_to_top(){
   /* Scrolling to the top of the page */
  window.scrollTo(0, 0);
}

function save_cluster_answers() {
  var curr_cluster = clusters[current_cluster_index];
  var quest_arr = curr_cluster.questions;
  for (var i = 0; i < quest_arr.length; i++) {
    
      var tmp_quest = quest_arr[i];
      if(tmp_quest.hidden)
          continue
     
      if (tmp_quest.question_type == CHECK_BOX) {
        tmp_quest.check_box_ans = Array.from(tmp_quest.check_box_ans);
        /* the user answers of the check_box questions are already updated.
       every time the user check or uncheck a box we update. we only need to convert the Set to an array
       because when converting Set to json the elements are lost
     */
      }
      else if (tmp_quest.question_type == SLIDER) {
        var ans = document.getElementById(get_answer_element_id(tmp_quest)).value;
        tmp_quest.user_ans = ans;
        console.log(tmp_quest.line + " ,ans: " + ans);
      }
      else {

        var ans = document.querySelector('input[name=' + AMERICAN + tmp_quest.line + ']:checked').value;
        tmp_quest.user_ans = ans;

      }
  }
}


async function finish_questionnaire() {
  var data = {
    user_id: userID,
    all_clusters: clusters
  }
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)

  };
  var res = await fetch('/calculate_answers', options);
  clusters = await res.json();
  replace_null_grades_with_zero()
  print_clusters();
  var final_grade = calculate_final_grade()
  update_html_finish_msg(final_grade)
  insert_clusters_to_db();

  console.log("@@@ finish questionnaire, your grade: " + final_grade);
  scroll_to_top()
  display_recomendations();

}

function update_html_finish_msg(final_grade) {
  var finish_msg_elem = document.getElementById("finish_msg");
  finish_msg_elem.innerHTML = 'סיימת את השאלון בהצלחה!  ציון: ' + final_grade;
  finish_msg_elem.hidden = false;
  document.getElementById("card_questions").hidden = true;
}

function insert_clusters_to_db() {
  var ans_to_db_str = [];
  for (var i = 0; i < clusters.length; i++) {
    ans_to_db_str.push({ cluster_name: clusters[i].name, cluster_questions: [] });
    for (var j = 0; j < clusters[i].questions.length; j++) {
      if (clusters[i].questions[j].question_type === "check box")
        ans_to_db_str[i].cluster_questions.push({ question: clusters[i].questions[j].quest, ans: clusters[i].questions[j].check_box_ans });
      else
        ans_to_db_str[i].cluster_questions.push({ question: clusters[i].questions[j].quest, ans: clusters[i].questions[j].user_ans });
    }
  }
  var path = get_user_db_path();
  for (var i = 0; i < clusters.length; i++) {
    db.ref(path).update({
      clusters_test: ans_to_db_str
    });
  }
}

function is_all_question_are_filled() {
  var curr_cluster = clusters[current_cluster_index];
  var quest_arr = curr_cluster.questions;
  for (var i = 0; i < quest_arr.length; i++) {
    var quest = quest_arr[i];
    if (quest.question_type != AMERICAN || quest.hidden)
      continue;

    var radio_btn_ans_elem = document.querySelector('input[name=' + AMERICAN + quest.line + ']:checked');
    if (!radio_btn_ans_elem)
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

$("#back_to_main_btn").on("click", function () {
  location.reload();
  scroll_to_top();
});



async function run_questionnaire() {
  await get_updated_excel_from_storage()
  var quest_json_object = await get_questions_from_server();
  load_questions_from_excel_json(quest_json_object);
  hide_and_show_relevant_html_elements();
  show_cluster();
  scroll_to_top();
}

async function get_updated_excel_from_storage() {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({user_id: userID})
  };

  var res = await fetch('/get_updated_excel', options);
  var server_msg = await res.text();
  console.log(server_msg);
}

async function get_questions_from_server() {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({user_id: userID})
  };
  var res = await fetch('/get_questions', options);
  var quest_json_str = await res.text();
  var quest_json_object = JSON.parse(quest_json_str);
  return quest_json_object;
}

function hide_and_show_relevant_html_elements() {
  // hiding and showing relevant elements in html
  document.getElementById("welcome_section").hidden = true;
  document.getElementById("card_questions").hidden = false;
}

/* ---------- Functions that create the question objects from Json object ------- */
var clusters = [];
var current_cluster_index = 0;
var hidden_questions = [];

function load_questions_from_excel_json(excel_json_obj) {
  var root = Object.keys(excel_json_obj)[0];
  var num_of_questions = (excel_json_obj[root].length) - 1;

  // Starting from index 1 and not 0 becasue the first line in the file contains the column names
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
  var line_num = i+1 // firest question starts on line 2 in the excel file

  var quests_taht_effect_this_quest = NON;
  var answers_that_effect_this_quest = NON;
  var hidden_status = false;
  if(curr_row[EFFECTS_THIS_QUESTS] != NA){
    quests_taht_effect_this_quest = convert_effect_questions(curr_row);
    answers_that_effect_this_quest = convert_effect_answers(curr_row);
    hidden_questions.push(line_num)
    hidden_status = true;
  }

  if (user_gender == "Male")
    question = QUESTION_M;
  else
    question = QUESTION_F;

  return {
    quest: curr_row[question],
    cluster: curr_row[CLUSTER],
    answers: valid_answers,
    user_ans: NON,
    recomendation: NON,
    recomendation_link: NON,
    question_type: curr_row[QUEST_TYPE].trim(),
    cluster_weight: parseFloat(curr_row[CLUSTER_WEIGHT]),
    effects_this_quests: quests_taht_effect_this_quest,
    ans_that_effect: answers_that_effect_this_quest,
    check_box_ans: new Set(),
    line: line_num,
    grade: NON,
    gender: user_gender,
    hidden:hidden_status,
    cluster_wight: curr_row[CLUSTER_WEIGHT],
    max_quest_score: curr_row[MAX_QUEST_SCORE]
  }
}

function convert_effect_questions(curr_row) {
  return curr_row[EFFECTS_THIS_QUESTS].toString().trim().split(',');
}

function convert_effect_answers(curr_row) {
  return curr_row[ANS_THAT_EFFECT].toString().trim().split(',');
}


function get_gender(data) {
  var user = data.val();
  user_gender = user.gender;
}

function get_valid_answers(curr_row) {
  var all_answers = [curr_row[ANS1], curr_row[ANS2], curr_row[ANS3], curr_row[ANS4], curr_row[ANS5],
  curr_row[ANS6], curr_row[ANS7], curr_row[ANS8], curr_row[ANS9], curr_row[ANS10]];

  var valid_answers = [];
  for (var i = 0; i < all_answers.length; i++) {
    if (all_answers[i] != NA)
      valid_answers.push(all_answers[i]);
  }
  return valid_answers;
}


/* ---------- Functions that create the visual html questions ------- */

function show_cluster() {
  /* iterating over the questions in the cluster  and putting the them on the screen */
  $(".cluster").empty();
  var current_cluster = clusters[current_cluster_index];
  document.getElementById("cluster_name_title").innerHTML = current_cluster.name;
  var cluster_size = current_cluster.questions.length;

  for (var i = 0; i < cluster_size; i++) {
    var quest_obj = current_cluster.questions[i];
    var curr_quest_html = get_question_html(quest_obj);
    $(".cluster").append(curr_quest_html);
    if (quest_obj.question_type == SLIDER)
      set_slider(quest_obj);

    // Converting check_box_ans to Set(), every time we save cluster we convert it back to Array
    if (quest_obj.question_type == CHECK_BOX)
      quest_obj.check_box_ans = new Set(quest_obj.check_box_ans)


    set_user_answers_in_html(quest_obj);
    console.log(quest_obj.line);

    if(quest_obj.hidden)
      document.getElementById(QUEST_DIV_ID_PREFIX + (quest_obj.line)).hidden = true;

  }

  console.log(clusters);
}


function set_user_answers_in_html(quest) {
  if (quest.question_type == CHECK_BOX) {
    if (quest.check_box_ans.size == 0)
      return;
    var arr = Array.from(quest.check_box_ans);
    for (var i = 0; i < arr.length; i++) {
      var elem_id = get_answer_element_id(quest, arr[i]);
      document.getElementById(elem_id).checked = true;
    }
    return;
  }

  if (quest.user_ans == NON)
    return;

  var elem = document.getElementById(get_answer_element_id(quest, quest.user_ans));

  if (quest.question_type == AMERICAN)
    elem.checked = true;

  else
    elem.value = quest.user_ans;

}

function get_question_html(quest_obj) {
  if (quest_obj.question_type == AMERICAN)
    return create_american_quest(quest_obj)

  if (quest_obj.question_type == SLIDER)
    return create_slider_quest(quest_obj)

  if (quest_obj.question_type == CHECK_BOX)
    return create_check_box_quest(quest_obj)

  console.log("Question number " + quest_obj.line +
   " has unknown question type: " + quest_obj.question_type);

}

function create_american_quest(q) {
  var quest = '<div class=quest_' + q.line + ' id="'+QUEST_DIV_ID_PREFIX + q.line+'">';
  quest += '<li id="q' + q.line + '">';
  quest += '<h6>' + q.quest + '</h6>';
  quest += '<form>';

  for (var i = 0; i < q.answers.length; i++) {
    var ans_id = get_answer_element_id(q, q.answers[i]);
    quest += '<li><label><input type="radio" name="' + AMERICAN + q.line + '" value="' + q.answers[i] + '" id="' + ans_id + '" onclick="return show_or_hide_questions('+ q.line + ',\'' + (i+1) + '\' );"><span>  ' + q.answers[i] + '</span></label></li>';
  }

  quest += '</form>';
  quest += '</li>';
  quest += '</div>';
  return quest;
}

function create_slider_quest(q) {
  var quest = '<div class=quest_' + q.line + ' id="'+QUEST_DIV_ID_PREFIX + q.line+'">';
  quest += '<li>'
  quest += '<h6>' + q.quest + '</h6>'

  quest += '<div class="range-wrap">';
  // quest += '<span class="font-weight-bold indigo-text mr-2 mt-1">0</span>';
  quest += '<div class="range-value" id="' + RANGE_VLAUE + q.line + '"> </div>';
  quest += '<form>';
  quest += '<input class="rangeSlider" id="' + get_answer_element_id(q) + '" type="range" min="0" max="100" value="0" step="0.1" />';
  quest += '</form>'
  // quest += '<span class="font-weight-bold blue-text mr-2 mt-1">100</span>';
  quest += '</div>';
  quest += '</li>';
  quest += '</div>';
  return quest;

}

function create_check_box_quest(q) {
  var quest = '<div class=quest_' + q.line + ' id="'+QUEST_DIV_ID_PREFIX + q.line+'">';
  quest += '<li>'
  quest += '<h6>' + q.quest + '</h6>'
  quest += '<form>';
  quest += ' <fieldset>';

  for (var i = 0; i < q.answers.length; i++) {
    quest += '<input type="checkbox" name="' + q.line + '" value="' + q.answers[i] + '" id="' + get_answer_element_id(q, q.answers[i]) + '" onclick="return update_checkbox_answers(' + q.line + ',\'' + q.answers[i] + '\');"> ' + q.answers[i] + '<br>';
  }

  quest += ' </fieldset>';
  quest += '</form>';
  quest += '</li>';
  quest += '</div>';
  return quest;
}

function show_or_hide_questions(quest_num, ans_num){
  console.log("### entered show_or_hide_questions");
  for(var i = 0; i < hidden_questions.length; i++){
    var depend_quest = get_question_by_line_num(hidden_questions[i]);
    if(depend_quest.effects_this_quests != NON && depend_quest.effects_this_quests.includes(quest_num.toString())){
        depend_quest_element =  document.getElementById(QUEST_DIV_ID_PREFIX + depend_quest.line);
        
        if(depend_quest.ans_that_effect.includes(ans_num)){
          depend_quest_element.hidden = false;
          depend_quest.hidden = false;
        }
        else{
          depend_quest_element.hidden = true;
          depend_quest.hidden = true;
        }
    } 
  }
}

function get_question_by_line_num(line_num){
  for (var i = 0; i < clusters.length; i++) {
    var curr_questions = clusters[i].questions;
    for (var j = 0; j < curr_questions.length; j++){
      var quest = curr_questions[j];
      if(quest.line == line_num)
        return quest; 
    }
  }
}

function update_checkbox_answers(quest_line, answer) {

  console.log("@@@ entered update_checkbox_answers");
  clusters[current_cluster_index].questions.forEach(q => {
    if (q.line == quest_line) {
      if (q.check_box_ans.has(answer)) {
        console.log("Removing " + answer);
        q.check_box_ans.delete(answer);
      }
      else {
        console.log("Adding " + answer);
        q.check_box_ans.add(answer);
      }
    }
  });

}

function set_slider(quest) {
  var range = document.getElementById(RANGE_SLIDER + quest.line);
  var rangeV = document.getElementById(RANGE_VLAUE + quest.line);
  setValue = () => {
    var newValue = Number((range.value - range.min) * 100 / (range.max - range.min));
    var newPosition = 10 - (newValue * 0.2);
    rangeV.innerHTML = `<span>${range.value}</span>`;
    rangeV.style.right = `calc(${newValue}% + (${newPosition}px))`;
  };
  document.addEventListener("DOMContentLoaded", setValue);
  range.addEventListener('input', setValue);
}

function get_answer_element_id(quest, ans = NON) {
  if (quest.question_type == AMERICAN)
    return String(quest.line + RADIO_BTN + ans).trim();

  if (quest.question_type == CHECK_BOX)
    return String(quest.line + BOX_ANS + ans).trim();

  if (quest.question_type == SLIDER)
    return String(RANGE_SLIDER + quest.line).trim();

  console.log('ERROR: Unknown question type: ' + quest.question_type);
}

function display_recomendations() {
  var recomenadtions = {};

  for (var i = 0; i < clusters.length; i++) {
    var curr_questions = clusters[i].questions;
    for (var j = 0; j < curr_questions.length; j++) {
      var quest_obj = curr_questions[j];
      recomenadtions[quest_obj.recomendation.trim()] = quest_obj.recomendation_link;
    }
  }

  $(".recomendations_for_user_ul").empty();
  for (var key in recomenadtions) {
    if (recomenadtions.hasOwnProperty(key) && key != NON && key != NA) {
      var rec = '<li><span>  ' + key + '.<a href="' + recomenadtions[key] + '" target="_blank">  <br/> למידע נוסף</a></span></li>';
      $(".recomendations_for_user_ul").append(rec);
    }
  }
  document.getElementById("card_recomendations").hidden = false;
}


function replace_null_grades_with_zero() {
  for (var i = 0; i < clusters.length; i++) {
    var curr_questions = clusters[i].questions;
    for (var j = 0; j < curr_questions.length; j++) {
      var quest = curr_questions[j];
      if (!quest.grade)
        quest.grade = 0;
    }
  }

}
function print_clusters() {
  for (var i = 0; i < clusters.length; i++) {
    var curr_questions = clusters[i].questions;
    for (var j = 0; j < curr_questions.length; j++) {
      var q = curr_questions[j];
      var user_ans = q.user_ans;
      if (q.question_type == CHECK_BOX)
        user_ans = q.check_box_ans;

      console.log("question " + q.line + ", user_ans: " + user_ans + ", grade: " + q.grade
        + ", recomenadtion: " + q.recomendation + ", link: " + q.recomendation_link);

    }
  }
}

function update_answers_of_hidden_quests(){
    for (var i = 0; i < hidden_questions.length; i++) {
      q = get_question_by_line_num(hidden_questions[i]);
      if(q.hidden)
        q.user_ans = NOT_ANSWERD;
    }
}

function get_max_cluster_score(cluster){
  var max_cluster_score = 0; 
  var questions = cluster.questions;
  for (var i = 0; i < questions.length; i++){
    if(questions[i].user_ans != NOT_ANSWERD && questions[i].grade != NON)
      max_cluster_score += Number(questions[i].max_quest_score);
  }

 return max_cluster_score
}

function calculate_final_grade() {
  var final_grade = 0;
  for (var i = 0; i < clusters.length; i++) {
    var curr_questions = clusters[i].questions;
    var curr_cluster_wight = Number(curr_questions[0].cluster_weight) / 100;
    var curr_max_cluster_score = get_max_cluster_score(clusters[i]);
    for (var j = 0; j < curr_questions.length; j++){
      var quest = curr_questions[j];
      if(quest.user_ans != NOT_ANSWERD && quest.grade != NON){
        var final_quest_score =  Number(quest.grade) / curr_max_cluster_score * 100;
        console.log("line " + quest.line + ",final_quest_score: " + final_quest_score);
        final_grade += final_quest_score * curr_cluster_wight;
      }
    }  
  }
  final_grade = Math.ceil(final_grade);
  // updating DB with the new grade of the user
  var path = get_user_db_path()
  db.ref(path).update({ grade: final_grade});  
  return final_grade;
}

function get_user_db_path(){
  return  "Users/" + userID;
}
