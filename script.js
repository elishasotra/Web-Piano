document.addEventListener("DOMContentLoaded", () => {

let sampler;
let started = false;

let sustain = false;
let transpose = 0;
let octaveShift = 0;

let MAX_POLY = 5;

let activeNotes = new Set();

const display = document.getElementById("display");

// ⚡ BEST STABLE LATENCY
Tone.context.latencyHint = "interactive";


// 🎵 START AUDIO
document.getElementById("startBtn").onclick = async ()=>{
  await Tone.start();

  display.innerText = "LOADING...";

  sampler = new Tone.Sampler({
    urls: {
      "A0":"A0.mp3","C1":"C1.mp3","D#1":"Ds1.mp3","F#1":"Fs1.mp3",
      "A1":"A1.mp3","C2":"C2.mp3","D#2":"Ds2.mp3","F#2":"Fs2.mp3",
      "A2":"A2.mp3","C3":"C3.mp3","D#3":"Ds3.mp3","F#3":"Fs3.mp3",
      "A3":"A3.mp3","C4":"C4.mp3","D#4":"Ds4.mp3","F#4":"Fs4.mp3",
      "A4":"A4.mp3","C5":"C5.mp3","D#5":"Ds5.mp3","F#5":"Fs5.mp3",
      "A5":"A5.mp3","C6":"C6.mp3","D#6":"Ds6.mp3","F#6":"Fs6.mp3",
      "A6":"A6.mp3","C7":"C7.mp3","D#7":"Ds7.mp3","F#7":"Fs7.mp3",
      "A7":"A7.mp3","C8":"C8.mp3"
    },
    baseUrl:"./samples/",
    release: 0.2
  }).toDestination();

  await Tone.loaded();

  sampler.volume.value = -5;

  started = true;
  display.innerText = "READY ⚡";
};


// 🎹 NOTES
const NOTES = [
"C2","C#2","D2","D#2","E2","F2","F#2","G2","G#2","A2","A#2","B2",
"C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3",
"C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
"C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5",
"C6","C#6","D6","D#6","E6","F6","F#6","G6","G#6","A6","A#6","B6",
"C7"
];


// 🎹 BUILD KEYS
function build(){
  const piano = document.getElementById("piano");
  piano.innerHTML = "";

  let whiteIndex = 0;

  NOTES.forEach(note=>{
    let key = document.createElement("div");

    if(note.includes("#")){
      key.className="black";
      key.style.left=(whiteIndex*40-12)+"px";
    }else{
      key.className="white";
      key.style.left=(whiteIndex*40)+"px";
      whiteIndex++;
    }

    key.dataset.note = note;

    key.onmousedown = ()=>noteOn(note, key);
    key.onmouseup = ()=>noteOff(note, key);
    key.onmouseleave = ()=>noteOff(note, key);

    piano.appendChild(key);
  });

  piano.style.width = (whiteIndex*40)+"px";
}

build();


// 🎵 NOTE ON (REAL-TIME)
function noteOn(note, el){
  if(!started) return;

  let final = Tone.Frequency(note)
    .transpose(transpose + octaveShift*12)
    .toNote();

  // 🔥 SMART POLY
  if(activeNotes.size >= MAX_POLY){
    let oldest = activeNotes.values().next().value;
    sampler.triggerRelease(oldest, "+0.02");
    activeNotes.delete(oldest);
  }

  sampler.triggerAttack(final);
  activeNotes.add(final);

  el.classList.add("active");

  updateDisplay(final);
  flash();

  el.style.opacity = "0.8";
  setTimeout(()=>el.style.opacity = "1", 80);
}


// 🎵 NOTE OFF
function noteOff(note, el){
  if(!started) return;

  let final = Tone.Frequency(note)
    .transpose(transpose + octaveShift*12)
    .toNote();

  el.classList.remove("active");

  if(!sustain){
    sampler.triggerRelease(final, "+0.02");
    activeNotes.delete(final);
  }
}


// 🎹 KEY MAPPING (WHITE + BLACK)
const keyMap = {
  "1":"C2","!":"C#2",
  "2":"D2","@":"D#2",
  "3":"E2",
  "4":"F2","$":"F#2",
  "5":"G2","%":"G#2",
  "6":"A2","^":"A#2",
  "7":"B2",

  "8":"C3","*":"C#3",
  "9":"D3","(":"D#3",
  "0":"E3",

  "q":"F3","Q":"F#3",
  "w":"G3","W":"G#3",
  "e":"A3","E":"A#3",
  "r":"B3",

  "t":"C4","T":"C#4",
  "y":"D4","Y":"D#4",
  "u":"E4",

  "i":"F4","I":"F#4",
  "o":"G4","O":"G#4",
  "p":"A4","P":"A#4",

  "a":"B4",
  "s":"C5","S":"C#5",
  "d":"D5","D":"D#5",
  "f":"E5",

  "g":"F5","G":"F#5",
  "h":"G5","H":"G#5",
  "j":"A5","J":"A#5",
  "k":"B5",

  "l":"C6","L":"C#6",
  "z":"D6","Z":"D#6",
  "x":"E6",

  "c":"F6","C":"F#6",
  "v":"G6","V":"G#6",
  "b":"A6","B":"A#6",
  "n":"B6",

  "m":"C7"
};


// 🎹 KEYBOARD EVENTS
document.addEventListener("keydown",e=>{
  if(e.repeat) return;

  let note = keyMap[e.key];
  if(!note) return;

  let el = [...document.querySelectorAll("[data-note]")]
    .find(k=>k.dataset.note===note);

  if(el) noteOn(note, el);
});

document.addEventListener("keyup",e=>{
  let note = keyMap[e.key];
  if(!note) return;

  let el = [...document.querySelectorAll("[data-note]")]
    .find(k=>k.dataset.note===note);

  if(el) noteOff(note, el);
});


// 🎛 CONTROLS (INSTANT)
document.getElementById("sustainBtn").onclick = ()=>{
  sustain = !sustain;

  if(!sustain){
    activeNotes.forEach(n => sampler.triggerRelease(n, "+0.02"));
    activeNotes.clear();
  }
};

document.getElementById("tUp").onclick = ()=>{
  transpose++;
};

document.getElementById("tDown").onclick = ()=>{
  transpose--;
};

document.getElementById("octUp").onclick = ()=>{
  octaveShift++;
};

document.getElementById("octDown").onclick = ()=>{
  octaveShift--;
};


// 💡 DISPLAY
function updateDisplay(note){
  display.innerText =
`${note}
OCT:${octaveShift} | TR:${transpose} | SUS:${sustain?"ON":"OFF"}`;
}


// 💡 LED
function flash(){
  let led = document.getElementById("led");
  led.style.opacity = 0.8;
  setTimeout(()=>led.style.opacity = 0.2,50);
}


// 🔤 MAPPING LABELS
let showMap = true;

document.getElementById("mappingBtn").onclick = ()=>{
  showMap = !showMap;

  document.querySelectorAll("[data-note]").forEach(k=>{
    k.innerText = showMap
      ? Object.keys(keyMap).find(key => keyMap[key] === k.dataset.note) || ""
      : "";
  });
};

});