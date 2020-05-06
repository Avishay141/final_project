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

// ---- Firebase function ------





//----On click function for Submit Button
$(".submit_btn").on("click",function(){
  var num = firebase.database().ref().child("num_of_questions");
  var keys = Object.keys(num);
  console.log("aaaaaaaaaaaaaaa");
  console.log(keys);

  window.alert("num of questions is: " + num[keys[0]]);

  var db = firebase.database().ref();
   db.child("questions/aaa").set({
     question :{
       q: "q1",
       ans:{
         ans1: "answer!!1",
         ans2: "ans2!!!"
       }
     }
   });
  // db.child("questions").push().set({
  //     question: [{
  //       q: "how old are you?",
  //       ans: "my answer zzzzzzzzzzzz"
  //     }],
  //     name: "zzzz"
  // });
//   firebase.database().ref('users/' + userId).set({
//   username: name,
//   email: email,
//   profile_picture : imageUrl
// });

});



//----On click function for Read Button
$(".read_btn").on("click",function(){
  console.log("trying to read data");
  /*var db = firebase.database().ref();
  var a = db.child("questions").orderByChild("name").equalTo("zz");
  */
  var ref = firebase.database().ref("questions/");
  ref.once("value")
    .then(function(snapshot) {
      var v = snapshot.child("zz").val();
      console.log("zz = " + v);

      var v = snapshot.child("aaa/question/q").val();
      console.log("q = " + v);

      var v = snapshot.child("aaa/question/ans/ans1").val();
      console.log("ans = " + v);



      // var firstName = snapshot.child("name/first").val(); // "Ada"
      // var lastName = snapshot.child("name").child("last").val(); // "Lovelace"
      // var age = snapshot.child("age").val(); // null
    });




   });
