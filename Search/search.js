 var docResults = [];
 var pageSize = 500
 var pageStart = 0
 var totalSize = 0

 function showMoreResults()
 {
     pageStart += pageSize;
     var wordText = $("#txtTopRecommendations").val();
     exactSearch(wordText,false);
 }

$(document).ready(function () {
    resetPaging();

    $("#btnShowMore").hide();
        // load drop down
    $('#drpDocuments').select2();
    loadDropDown();


    $("#chkExactSearch").prop("checked", true);

    $('#chkExactSearch').change(function() {
        $("#chkQnA").prop("checked", !this.checked);
    });

    $('#chkQnA').change(function() {      
        $("#chkExactSearch").prop("checked", !this.checked);
    });
	
	$(function() {
        $("form").submit(function() { return false; });
    });

    $(".applySearch").click(function () {
        var wordText = $("#txtTopRecommendations").val();
        if($("#chkExactSearch").is(":checked"))
        {
            resetPaging();
            exactSearch(wordText, true);
        }
        else{
            qnASearch(wordText);
        }
        
    });
});


//     data = {"question" : "How to obtain input data for computer fire model?"}
// data_json = json.dumps(data)
// r = requests.get('http://127.0.0.1:5000/ask', json=data_json)
// print(r.text)



    function qnASearch(wordText){
        startSearch();
        $.ajax({
            url: "http://192.168.6.129:5432/ask?question=" + wordText,
            type: 'GET',
            //dataType: 'json',
            //contentType: 'application/json; charset=utf-8',
            crossDomain: true,
            cache: true,
            // data: {
            //     source: token,
            //     source_content_type: "application/json"
            // },
            success: function (response) {
                if(response.length > 0)
                {
                processAnswerResponse(response)
                }
                else{
                    endSearch();
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                endSearch();
            }
        });

    }

    function processAnswerResponse(response)
    {
        //alert(response);
			
		response = JSON.parse(response);
		var text = "";
        $("#spnTotalCount").html(response.length);
		for(var i=0; i<response.length; i++)
		{
            var detailedInfo = getDetailedInfo(response[i][1],response[i][2], response[i], i==response.length-1);
		}
    }

    function getDetailedInfo(documentName, sentence, res, islastrecord){
        var token = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "match": {
                                "documentName.keyword": "" + documentName + ""
                            }
                        },
                        {
                            "match": {
                                "sentence.keyword": "" + sentence + ""
                            }
                        }
                    ]

                }
            }
        };

        $.ajax({
            url: "http://192.168.6.238:9200/mepnew/_search",
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

               
                var text = "";
                var obj = null;
                for (var i = 0; i < response.hits.hits.length; i++) {
                    obj = response.hits.hits[i]._source;
                    var pattern = "\\\\",
                    re = new RegExp(pattern, "g");
                    obj.documentPath = obj.documentPath.replace(re,"/");
                    //obj.documentPath = obj.documentPath.replace("E:","D:");
                    obj.documentPath = obj.documentPath.replace(/ /g,"%20");
                }

                if(obj)
                {
                    res[2] = res[2].replace(res[0],"<span style='background-color:yellow'>" + res[0] + "</span>");


                    text += "<div class='card' style='margin-bottom: 10px;'>";
                        text += "<div class='card-body'>";
                            text += "<div class='card-title'><b>Document Name: <span style='color:#4fa746'>" + res[1] + "</span></b><span class='float-right'><a href=file://" + obj.documentPath + "#page=" + obj.pageNo + " target='_blank'>Open file</a></span></div>";
                            text += "<div style='COLOR: RED;'>" + res[0] + "</div>";
                            text += "<div>" + res[2] + "</div>";
                            text += "<div> <span class='float-right' style='color:red;font-size: 14px;font-weight: 600;margin-bottom: 6px;'>Page No: " + obj.pageNo + "</span></div>";
                        text += "</div>";
                    text += "</div>";

                    $("#result1").append(text);
                }

                if(islastrecord)
                {
                    endSearch();
                }



            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                endSearch();
            }
        });
    }

    function exactSearch(wordText, isFirstPage){
        if(isFirstPage)
        {
            startSearch();
        }

        var selectedDocsText = [];
        selectedDocsText = getSelectedDocsText();
        // var token = {
        //     "from": 0, "size": 1000,
        //     "query": {
        //         "bool": {
        //             "should": [
        //                 {
        //                     "query_string": {
        //                         "query": "" + wordText + ""
        //                     }
        //                 }
        //             ]

        //         }
        //     },
        //     "aggs": {
        //         "sentence": {
        //             "terms": {
        //                 "field": "sentence",
        //                 "size": 500
        //             }
        //         }
        //     },
        //     "highlight": {
        //         "fields": {
        //             "sentence": {}
        //         }
        //     }
        // };

        var offset = parseInt(pageStart) + parseInt(pageSize);

        if(totalSize != 0 && offset > totalSize)
        {
            offset = totalSize;
            $("#btnShowMore").hide();
        }

        var selectedDocsTxt = getSelectedDocsText();

        var token = '';
        token += '{"from":' + pageStart + ', "size":' +  offset + ',"query":{"bool": {';

        token += '"should": { "match": {'
        token += '"sentence": "' + wordText + '"';
        token += '}}';

        if(selectedDocsText.length > 0)
        {
            token += ',"must": { "bool": {';
            token += '"should": [{"match": {"documentName":';
            docstxt = "";
            for(var j=0;j < selectedDocsTxt.length; j++)
            {
                if(j!=0)
                {
                    docstxt += ' AND '
                }
                docstxt += selectedDocsText[j]
            }

            docstxt = docstxt.trim();

            token += '"' + docstxt + '"' + '}}]';
            token += '}}';
        }

        // token += '"filter": {"term" : { "sentence": "' + wordText + '" }}';
        token += '}},';
        token += '"aggs": {"sentence": {"terms": {"field": "sentence","size": 500}}},"highlight": {"fields": {"sentence": {}}}}'


        $.ajax({
            url: "http://192.168.6.238:9200/mepnew/_search",
            type: 'Get',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            crossDomain: true,
            cache: true,
            data: {
                source: JSON.stringify(JSON.parse(token)),
                source_content_type: "application/json"
            },
            success: function (response) {
                $("#spnTotalCount").html(response.hits.total);
                totalSize = response.hits.total
                var text = "";
				
                for (var i = 0; i < response.hits.hits.length; i++) {
					text = "";
					var sentence = response.hits.hits[i]._source.sentence;
					if(response.hits.hits[i].highlight)
                    {
                        var highlightText = response.hits.hits[i].highlight.sentence;

                        for (var j = 0; j < highlightText.length; j++) {

                            var highlight = highlightText[j].match(/<em>(.*?)<\/em>/g);

                            for (var l = 0; l < highlight.length; l++) {
                                highlight[l] = highlight[l].replace("<em>", "").replace("</em>", "");

                                var regExp = new RegExp(highlight[l], 'gi');
                                sentence = sentence.replace(regExp, '<span class="highlightText">' + highlight[l] + '</span>');
                            }
                        }
						
						 
                    }
					
                    var pattern = "\\\\",
                    re = new RegExp(pattern, "g");
                    response.hits.hits[i]._source.documentPath = response.hits.hits[i]._source.documentPath.replace(re,"/");
                    response.hits.hits[i]._source.documentPath = response.hits.hits[i]._source.documentPath.replace("E:","O:/IT");
                    response.hits.hits[i]._source.documentPath = response.hits.hits[i]._source.documentPath.replace(/ /g,"%20");
                    
                    text += "<div class='card' style='margin-bottom: 10px;'>";
                    text += "<div class='card-body'>";
                    text += "<div class='card-title'><b>Document Name: <span style='color:#4fa746'>" + response.hits.hits[i]._source.documentName + "</span></b><span class='float-right'><a href=file://" + response.hits.hits[i]._source.documentPath + "#page=" + response.hits.hits[i]._source.pageNo + " target='_self'>Open file</a></span></div>";
                    text += "<div>" + sentence + "</div>";
                    text += "<div> <span class='float-right' style='color:red;font-size: 14px;font-weight: 600;'>Page No: " + response.hits.hits[i]._source.pageNo + "</span></div></div>";
                    text += "</div>";
                    //Highlight Text
                    //console.log(response.hits.hits[i]);

                    
					$("#result1").append(text);
                    /////
                }

                if(isFirstPage && offset < totalSize)
                {
                    $("#btnShowMore").show();
                }
                else if(isFirstPage && offset >= totalSize)
                {
                    $("#btnShowMore").hide();
                }



                //$("#result1").html(text);

                var bucketArray = response.aggregations.sentence.buckets;

                var words = "";
                for (var i = 0; i < bucketArray.length; i++) {

                    var fontSize = "";
                    if (bucketArray[i].doc_count < 16) {
                        fontSize = "font-size:16px;";
                    }
                    else if (bucketArray[i].doc_count > 50) {
                        fontSize = "font-size:50px;font-weight:bold";
                    }
                    else {
                        fontSize = "font-size:" + bucketArray[i].doc_count + "px;font-weight:bold";
                    }

                    words += "<span style='" + fontSize + "'>" + bucketArray[i].key + ", </span>";

                }
                $("#words").html(words);

                endSearch();

            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                endSearch();
            }
        });
    }
	
	$("#txtTopRecommendations").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#searchMe1").click();
        }
    });

    function loadDropDown(){
        docResults = [];

        $('#drpDocuments').select2({
            ajax: {
              url: 'http://192.168.6.238:9200/mepnew/_search',
              type: 'Get',
              dataType: 'json',
              contentType: 'application/json; charset=utf-8',
              crossDomain: true,
              cache: true,
              data: function (params) {
                var drpText = $(".select2-search__field").val();
                var query = {};
                if(drpText.trim() == "")
                {
                    query = {
                        "size": 0,
                        "aggs" : {
                            "documentName" : {
                                "terms" : { "field" : "documentName.keyword",  "size" : 100000 }
                            }
                        }
                    };
                }
                else{
                    query = {
                        "size": 0,
                        "query": {"bool":{
                            "must":{
                              "query_string": {
                                            "query": drpText,
                                            "analyze_wildcard":true,
                                            "default_field": "documentName"
                                            }
                                                 
                            }
                            }
                          },
                        "aggs" : {
                            "documentName" : {
                                "terms" : { "field" : "documentName.keyword",  "size" : 100000 }
                            }
                        }
                    };
                }
                
                return {
                    source: JSON.stringify(query),
                    source_content_type: "application/json"
                };
              },
              processResults: function (data) {
                docResults = [];
                var bucketArray = data.aggregations.documentName.buckets;

                for (var i = 0; i < bucketArray.length; i++) {
                    docResults.push({id: i, text: bucketArray[i].key});
                }

                //return docResults;
                // Transforms the top-level key of the response object from 'items' to 'results'
                return {
                  results: docResults
                };
              },
              error: function (xhr, ajaxOptions, thrownError) {
                  //alert(xhr.status);
              }
            }
          });


    }

    function getSelectedDocsText()
    {
        var selectedVals = $("#drpDocuments").val();
        var selectedDocsTxt = [];
        for(var i=0;i < selectedVals.length; i++){ selectedDocsTxt.push(docResults[selectedVals[i]].text) }

        return selectedDocsTxt;

    }


    function startSearch(){
        $("#result1").html("");
        $("#words").html("");
        $("#spnTotalCount").html("0");
        $("#searchMe1").prop('disabled', true);
        $("#imgSearching").show();        
    }

    function endSearch(){
        $("#searchMe1").prop('disabled', false);
        $("#imgSearching").hide();
    }

    function resetPaging(){
        pageSize = 100
        pageStart = 0
        totalSize = 0
    }

    function openNav() {
        document.getElementById("mySidenav").style.width = "300px";
        document.getElementById("main").style.marginLeft = "300px";
      }
      
    function closeNav() {
        document.getElementById("mySidenav").style.width = "0";
        document.getElementById("main").style.marginLeft = "0";
    }
      