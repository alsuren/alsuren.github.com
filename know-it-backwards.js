var newPracticePlayer = function() {

    var TIME_RESOLUTION = 0.2;
    // Can you tell that I'm a python programmer?
    var self = {};


    var getVideoId = function() {
        var anchor = window.location.hash;
        var videoId;
        if (anchor) {
            videoId = anchor.match(/(v=)([^&]*)/)[2];
        }
        if (!videoId) {
            videoId = 'u1zgFlCw8Aw';
        }
        return videoId;
    };

    var getSections = function() {
        var anchor = window.location.hash;
        var sections;
        if (anchor) {
            sections = anchor.match(/(sections=)([^&]*)/)[2];
        }
        if (!sections) {
            return [];
        }
        var floatList = sections.split(',').map(function(s) {
            return parseFloat(s);
        });
        return floatList;
    }

    var insertBefore = function(newNode, desiredSibling) {
        desiredSibling.parentNode.insertBefore(newNode, desiredSibling);
    };

    var newPlayer = function(desiredSibling) {
        // The <iframe> (and video player) will replace this <div> tag.
        var playerdiv = document.createElement('div');
        playerdiv.id = 'player';
        insertBefore(playerdiv, desiredSibling);

        var videoId = getVideoId();

        var player = new YT.Player('player', {
            height: '390',
            width: '640',
            videoId: videoId,
            events: {
                'onReady': startTraining
            }
        });

        return player;
    };

    var createSectionElement = function(time) {
        var e = document.createElement('input');
        e.type = 'button';
        e.value = time.toFixed(1);
        e.onclick = function(event) {
            self.player.seekTo(time, true)
        }
        return e;
    }

    var getSectionTime = function(element) {
        // FIXME: This looks fragile. Could I just attatch a bullshit float somewhere?
        return parseFloat(element.value);
    }

    var updateSectionView = function() {
        var currentChild = self.sectionsElement.firstChild;
        var lastChild;
        if (!currentChild && self.sectionStarts.length) {
            currentChild = createSectionElement(self.sectionStarts[0]);
            self.sectionsElement.appendChild(currentChild);
        }

        for (var i = 0; i < self.sectionStarts.length; i++) {
            var start = self.sectionStarts[i];
            while (currentChild && getSectionTime(currentChild) < start - TIME_RESOLUTION) {
                lastChild = currentChild;
                currentChild = currentChild.nextSibling;
                self.sectionsElement.removeChild(lastChild);
            }
            if (!currentChild || getSectionTime(currentChild) > start + TIME_RESOLUTION) {
                var newElement = createSectionElement(start);
                self.sectionsElement.insertBefore(newElement, currentChild);
            }
            else if (currentChild) {
                // it's already there. Skip over it.
                currentChild = currentChild.nextSibling;
            }
        }

        while (currentChild && getSectionTime(currentChild) > last(self.sectionStarts) + TIME_RESOLUTION) {
            lastChild = currentChild;
            currentChild = currentChild.nextSibling;
            self.sectionsElement.removeChild(lastChild);
        }
    }

    var markSectionStart = function() {
        var t = self.player.getCurrentTime();
        for (var i = 0; i < self.sectionStarts.length; i++) {
            if (Math.abs(self.sectionStarts[i] - t) < TIME_RESOLUTION) {
                return;
            }
        }
        self.sectionStarts.push(t);
        self.sectionStarts.sort(function(a, b) {
            return a - b
        });
        updateSectionView();
    };

    var saveToUri = function() {
        var hash = "?";
        var videoId = self.player.getVideoUrl().match(/(v=)([^&]*)/)[2];
        if (videoId) {
            hash = hash + 'v=' + videoId + '&';
        }
        var sectionStrings = self.sectionStarts.map(function(i) {
            return i.toFixed(1)
        });
        var sections = sectionStrings.join(',');
        hash = hash + 'sections=' + sections;
        window.location.hash = hash;
    }



    var startTrainingRun = function() {
        self.trainingRunsDone++;
        var i = self.sectionStarts.length - (self.trainingRunsDone + 1);
        if (i < 0) {
            self.player.stopVideo();
            return;
        }
        var pos = self.sectionStarts[i];
        self.player.seekTo(pos);

        setTimer();
    };

    var last = function(a) {
        return a[a.length - 1];
    };

    var makeUpTheDifference = function() {
        var endTime = last(self.sectionStarts);
        var curTime = self.player.getCurrentTime();
        var timeout = (endTime - curTime) * 1000;
        setTimeout(startTrainingRun, timeout);
    }

    var setRealTimer = function() {
        var endTime = last(self.sectionStarts);
        var curTime = self.player.getCurrentTime();
        var timeout = (endTime - curTime) * 1000;
        setTimeout(makeUpTheDifference, timeout);
    }

    var setTimer = function() {
        setTimeout(setRealTimer, 1000);
    };

    var startTraining = function() {
        console.log('starting')
        self.trainingRunsDone = 0;
        startTrainingRun();
    };

    var reparseHash = function() {
        self.sectionStarts = getSections();
        var currentVideo = self.player.getVideoUrl().match(/(v=)([^&]*)/)[2];
        var requestedVideo = getVideoId()
        if (currentVideo !== requestedVideo) {
            self.player.loadVideoById(requestedVideo);
        }
        updateSectionView();
    }

    var initSectionTracking = function(desiredSibling) {
        // sorted list of seconds.
        self.sectionStarts = getSections();
        if ('onhashchange' in window) {
            window.onhashchange = reparseHash;
        }
        var markButton = document.createElement('input');
        markButton.type = 'button';
        markButton.value = 'Start Section';
        markButton.onclick = markSectionStart;
        insertBefore(markButton, desiredSibling);

        var saveButton = document.createElement('input');
        saveButton.type = 'button';
        saveButton.value = 'Save';
        saveButton.onclick = saveToUri;
        insertBefore(saveButton, desiredSibling);

        var trainButton = document.createElement('input');
        trainButton.type = 'button';
        trainButton.value = 'Train!';
        trainButton.onclick = startTraining;
        insertBefore(trainButton, desiredSibling);

        self.sectionsElement = document.createElement('p');
        insertBefore(self.sectionsElement, desiredSibling);

        updateSectionView();
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

