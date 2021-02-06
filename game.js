const textBox = document.getElementById("text-box")
const kioskWindow = document.getElementById("kiosk-window")
const visitor = document.getElementById("visitor")
const objects = JSON.parse(document.getElementById("objects").textContent)
const queriableObjectProperties = JSON.parse(document.getElementById("queriable-object-properties").textContent)
const personas = JSON.parse(document.getElementById("personas").textContent)
const properties = document.getElementById("properties")
const propertyList = document.getElementById("property-list")
const inventory = JSON.parse(JSON.stringify(objects))
const backRoom = document.getElementById("back-room")
const shelves = document.getElementById("shelves")
const backRoomEntrance = document.getElementById("back-room-entrance")
const backRoomExit = document.getElementById("back-room-exit")

const filterExp = /(?<leadingContent>[^<>]*)(?<tag><(?<name>[^>|]+)\|?(?<filter>[^>|]+)?>)?/g

// these text things are globals so that you can, at any time, hand in a new
// set of texts to override everything and not heck everything up

let textQueue = []
let textOverCallback = () => {}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function advanceText(event) {
  if (backRoom.classList.contains('shown') || properties.classList.contains('shown')) {
    return  // a modal is open and we should not advance text in the background
  }

  textBox.classList.remove("showing-text")
  textBox.innerHTML = ""
  nextText()
}

function showText(text, callback) {
  textBox.innerHTML = ""
  textBox.appendChild(text)
  textBox.classList.add("showing-text")
}

function nextText() {
  if (textQueue.length > 0) {
    showText(textQueue.shift(), nextText)
  } else {
    textOverCallback()
    textOverCallback = () => {}
  }
}

function showTexts(texts, callback) {
  textQueue = texts  
  textOverCallback = callback
  nextText()
}

const filters = {
  lower: (input) => input.toLowerCase(),
  upper: (input) => input.toUpperCase(),
  sentence: (input) => input.slice(0, 1).toUpperCase() + input.slice(1),
}

function format(string, repl) {
  // take a string and format <blocks> within it, and return a paragraph
  // element in which each of those blocks is wrapped in a <span> element

  const p = document.createElement('p')

  for (const match of string.matchAll(filterExp)) {
    if (match.groups.leadingContent) {
      p.appendChild(document.createTextNode(match.groups.leadingContent))
    }
    if (match.groups.name) {
      let replacement = repl(name)
      if (match.groups.filter) {
        if (filters[match.groups.filter]) {
          replacement = filters[match.groups.filter](replacement)
        } else {
          throw "no filter exists for " + match.groups.filter
        }
      }
      const span = document.createElement('span')
      span.innerText = replacement
      p.appendChild(span)
    }
  }

  return p
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

  function formatReplacementInResponse(name) {
    if (name === "object") {
      return object.Object
    } else {
      return object[lookup]
    }
  }
  showTexts([format(pick(persona[lookup]), formatReplacementInResponse)], callback)
}

function askAboutPropertyOf(persona, object, callback) {
  function askAboutProperty(event) {
    event.stopPropagation()
    event.preventDefault()
    var property = event.currentTarget.getAttribute("data-property")
    hidePropertiesOptions()
    askPersonaAbout(persona, object, property, callback)
  }
  return askAboutProperty
}

function showPropertiesOptions() {
  properties.classList.add("shown")
}

function hidePropertiesOptions() {
  properties.classList.remove("shown")
}

function letPlayerAskAboutProperty(persona, object) {
  propertyList.innerHTML = ""

  function tryAgain() {
    letPlayerAskAboutProperty(persona, object)
  }

  for (var property in object) {
    if (queriableObjectProperties.indexOf(property) === -1) { continue }
    var propertyLink = document.createElement("a")
    propertyLink.innerText = property
    propertyLink.setAttribute("href", "#")
    propertyLink.setAttribute("data-property", property)
    propertyLink.addEventListener("click", askAboutPropertyOf(persona, object, tryAgain))
    var propertyListItem = document.createElement("li")
    propertyListItem.appendChild(propertyLink)
    propertyList.appendChild(propertyListItem)
  }

  showPropertiesOptions()
}

function havePersonaVisit() {
  const persona = pick(personas)
  visitor.setAttribute("data-persona", persona._name)
  visitor.setAttribute("src", persona._art_url)
  const object = pick(inventory)  // there's no sense having someone show up with an object you don't have
  showTexts([
    format(pick(persona.Intro1), () => object.Object),
    format(pick(persona.Intro2), () => object.Object),
    format(pick(persona.Intro3), () => object.Object),
  ], () => { letPlayerAskAboutProperty(persona, object) })
}

function giveObjectToVisitor(event) {
  event.stopPropagation()
  event.preventDefault()
  alert('henlo')  // remove object from inventory and put the visitor into their success/failure routine
}
ruleObjectOut = giveObjectToVisitor

function createShelfFor(object) {
  const shelf = document.createElement("li")
  const giveObject = document.createElement("a")
  giveObject.setAttribute('href', '#')
  giveObject.addEventListener('click', giveObjectToVisitor)
  giveObject.innerText = 'hand to customer'
  const ruleOut = document.createElement("a")
  ruleOut.innerText = 'rule out'
  ruleOut.setAttribute('href', '#')
  ruleOut.addEventListener('click', ruleObjectOut)
  shelf.appendChild(ruleOut)
  shelf.appendChild(document.createTextNode(" - "))
  shelf.appendChild(giveObject)
  shelf.appendChild(document.createTextNode(" - "))
  shelf.appendChild(document.createTextNode(object.Object))
  return shelf
}

function showBackRoom(event) {
  event.stopPropagation()
  event.preventDefault()
  shelves.innerHTML = ""
  backRoomEntrance.blur()
  for (var i = 0; i < inventory.length; i++) {
    shelves.appendChild(createShelfFor(inventory[i]))
  }
  backRoom.classList.add('shown')
}

function hideBackRoom(event) {
    event.stopPropagation()
    event.preventDefault()
  backRoom.classList.remove('shown')
}

document.addEventListener('DOMContentLoaded', (event) => {
  setTimeout(() => {
    havePersonaVisit()
    backRoomEntrance.addEventListener('click', showBackRoom)
    backRoomExit.addEventListener('click', hideBackRoom)
    document.addEventListener("click", advanceText)
  }, 5)  // wait a second so that the introductory swooce can happen
})
