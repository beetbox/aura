document.addEventListener("DOMContentLoaded", function() {
  var ajax = function (url, success) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var res = JSON.parse(this.responseText);
      success(res);
    };
    xhr.open("get", url);
    xhr.send();
  };

  var tracklist = document.getElementById('tracklist');
  var baseurl = 'http://0.0.0.0:8338/aura';

  ajax(baseurl + '/server', function (json) {
    var attr = json["attributes"];
    for (var a in attr)
      document.getElementById(a).textContent = a + ': ' + attr[a];
  });

  ajax(baseurl + '/tracks', function (json) {
    for (var i = 0; i < json.tracks.length; ++i) {
      var track = json.tracks[i];

      var link = document.createElement('a');
      link.textContent = track.title;
      link.href = baseurl + '/tracks/' + track.id + '/audio';

      var li = document.createElement('li');
      li.appendChild(document.createTextNode(
        track.artist + ' - ' + track.album + ' - '
      ));
      li.appendChild(link);

      tracklist.appendChild(li);
    }
  });
});
