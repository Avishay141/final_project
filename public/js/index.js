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
    const auth = firebase.auth();

    var res = auth.signInWithEmailAndPassword(email, password).catch(function (error) {
        document.getElementById("error_message").innerHTML = "Incorrect Email/Password";
        $('#modalInputError').modal('show');
    });



});

$("#sbmt").on("click", function () {

    var email = $("#user_email").val();
    var password = $("#user_password1").val();
    var verify = $("#user_password2").val();
    var name = $("#user_name").val();
    var gender = $('input[name=userGenderRadios]:checked').val();
    var user_created_successfully = false;
    if(validate_signup_inputs(name,email, password, verify)){

    firebase.auth().createUserWithEmailAndPassword(email, password).then(function (user) {
        //Registration is successful
        user_created_successfully = true;
        console.log("begin: " + user_created_successfully);
        var user = firebase.auth().currentUser;
        var userID = user.uid;

        var path = "Users/" + userID;
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
            window.location = "../html_pages/questionnaire.html?uid=" + user.uid;
        }
    }).catch(e => document.getElementById("error_msg").innerHTML = (e.message));
}
});

function validate_signup_inputs(name,email, password, verify) {
    if (name.length<=0 || name.length>32) {
        document.getElementById("error_message").innerHTML = "Please enter name under 32 characters";
        $('#modalInputError').modal('show');
        return;
    }
    if (!(validateEmail(email))) {
        document.getElementById("error_message").innerHTML = "Email not Valid";
        $('#modalInputError').modal('show');
        return;
    }
    if (password < 6) {
        document.getElementById("error_message").innerHTML = "Password must contain more then 6 characters";
        $('#modalInputError').modal('show');
        return;
    }
    if (verify != password) {
        document.getElementById("error_message").innerHTML = "Passwords dosent match";
        $('#modalInputError').modal('show');
        return;
    }
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

$("#recover_password_btn").on("click", function () {
    var auth = firebase.auth();
    var email = $("#user_recovery_email").val();
    console.log("recover email was: " + email);
    auth.sendPasswordResetEmail(email).then(function () {
        console.log("recover email sent success");
    }).catch(function (error) {
        console.log("recover email bad");
    });
});
