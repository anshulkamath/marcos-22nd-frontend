let score = 0
const DEBUG = 0


const generateRandomEightBitInteger = () => Math.floor(Math.random() * 255)
const generateRandomColor = () => Array(3).fill(0).map(generateRandomEightBitInteger)
const convertColorToString = (r, g, b) => `rgb(${r}, ${g}, ${b})`
const generateRandomRGBColor = () => convertColorToString(...generateRandomColor())
const convertRGBStringToArray = (cString) => {
  const matchRGB = /rgb\(([0-9]{0,3}),\s?([0-9]{0,3}),\s?([0-9]{0,3})\)/
  const matches = cString.match(matchRGB)
  
  if (!matches) {
    console.error(`Invalid RGB string given: ${cString}`)
    return null
  }

  const arr = matches.slice(1, 4).map((str) => parseInt(str))
  if (!arr.every((x) => (x >= 0 && x <= 255))) {
    console.error(`The given rgb string has an out-of-bounds value: ${cString}`)
    return null
  }

  return arr
}

const updateScore = (delta) => {
  score += delta
  $('#scoreboard').html(`<h1 class="nunito floating-animation">Score: ${score}</h1>`)
}

const closeModal = () => {
  $('#modal-container').toggleClass('active')
  $('#modal-body').toggleClass('active')
}

const refreshColorBoxes = () => {
  const colors = [generateRandomRGBColor(), generateRandomRGBColor()]
  while (calculateRugbScore(...colors) === 0) {
    colors[1] = generateRandomRGBColor()
  }

  $('.color-box').each(function (i) {
    $(this).css('background-color', colors[i])
  })
}

const labArrayToObject = (L, A, B) => ({ L, A, B })
const rgbStringToLab = (cString) => labArrayToObject(...rgb.lab(convertRGBStringToArray(cString)))
const getDeltaE = (lab1, lab2) => (new dE00(lab1, lab2)).getDeltaE()

/**
 * Calculates the weird ass score that Marcos devised
 * @param {*} cString1 The first color hex string
 * @param {*} cString2 The second color hex string
 */
const calculateRugbScore = (cString1, cString2) => {
  const color1 = rgbStringToLab(cString1)
  const color2 = rgbStringToLab(cString2)

  const deltaE = getDeltaE(color1, color2)
  
  return Math.round(Math.max(100 - Math.pow(deltaE / 1.9, 1.6), 0))
}

const animateIncorrect = (elem) => {
  elem.toggleClass('shake')
  setTimeout(() => {
    elem.toggleClass('shake')
  }, 500)
}

const onSubmit = () => {
  const textField = $('#guess-val')
  if (textField.val() === '') {
    animateIncorrect(textField)
    return
  }

  const predictedScore = parseInt(textField.val())

  if (predictedScore < 0 || predictedScore > 100) {
    animateIncorrect(textField)
    return;
  }

  const expectedScore = calculateRugbScore(
    $('#left-color-box').css('background-color'),
    $('#right-color-box').css('background-color')
  )

  updateScore(100 - Math.abs(predictedScore - expectedScore))
  textField.val('')

  refreshColorBoxes()
}

jQuery(() => {
  updateScore(0)
  refreshColorBoxes()
  if (!DEBUG)
    $('div[id^="modal"]').toggleClass('active')
  $('#modal-close').on('click', closeModal)
  $('#submit-button').on('click', onSubmit)
})
