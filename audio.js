const AudioContext = window.AudioContext || window.webkitAudioContext

const ctx = new AudioContext()
const loopNames = JSON.parse(document.getElementById("loops").textContent)
const loadedLoops = []

const CROSSFADE_DURATION = 2  // in seconds


function urlForLoop(name) {
  return '/audio/' + name
}

function playLoop() {
  loopToPlay = loadedLoops[Math.floor(Math.random() * loadedLoops.length)]
  console.log(loopToPlay)

  let source = ctx.createBufferSource()
  let fadeNode = ctx.createGain()

  source.buffer = loopToPlay

  source.connect(fadeNode)
  fadeNode.connect(ctx.destination)
  fadeNode.gain.setValueAtTime(0.01, 0)
  fadeNode.gain.exponentialRampToValueAtTime(1.0, ctx.currentTime + (CROSSFADE_DURATION))

  setTimeout(function() {
    playLoop()
    setTimeout(function() {
      fadeNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + CROSSFADE_DURATION)
      console.log('fading')
      setTimeout(function() { source.stop() }, CROSSFADE_DURATION * 1000)
    }, (CROSSFADE_DURATION * 2) * 1000)
  }, (loopToPlay.duration - (CROSSFADE_DURATION * 2)) * 1000)

  source.start()
}

function loadLoopIntoDeck(buffer) {
  loadedLoops.push(buffer)
  if (loadedLoops.length === loopNames.length) {
    playLoop()
  }
}

function decode(data) {
  ctx.decodeAudioData(data, loadLoopIntoDeck)
}

function getLoops() {
  for (var i = 0; i < loopNames.length; i++) {
    fetch(urlForLoop(loopNames[i])).then((resp) => resp.arrayBuffer()).then(decode)
  }
}

getLoops()
