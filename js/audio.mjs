// Credit for audio: https://pixabay.com/sound-effects/search/car%20engine/
export const setupAudio = function () {
	console.log('setting up audio')
	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	// const audioSection = d3.select('main')
	// 	.insertElem('section.content', 'section', 'audio');
	// audioSection.addElem('svg')
	// 	.attr('id', 'audio');
	// audioSection.addElem('button', 'controller')
	// .on('click', _ => {
	// 	const audio = d3.select('audio').node();
	// 	if (audio.paused) playAudio();
	// 	else pauseAudio();
	// }).addElem('label')
	// 	.html('Play');
}
export const getAudio = function (url, audioContext) {
	return fetch(url)
	.then(response => response.arrayBuffer())
	.then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
	.catch(err => console.log(err))
}
export const audioElement = function (url) {
	let audio;

	if (!url) {
		if (d3.select('audio')?.node()) audio = d3.select('audio').node();
		else return [ undefined, undefined, undefined ];
	} else {
		if (d3.select('audio')?.node() && d3.select('audio')?.attr('src') === url) {
			audio = d3.select('audio').node();
		} else {
			audio = d3.select('body')
			.append('audio')
				.attr('src', url)
				.node();
		}
	}

	const promises = [];
	promises.push(audio);
	promises.push(new Promise(resolve => {
		audio.addEventListener('loadeddata', () => {
			let duration = audio.duration;
			resolve(duration);
			// The duration variable now holds the duration (in seconds) of the audio clip
		});
	}));
	promises.push(new Promise(resolve => {
		audio.addEventListener('canplaythrough', () => {
			/* the audio is now playable; play it if permissions allow */
			// myAudioElement.play();
			resolve(true);
		});
	}))
	return Promise.all(promises);
}
export const playAudio = async function (ts) {
	// ts SHOULD BE IN CENTISECONDS, AS PER THE INTERVAL SETTER BELOW
	console.log('waiting for audio variables')
	
	let audio = d3.select('audio').node();
	const controller = d3.select('button.controller label');
	controller.html('Pause');
	let duration = 0;

	if (audio) {
		duration = audio.duration;
	} else {
		const audioElement = await audioElement();
		audio = audioElement[0];
		duration = audioElement[1];
	}

	const audioDuration = duration * 100;
	let playing = !audio.paused;

	if (!ts) ts = audio.currentTime * 100;
	else audio.currentTime = ts / 100;

	const transcriptSection = d3.select(`#ts-${Math.floor(audio.currentTime)}`).node();
	if (transcriptSection) {
		transcriptSection.parentNode.classList.add('blink');

		window.scrollTo({
		  top: transcriptSection.offsetTop - window.innerHeight / 2,
		  left: 0,
		  behavior: 'smooth',
		});
	}

	if (playing) clearInterval(window.audioplayback);
	else audio.play();
	
	// SET THE VISUAL PLAYBACK ON THE WAVEFORM
	const playhead = d3.select('svg line.playhead');
	const playbackSteps = d3.scaleLinear([ 0, audioDuration ], [ 0, parseFloat(playhead.node().dataset['max_x']) ]);
	window.audioplayback = setInterval(function () {
		ts ++;
		playhead.attr('transform', `translate(${[ playbackSteps(ts), 0 ]})`);
		// console.log(audio.currentTime, ts, playbackSteps(ts))
		if (ts >= audioDuration) {
			playing = false;
			ts = 0;
			pauseAudio();
		}
	}, 10);
}
export const pauseAudio = function () {
	const audio = d3.select('audio').node();
	const controller = d3.select('button.controller label');
	controller.html('Play');
	clearInterval(window.audioplayback);
	audio.pause();
}