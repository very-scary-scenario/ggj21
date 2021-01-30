const textBox = document.getElementById("text-box");
const kioskWindow = document.getElementById("kiosk-window");
const objects = JSON.parse(document.getElementById("objects").textContent);
const personas = JSON.parse(document.getElementById("personas").textContent);

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function showText(string, callback) {
  textBox.innerText = string;
  function advanceText() {
    document.removeEventListener("click", advanceText);
    textBox.classList.remove("showing-text");
    textBox.innerText = "";
    callback();
  }
  textBox.classList.add("showing-text")
  document.addEventListener("click", advanceText);
}

function showTexts(strings, callback) {
  function nextText() {
    if (strings.length > 0) {
      showText(strings.shift(), nextText)
    } else {
      callback()
    }
  }

  nextText()
}

function havePersonaVisit() {
  const persona = pick(personas)
  showTexts([pick(persona.Intro1), pick(persona.Intro2), pick(persona.Intro3)], function() { alert('not implemented :<') })
}

havePersonaVisit()
