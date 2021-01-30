const textBox = document.getElementById("text-box");
const kioskWindow = document.getElementById("kiosk-window");
const objects = JSON.parse(document.getElementById("objects").textContent);

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

showTexts(["henlo", "it me", "a customer"], function() {alert("we're done here")})
