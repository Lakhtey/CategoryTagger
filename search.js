$(document).ready(function () {


    $("#mainbutton").click(function () {
        getTags($("#txtParagraph").val())
    });

    function getTags(paragraphText)
    {
        var jsonObj = {paragraph: paragraphText};

        POST("http://192.168.6.238:8001/tags",jsonObj).then((response) => {
            response = JSON.parse(response);
            liTxt = "";
            for(var i=0;i<response.length;i++){
                liTxt += "<li>" + response[i]["category"] + "</li>";
            }

            if(liTxt == ""){
                liTxt = "<li>No tag found.</li>"
            }

            $("#ulTags").html(liTxt);
        });

    }

    function POST(url, payload) {
        return $.ajax({
          type: "POST",
          url: url,
          data: JSON.stringify(payload),
          contentType: "application/json;charset=UTF-8",
          success: function(result) {
            return result;
          }
        });
      }
});