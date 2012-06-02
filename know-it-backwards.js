var firstScriptTag = document.getElementsByTagName('script')[0];

// 1. The <iframe> (and video player) will replace this <div> tag.
var playerdiv = document.createElement('div');
playerdiv.id = "player"
firstScriptTag.parentNode.insertBefore(playerdiv, firstScriptTag);

var markTag = document.createElement("a");
markTag.onclick = "markPhraseStart();";
markTag.textContent = "Mark start of section."
firstScriptTag.parentNode.insertBefore(markTag, firstScriptTag);

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "http://www.youtube.com/player_api";
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubePlayerAPIReady() {
  var videoId = getVideoId()
        
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: videoId,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    setTimeout(stopVideo, 6000);
    done = true;
  }
}
function stopVideo() {
  player.stopVideo();
}

function getVideoId() {
  var anchor = window.location.hash;
  var videoId;
  if(anchor) {
    videoId = anchor.match(/(v=)([^&]*)/)[2];
  }
  if(!videoId) {
    videoId = 'u1zgFlCw8Aw';
  }
  return videoId;
}

var sectionStarts = [];
function markPhraseStart(){
  sectionStarts.append(player.getCurrentTime());
}

