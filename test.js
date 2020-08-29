    var detalis = "Avishay ophir";

    var new_li_str = '<li class="list-group-item" style="background-color: rgb(153, 187, 255)">' +detalis+
     '  <button type="button" class="btn btn-dark li" id="plus" style="float: right">+</button>   </li>';

     $(".list-group").append(new_li_str);
    var div = '<div class="replyPanel" id="reply_id" hidden> <h4> title </h4>'
    +   '  <textarea class="about_me_txt" rows="8" placeholder="Tell us about yourself..." style="width: 100%" id="about_me"></textarea>   </div>'; 

    $(".list-group").append(div);



    $(".btn.btn-dark.li").on("click",plus_btn_click);



    function plus_btn_click(event){
        console.log("id: " + $(this).attr('id'));
        var btn_id =  $(this).attr('id');
        var h =   document.getElementById("reply_id").hidden;
        document.getElementById("reply_id").hidden = !h;
       

    }
