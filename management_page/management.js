
  const db = firebase.database();
  var questions_list = [];
  var MAX_NUM_OF_ANSWERS = 5;
  var question_to_delete_id;

  db.ref("questions/").on("value", get_questions_data);

$(".submit_btn").on("click" , create_new_questions);





function create_new_questions(){
  var max_num_of_answers = 5;
  answers_arr = [];
  var question = $(".input_question").val();

  for(var i =1; i <= max_num_of_answers; i++){
    var ans = $("#answer"+i).val();
    if(ans !="")
      answers_arr.push(ans);
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








/* id's formats:
li : 1_q
textarea of questions_input:  1_q_editQuest
textarea of answer: 1_q_2_answer
delet button: 1_q_delete_btn
save button: 1_q_save_btn

*/



function update_html_question_list(){
  console.log("enterd update_html_question_list, questions_list.length: "+ questions_list.length);
  $(".list-group.questions").empty();
  for(var i =0; i < questions_list.length; i++){
    var question_id = questions_list[i].id+"_q";
    var details =""+i+". "  + questions_list[i].question;
    var new_li_str = '<li class="list-group-item" style="background-color: rgb(153, 187, 255)" dir="rtl">' +details+
    '  <button type="button" class="btn btn-dark li" id="' +question_id+'" style="float: left">+</button>  </li>';
  
    $(".list-group.questions").append(new_li_str);

   
   var div = '<div class="replyPanel" id="' +question_id+'_panel" hidden> <h4> title </h4>'
   + ' <textarea class="questions_input" rows="2"  style="width: 100%" id="'+question_id+'_editQuest" dir="rtl">'+questions_list[i].question+'</textarea>';

   for(var j =0;  j < questions_list[i].answers.length ; j++)
     div += '<textarea class="answer" rows="1"  style="width: 100%" id="'+question_id+'_'+j+'_answer" dir="rtl">'+questions_list[i].answers[j]+'</textarea>'
   
    
    div+='<button type="button" class="btn btn-danger delete" id="' +question_id+'_delete_btn" style="float: right">מחק שאלה</button>';
    div+='<button type="button" class="btn btn-success save" id="' +question_id+'_save_btn" style="float: left">שמור</button>';

    div+= '</div>'; 
  
   $(".list-group.questions").append(div);
   

  }


  $(".btn.btn-dark.li").on("click",plus_btn_click);
  $(".btn.btn-danger.delete").on("click",delete_btn_click);
  $(".btn.btn-success.save").on("click",save_btn_click);


}




function get_questions_data(data){
      console.log("enter got_data");
      questions_list = [];
      var questions_obj = data.val();
      var keys = Object.keys(questions_obj);
      console.log("keys: " + keys);

      for (var i =0; i< keys.length; i++){
          if (keys[i] != 'next_id'){
            k = keys[i];
            add_question_to_list(questions_obj[k]);
          }
      }

    update_html_question_list();

}

function add_question_to_list(quest_obj){
  new_quest = {
    id : quest_obj.id,
    question : quest_obj.question,
    answers : quest_obj.answers
  }
  questions_list.push(new_quest);
}

function save_btn_click(event){
  var quest_id = $(this).attr('id')[0];
  var new_quest = document.getElementById(quest_id+"_q_editQuest").value;
  var new_answers_arr =[];
  for(var i =0; i<MAX_NUM_OF_ANSWERS;i++){
    var ans_id = quest_id+"_q_"+i+"_answer";
  
    var temp_ans = document.getElementById(ans_id);
    if(temp_ans)
      new_answers_arr.push(temp_ans.value);
    

  }

  db.ref("questions/"+quest_id+"/").update({
    question:new_quest,
    answers:new_answers_arr
  });

  $('#save_changes_success').modal('show');

}

function delete_btn_click(event){
  $('#delete_verify').modal('show');
  question_to_delete_id = $(this).attr('id')[0];
}

$('#delete-verify-yes-btn').on("click",function(){
  console.log("questions/" + question_to_delete_id +"/");
  db.ref("questions/" + question_to_delete_id +"/").remove();
});



function plus_btn_click(event){
  var panel_id =  $(this).attr('id') + "_panel";
  console.log("panel_id: " + panel_id)
  var hidden_val = document.getElementById(panel_id).hidden;
  document.getElementById(panel_id).hidden = !hidden_val;
   

}


