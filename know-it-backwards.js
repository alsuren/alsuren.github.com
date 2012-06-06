var newPracticePlayer = function() {

    var TIME_RESOLUTION = 0.2;
    var DEFAULT_INTRO_PERIOD = 1;
    var DEFAULT_VIDEO = 'u1zgFlCw8Aw';
    // Can you tell that I'm a python programmer yet?
    var self = {};


    var getVideoId = function() {
        var anchor = window.location.hash;
        var videoId;
        if (anchor) {
            videoId = (anchor.match(/(v=)([^&]*)/) || [])[2];
        }
        if (!videoId) {
            videoId = DEFAULT_VIDEO;
        }
        return videoId;
    };

    var getIntroPeriod = function() {
        var anchor = window.location.hash;
        var intro;
        if (anchor) {
            intro = (anchor.match(/(intro=)([^&]*)/) || [])[2];
        }
        if (!intro || isNaN(parseFloat(intro))) {
            intro = DEFAULT_INTRO_PERIOD;
        }
        return parseFloat(intro);
    };

    var getSections = function() {
        var anchor = window.location.hash;
        var sections;
        if (anchor) {
            sections = (anchor.match(/(sections=)([^&]*)/) || [])[2];
        }
        if (!sections) {
            return [];
        }
        var floatList = sections.split(',').map(function(s) {
            return parseFloat(s);
        });
        return floatList;
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
            self.player.seekTo(time - self.introPeriod, true);
        };
        return e;
    };

    var getSectionTime = function(element) {
        // FIXME: This looks fragile. Could I just attatch a bullshit float somewhere?
        return parseFloat(element.value);
    };

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
    };

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
        hash = hash + 'sections=' + sections + '&';
        hash = hash + 'intro=' + self.introPeriod.toFixed(1);
        window.location.hash = hash;
    };

    var stopTraining = function() {
        self.trainingGeneration++;
        self.player.stopVideo();
        self.trainButton.value = 'Train!';
        self.trainButton.onclick = startTraining;
    }

    var startTrainingRun = function(userData) {
        if (self.trainingGeneration !== userData.trainingGeneration) {
            return;
        }
        self.trainingRunsDone++;
        var i = self.sectionStarts.length - (self.trainingRunsDone + 1);
        if (i < 0) {
            stopTraining();
            return;
        }
        var pos = self.sectionStarts[i] - self.introPeriod;
        self.player.seekTo(pos);

        setTimer(userData);
    };

    var last = function(a) {
        return a[a.length - 1];
    };

    var makeUpTheDifference = function(userData) {
        var endTime = last(self.sectionStarts);
        var curTime = self.player.getCurrentTime();
        var timeout = (endTime - curTime) * 1000;
        setTimeout(startTrainingRun, timeout, userData);
    }

    var setRealTimer = function(userData) {
        var endTime = last(self.sectionStarts);
        var curTime = self.player.getCurrentTime();
        var timeout = (endTime - curTime) * 1000;
        setTimeout(makeUpTheDifference, timeout, userData);
    }

    var setTimer = function(userData) {
        setTimeout(setRealTimer, 1000, userData);
    };

    self.trainingGeneration = 0;
    var startTraining = function() {
        self.trainingGeneration++;
        var userData = {
            trainingGeneration: self.trainingGeneration
        };
        self.trainingRunsDone = 0;

        self.trainButton.value = 'Stop!';
        self.trainButton.onclick = stopTraining;
        startTrainingRun(userData);
    };

    var getCurrentVideo = function() {
        if (!self.player.getVideoUrl) {
            // Assume it'll get there eventually.
            return getVideoId();
        }
        var current = (self.player.getVideoUrl().match(/(v=)([^&]*)/) || [])[2];
        if (!current) {
            return getVideoId();
        }
    }

    var reparseHash = function() {
        self.sectionStarts = getSections();
        var currentVideo = getCurrentVideo();
        var requestedVideo = getVideoId();
        if (currentVideo !== requestedVideo) {
            console.log("changing video from " + currentVideo + " to " + requestedVideo);
            self.player.loadVideoById(requestedVideo);
        }
        self.introPeriod = getIntroPeriod();
        updateSectionView();
    };

    var initSectionTracking = function(desiredSibling) {
        // sorted list of seconds.
        self.sectionStarts = getSections();
        if ('onhashchange' in window) {
            window.onhashchange = reparseHash;
        }
        var markButton = document.createElement('input');
        markButton.type = 'button';
        markButton.value = 'Mark Section';
        markButton.onclick = markSectionStart;
        insertBefore(markButton, desiredSibling);

        var saveButton = document.createElement('input');
        saveButton.type = 'button';
        saveButton.value = 'Save';
        saveButton.onclick = saveToUri;
        insertBefore(saveButton, desiredSibling);

        self.trainButton = document.createElement('input');
        self.trainButton.type = 'button';
        self.trainButton.value = 'Train!';
        self.trainButton.onclick = startTraining;
        insertBefore(self.trainButton, desiredSibling);

        self.sectionsElement = document.createElement('p');
        insertBefore(self.sectionsElement, desiredSibling);

        reparseHash();
    };

    self.init = function() {
        var firstDivTag = document.getElementsByTagName('div')[0];
        self.player = newPlayer(firstDivTag);
        initSectionTracking(firstDivTag);
    };

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

