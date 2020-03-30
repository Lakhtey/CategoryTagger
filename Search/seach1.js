$(document).ready(function() {
    

    

    $("#searchMe1").click(function() {
        var wordText = $("#txtTopRecommendations").val();
        var token = {
            "query": {
                "match" : {
                    "RootPath.keyword": "E:\\Authority\\"
                }
            }
        
        }

        $.ajax({
            url: "http://localhost:9200/check26/_search",
            type: 'Get',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            crossDomain: true,
            cache: true,
            data: {
                source: JSON.stringify(token),
                source_content_type: "application/json"
            },
            success: function (response) {

                //$("#result1").html(JSON.stringify(response));
                $("#spnTotalCount").html(response.hits.total.value);
                var text = "<ol>";
                for(var i=0;i<response.hits.hits.length;i++)
                {
                    var sentence = response.hits.hits[i]._source.sentence;
                    text += "<li>";
                    text += "[<b>" + response.hits.hits[0]._source.documentName + "</b>] " + sentence;
                    text += "</li>"
                }

                text += "</ol>";

                var regExp = new RegExp(wordText, 'gi');

                text = text.replace(regExp, '<span class="highlightText">' + wordText + '</span>')

                //text = text.replace(/window/g, 'blabla')

                $("#result1").html(text);


            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
            },
        });
    });
});