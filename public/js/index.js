const db = firebase.database().ref();


$("#signup").click(function () {
    $("#first").fadeOut("fast", function () {
        $("#second").fadeIn("fast");
    });
});

$("#signin").click(function () {
    $("#second").fadeOut("fast", function () {
        $("#first").fadeIn("fast");
    });

});

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        console.log("!!!!!!!!!: " + user.uid)
        window.location = "../html_pages/questionnaire.html?uid=" + user.uid;
    } else {
        console.log("User hasn't logged in yet");
    }
});

$("#login_btn").on("click", function () {
    var email = $("#email").val();
    var password = $("#password").val();
    // var error_msg = document.getElementById("error_msg_id");
    const auth = firebase.auth();

    var res = auth.signInWithEmailAndPassword(email, password);
    res.catch(e => error_msg.innerHTML = e.message);

});

$("#sbmt").on("click", function () {

    console.log("start of signup");
    var email = $("#user_email").val();
    var password = $("#user_password1").val();
    var verify = $("#user_password2").val();
    var name = $("#user_name").val();
    var gender = $('input[name=userGenderRadios]:checked').val();
    if (verify != password) {
        alert("wrong password verification");
        return;
    }

    var user_created_successfully = false;
    console.log("start of signup22222");
    firebase.auth().createUserWithEmailAndPassword(email, password).then(function (user) {
        //Registration is successful
        user_created_successfully = true;
        console.log("begin: " + user_created_successfully);
        var user = firebase.auth().currentUser;
        var userID = user.uid;

        var path = "Users/" + userID;
        console.log("db path: " + path);
        //var db = firebase.database().ref();
        db.child(path).set({
            userEmail: email,
            name: name,
            gender: gender
        }).catch(function (error) {
            console.log("Error ocurred: ", error);
        });

        console.log("end: " + user_created_successfully);
        if (user_created_successfully) {
            console.log("user created successfuly");
            document.getElementById("success_msg").innerHTML = "user created successfuly";

            window.location = "../html_pages/questionnaire.html?uid=" + user.uid;
        }
    }).catch(e => document.getElementById("error_msg").innerHTML = (e.message));
});


$("#recover_password_btn").on("click",function(){
    var auth = firebase.auth();
    var email = $("#user_recovery_email").val();
    console.log("recover email was: " + email);
    auth.sendPasswordResetEmail(email).then(function() {
        console.log("recover email sent success");
    }).catch(function(error) {
        console.log("recover email bad");
    });
});
