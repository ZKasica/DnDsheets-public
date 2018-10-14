var xhttp = new XMLHttpRequest();
var xhttp2 = new XMLHttpRequest();

populateSmallFields = function(section, inputFields) {
      for(var i = 0; i < section.length; i++)
       {
                  inputFields.innerHTML += '<li id="characterSheets-section' + i + '" class="list-group-item bg-secondary" id="characterSheets-name"><span class="badge badge-light mb-3 p-3">' + section[i].name + ' <span id="characterSheets-nameCounter" class="badge badge-danger">' + section[i].unusedFieldCount + '</span></span></li>'
                  sectionFields = document.getElementById('characterSheets-section' + i)
                  for(var j = 0; j < section[i].row.length; j++)
                  {
                        sectionFields.innerHTML += '<div id="characterSheets-row' + i + j + '" class="d-flex flex-row"></div>'
                        rowFields = document.getElementById('characterSheets-row' + i + j)
                        for(var k = 0; k < section[i].row[j].length; k++)
                        {
                              rowFields.innerHTML += '<div class="input-group mb-3 px-1" style="width: ' + section[i].row[j][k].fieldSize + '"><div class="input-group-prepend"><span class="input-group-text bg-dark text-light" id="inputGroup-sizing-sm">' +  section[i].row[j][k].fieldName + '</span></div><input name="' + section[i].row[j][k].idName + '" type="text" class="form-control" aria-label="Sizing example input" aria-describedby="inputGroup-sizing-sm">'
                        }
                  }
       }
}

xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       var response = JSON.parse(xhttp.responseText)
       var section = response.section
       inputFields = document.getElementById('characterSheets-inputFields')
       console.log(section.length)

       populateSmallFields(section, inputFields);
    }
};





populateLargeFields = function(section, inputFields) {
  inputFields.innerHTML += '<span class="badge badge-light mb-1 p-1"><h2><span class="badge badge-dark">Descriptions and Large Notes</span></h2></span>'
  for(var i = 0; i < section.length; i++) {
    var name = section[i].fieldName;
    var lines = section[i].numLines;
    inputFields.innerHTML += '<div id="characterSheets-largeFields' + i + '" class="form-group">' + '<label for="exampleFormControlTextarea1"><span class="badge badge-dark">' + name + '</span></label>' + '<textarea class="form-control" name="' + section[i].idName + '" rows="' + lines + '"></textarea>' + '</div>'
  }
}

xhttp2.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       var response = JSON.parse(xhttp2.responseText)
       var section = response.field
       inputFields = document.getElementById('characterSheets-largeInputFields')
       console.log(section.length)

       populateLargeFields(section, inputFields);
    }
};

xhttp.open("GET", "https://carlschader.github.io/DnDsheets/characterSheet.json", true);
xhttp.send();

xhttp2.open("GET", "https://carlschader.github.io/DnDsheets/largeFields.json", true);
xhttp2.send();
