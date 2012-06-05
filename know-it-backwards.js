var newPracticePlayer = function() {

  // Can you tell that I'm a python programmer?
  var self = {};


  var getVideoId = function() {
    var anchor = window.location.hash;
    var videoId;
    if(anchor) {
      videoId = anchor.match(/(v=)([^&]*)/)[2];
    }
    if(!videoId) {
      videoId = 'u1zgFlCw8Aw';
    }
    return videoId;
  };

  var insertBefore = function(newNode, desiredSibling) {
    desiredSibling.parentNode.insertBefore(newNode, desiredSibling);
  };

  var newPlayer = function(desiredSibling) {
    // The <iframe> (and video player) will replace this <div> tag.
    var playerdiv = document.createElement('div');
    playerdiv.id = 'player';
    insertBefore(playerdiv, desiredSibling);

    var videoId = getVideoId();

    var onPlayerReady = function(event) {
      player.playVideo();
    };

    var done = false;
    function onPlayerStateChange(event) {
      if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
      }
    };

    var stopVideo = function() {
      player.stopVideo();
    };

    var player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: videoId,
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });

    return player;
  };

  var markSectionStart = function() {
    self.sectionStarts.push(self.player.getCurrentTime());
  };

  var initSectionTracking = function(desiredSibling) {
    self.sectionStarts = [];
    var markButton = document.createElement('input');
    markButton.type = 'button';
    markButton.value = 'Start New Section Now';
    markButton.onclick = markSectionStart;

    insertBefore(markButton, desiredSibling);
  }

  self.init = function() {
    var firstDivTag = document.getElementsByTagName('div')[0];
    self.player = newPlayer(firstDivTag);
    initSectionTracking(firstDivTag);
  }

  return self;
}

function onYouTubePlayerAPIReady() {
  // Global player object for debugging.
  // I think that we could let the player go out of scope and it would still leak:
  // The onclick callback closures should keep it alive.
  practicePlayer = newPracticePlayer();
  practicePlayer.init()
}

  // Create player api asyncronously. This will call onYoutubePlayerApiReady for us.
  var tag = document.createElement('script');
  var firstScriptTag = document.getElementsByTagName('script')[0];
  tag.src = "http://www.youtube.com/player_api";
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
