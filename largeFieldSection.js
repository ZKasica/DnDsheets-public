var xhttp2 = new XMLHttpRequest();

populateLargeFields = function(section, inputFields) {

	for(var i = 0; i < section.length; i++) {
		for(var j = 0; j < section.length; j++) {
			var name = section[i].fieldName;
			var lines = section[i].numLines;
			inputFields.innerHTML += '<div id="characterSheets-largeFields' + i + '" class="form-group">' + '<label for="exampleFormControlTextarea1">' + name + '</label>' + '<textarea class="form-control" id="exampleFormControlTextarea1" rows="' + lines + '"></textarea>' + '</div>'
		}
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

xhttp2.open("GET", "https://carlschader.github.io/webApps/characterSheets/largeFields.json", true);
xhttp2.send();


// <div class="form-group">
//     <label for="exampleFormControlTextarea1">Example textarea</label>
//     <textarea class="form-control" id="exampleFormControlTextarea1" rows="3"></textarea>
//   </div>