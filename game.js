const textBox = document.getElementById("text-box")
const kioskWindow = document.getElementById("kiosk-window")
const visitor = document.getElementById("visitor")
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
  return string.replace(/<(.*?)>/g, repl)
}

function askPersonaAbout(persona, object, property, callback) {
  value = object[property]
  var lookup = property
  if (typeof(value) === "boolean") {
    if (value) {
      lookup = property + "Positive"
    } else {
      lookup = property + "Negative"
    }
  }

  function formatReplacementInResponse(match, name) {
    if (name === "object") {
      return object.Object
    } else {
      return object[lookup]
    }
  }
  showText(format(pick(persona[lookup]), formatReplacementInResponse), callback)
}

function askAboutPropertyOf(persona, object, callback) {
  function askAboutProperty(event) {
    event.stopPropagation()
    event.preventDefault()
    var property = event.currentTarget.getAttribute("data-property")
    askPersonaAbout(persona, object, property, callback)
  }
  return askAboutProperty
}

function letPlayerAskAboutProperty(persona, object) {
  properties.classList.add("shown")

  function bail() {  // this needs to be named better once we cement what's gonna happen next
    properties.classList.remove("shown")
    alert("henlo")
  }

  for (var property in object) {
    if (["Object", "FlavourText"].indexOf(property) !== -1) { continue }
    var propertyLink = document.createElement("a")
    propertyLink.innerText = property
    propertyLink.setAttribute("href", "#")
    propertyLink.setAttribute("data-property", property)
    propertyLink.addEventListener("click", askAboutPropertyOf(persona, object, bail))
    var propertyListItem = document.createElement("li")
    propertyListItem.appendChild(propertyLink)
    propertyList.appendChild(propertyListItem)
  }
}

function havePersonaVisit() {
  const persona = pick(personas)
  visitor.setAttribute("data-persona", persona._name)
  visitor.setAttribute("src", persona._art_url)
  const object = pick(objects)
  showTexts([
    format(pick(persona.Intro1), object.Object),
    format(pick(persona.Intro2), object.Object),
    format(pick(persona.Intro3), object.Object),
  ], function() { letPlayerAskAboutProperty(persona, object) })
}

havePersonaVisit()
