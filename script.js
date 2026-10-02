const textInput = document.querySelector("#text-input");
const voiceSelect = document.querySelector("#voice-select");
const rateRange = document.querySelector("#rate-range");
const pitchRange = document.querySelector("#pitch-range");
const speakButton = document.querySelector("#speak-button");
const speakLabel = document.querySelector("#speak-label");
const pauseButton = document.querySelector("#pause-button");
const stopButton = document.querySelector("#stop-button");
const statusText = document.querySelector("#status-text");
const characterCount = document.querySelector("#character-count");
const rateValue = document.querySelector("#rate-value");
const pitchValue = document.querySelector("#pitch-value");

const synthesis = window.speechSynthesis;
let availableVoices = [];

function setStatus(message, state = "ready") {
	statusText.textContent = message;
	document.querySelector(".playback-status").dataset.state = state;
}

function loadVoices() {
	if (!synthesis) {
		voiceSelect.innerHTML = "<option value=\"\">Speech is not supported</option>";
		speakButton.disabled = true;
		pauseButton.disabled = true;
		stopButton.disabled = true;
		setStatus("Speech synthesis is not supported in this browser", "error");
		return;
	}

	availableVoices = synthesis.getVoices();
	const selectedVoice = voiceSelect.value;
	voiceSelect.replaceChildren();

	if (availableVoices.length === 0) {
		const option = document.createElement("option");
		option.value = "";
		option.textContent = "Default device voice";
		voiceSelect.append(option);
		return;
	}

	availableVoices.forEach((voice, index) => {
		const option = document.createElement("option");
		option.value = String(index);
		option.textContent = `${voice.name} (${voice.lang})${voice.default ? " · Default" : ""}`;
		voiceSelect.append(option);
	});

	if (selectedVoice && Number(selectedVoice) < availableVoices.length) {
		voiceSelect.value = selectedVoice;
	} else {
		const defaultIndex = availableVoices.findIndex((voice) => voice.default);
		voiceSelect.value = String(defaultIndex >= 0 ? defaultIndex : 0);
	}
}

function updatePlaybackControls(isActive) {
	pauseButton.disabled = !isActive;
	stopButton.disabled = !isActive;
	speakButton.disabled = !synthesis;
}

function readAloud() {
	const text = textInput.value.trim();
	if (!text) {
		textInput.focus();
		setStatus("Add some text to read aloud", "error");
		return;
	}

	if (!synthesis) {
		setStatus("Speech synthesis is not supported in this browser", "error");
		return;
	}

	synthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	const voiceIndex = Number(voiceSelect.value);
	if (Number.isInteger(voiceIndex) && availableVoices[voiceIndex]) {
		utterance.voice = availableVoices[voiceIndex];
		utterance.lang = availableVoices[voiceIndex].lang;
	}
	utterance.rate = Number(rateRange.value);
	utterance.pitch = Number(pitchRange.value);
	utterance.onstart = () => {
		speakLabel.textContent = "Restart reading";
		updatePlaybackControls(true);
		setStatus("Speaking your text", "speaking");
	};
	utterance.onend = () => {
		speakLabel.textContent = "Read aloud";
		updatePlaybackControls(false);
		setStatus("Finished reading", "ready");
	};
	utterance.onerror = (event) => {
		speakLabel.textContent = "Read aloud";
		updatePlaybackControls(false);
		if (event.error !== "canceled" && event.error !== "interrupted") {
			setStatus("Playback could not start. Try another voice.", "error");
		}
	};

	synthesis.speak(utterance);
	speakLabel.textContent = "Restart reading";
	updatePlaybackControls(true);
	setStatus("Starting playback", "speaking");
}

textInput.addEventListener("input", () => {
	characterCount.textContent = textInput.value.length.toLocaleString();
	if (!synthesis.speaking) setStatus("Ready when you are", "ready");
});

document.querySelector("#clear-button").addEventListener("click", () => {
	textInput.value = "";
	characterCount.textContent = "0";
	textInput.focus();
	if (synthesis) synthesis.cancel();
	speakLabel.textContent = "Read aloud";
	updatePlaybackControls(false);
	setStatus("Ready when you are", "ready");
});

speakButton.addEventListener("click", readAloud);

pauseButton.addEventListener("click", () => {
	if (!synthesis) return;
	if (synthesis.paused) {
		synthesis.resume();
		pauseButton.innerHTML = "<span aria-hidden=\"true\">Ⅱ</span>";
		pauseButton.title = "Pause";
		pauseButton.setAttribute("aria-label", "Pause");
		setStatus("Speaking your text", "speaking");
	} else if (synthesis.speaking) {
		synthesis.pause();
		pauseButton.innerHTML = "<span aria-hidden=\"true\">▶</span>";
		pauseButton.title = "Resume";
		pauseButton.setAttribute("aria-label", "Resume");
		setStatus("Playback paused", "paused");
	}
});

stopButton.addEventListener("click", () => {
	if (synthesis) synthesis.cancel();
	speakLabel.textContent = "Read aloud";
	updatePlaybackControls(false);
	setStatus("Playback stopped", "ready");
});

rateRange.addEventListener("input", () => {
	rateValue.value = `${Number(rateRange.value).toFixed(1)}×`;
});

pitchRange.addEventListener("input", () => {
	pitchValue.value = Number(pitchRange.value).toFixed(1);
});

if (synthesis) {
	loadVoices();
	synthesis.addEventListener("voiceschanged", loadVoices);
} else {
	loadVoices();
}
