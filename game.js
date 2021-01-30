const textBox = document.getElementById("text-box")
const kioskWindow = document.getElementById("kiosk-window")
const objects = JSON.parse(document.getElementById("objects").textContent)
const personas = JSON.parse(document.getElementById("personas").textContent)
const properties = document.getElementById("properties")
const propertyList = document.getElementById("property-list")
const inventory = JSON.parse(JSON.stringify(objects));


function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function showText(string, callback) {
  textBox.innerText = string
  function advanceText() {
    document.removeEventListener("click", advanceText)
    textBox.classList.remove("showing-text")
    textBox.innerText = ""
    callback()
  }
  textBox.classList.add("showing-text")
  document.addEventListener("click", advanceText)
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

function format(string, repl) {
  return string.replace(/<.*?>/g, repl)
}

function askAboutPropertyOf(object) {
  function askAboutProperty(event) {
    event.stopPropagation()
    event.preventDefault()
    var property = event.currentTarget.getAttribute("data-property")
    console.log(object)
    console.log(property)
    console.log(object[property])
  }
  return askAboutProperty
}

function letPlayerAskAboutProperty(object) {
  properties.classList.add("shown")
  for (var property in object) {
    if (["Object", "FlavourText"].indexOf(property) !== -1) { continue }
    var propertyLink = document.createElement("a")
    propertyLink.innerText = property
    propertyLink.setAttribute("href", "#")
    propertyLink.setAttribute("data-property", property)
    propertyLink.addEventListener("click", askAboutPropertyOf(object))
    var propertyListItem = document.createElement("li")
    propertyListItem.appendChild(propertyLink)
    propertyList.appendChild(propertyListItem)
  }
}

function havePersonaVisit() {
  const persona = pick(personas)
  const object = pick(objects)
  showTexts([
    format(pick(persona.Intro1), object.Object),
    format(pick(persona.Intro2), object.Object),
    format(pick(persona.Intro3), object.Object),
  ], function() { letPlayerAskAboutProperty(object) })
}

havePersonaVisit()
