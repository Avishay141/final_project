var n = 0;
var questions = [];
questions.push("What is your name?");
questions.push("How old are you?");
questions.push("What do tou want from me?");
questions.push("?שאלה בעברית");

var num_of_questions = questions.length;

var current_question = 0;

$(".card .card-text").text(questions[0]);
$("h1").css("color","white");


$(".btn.btn-warning").on("click" , function(){
  $(".card .card-text").text(questions[current_question % num_of_questions]);
  $(".card .card-title").text("Question " + (current_question%num_of_questions+1) );
  current_question++;
});



var names = ["avishay", "shira", "mira", "amos"];
