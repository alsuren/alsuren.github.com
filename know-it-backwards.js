var newPracticePlayer = function() {

  var TIME_RESOLUTION = 0.05;
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

  var createSectionElement = function(time) {
    var e = document.createElement('input');
    e.type = 'button';
    e.value = time.toFixed(2);
    e.onclick = function(event) { self.player.seekTo(time, true) }
    return e;
  }

  var getSectionTime = function(element) {
    // FIXME: This looks fragile. Could I just attatch a bullshit float somewhere?
    return parseFloat(element.value);
  }

  var updatePhraseStartView = function() {
    var currentChild = self.sectionsElement.firstChild;
    var lastChild;
    if (!currentChild && self.sectionStarts.length) {
      currentChild = createSectionElement(self.sectionStarts[0]);
      self.sectionsElement.appendChild(currentChild);
    }

    for (var i = 0; i < self.sectionStarts.length; i++) {
      var start = self.sectionStarts[i];
      // FIXME: handle removals.
      while (currentChild && getSectionTime(currentChild) < start - TIME_RESOLUTION) {
        lastChild = currentChild;
        currentChild = currentChild.nextSibling;
      }
      if (!currentChild || getSectionTime(currentChild) > start
         + TIME_RESOLUTION) {
        var newElement = createSectionElement(start);
        self.sectionsElement.insertBefore(newElement, currentChild);
      }
      // else it's already there. Nothing to do here.
    }
  }

  var markSectionStart = function() {
    var t = self.player.getCurrentTime();
    for (var i = 0; i < self.sectionStarts.length; i++) {
      if(Math.mod(self.sectionStarts[i] - t) < TIME_RESOLUTION) {
        return;
      }
    }
    self.sectionStarts.push(t);
    self.sectionStarts.sort();
    updatePhraseStartView();
  };

  var initSectionTracking = function(desiredSibling) {
    // sorted list of seconds.
    self.sectionStarts = [];
    var markButton = document.createElement('input');
    markButton.type = 'button';
    markButton.value = 'Start New Section Now';
    markButton.onclick = markSectionStart;
    insertBefore(markButton, desiredSibling);

    self.sectionsElement = document.createElement('p');
    insertBefore(self.sectionsElement, desiredSibling);
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
