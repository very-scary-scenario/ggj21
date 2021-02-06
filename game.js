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

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function showText(string, callback) {
  textBox.innerText = string
  function advanceText(event) {
    if (backRoom.classList.contains('shown') || properties.classList.contains('shown')) {
      return  // a modal is open and we should not advance text in the background
    }

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

const filters = {
  lower: (input) => input.toLowerCase(),
  upper: (input) => input.toUpperCase(),
  sentence: (input) => input.slice(0, 1).toUpperCase() + input.slice(1),
}

function format(string, repl) {
  const filterExp = /<([^>|]*)\|?([^>|]*)?>/g
  return string.replace(filterExp, (match, name, filter) => {
    let replacement = repl(name)
    if (filter) {
      if (filters[filter]) {
        replacement = filters[filter](replacement)
      } else {
        throw "no filter exists for " + filter
      }
    }
    return replacement
  })
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
  showText(format(pick(persona[lookup]), formatReplacementInResponse), callback)
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

  for (var property in object) {
    if (queriableObjectProperties.indexOf(property) === -1) { continue }
    var propertyLink = document.createElement("a")
    propertyLink.innerText = property
    propertyLink.setAttribute("href", "#")
    propertyLink.setAttribute("data-property", property)
    propertyLink.addEventListener("click", askAboutPropertyOf(persona, object, letPlayerAskAboutProperty))
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

function createShelfFor(object) {
  var shelf = document.createElement("li")
  shelf.innerText = object.Object
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
  }, 5)  // wait a second so that the introductory swooce can happen
})
