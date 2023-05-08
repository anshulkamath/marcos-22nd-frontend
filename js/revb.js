const endpoint = `${ENDPOINT}/revb`

let round = 1
let score = 0
const DEBUG = 0
const DELTA_TAG_WAIT = 2000

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

const animateScore = (originalScore, delta) => {
  let current = originalScore
  $('#scoreboard-val').animate({ current: originalScore }, {
    duration: delta * 10,
    easing: 'swing',
    start: () => {
    },
    progress: function () {
      $(this).text(`Score: ${++current} +${delta}`)
    },
    complete: function () {
      const $this = $(this)
      $this.text(`Score: ${originalScore + delta} +${delta}`)
      setTimeout(() => {
        $this.text(`Score: ${score}`)
      }, DELTA_TAG_WAIT);
    }
  })
}

const closeModal = () => {
  resetGame()
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
    elem.val('')
  }, 500)
}

const getMemoizedGame = () => {
  let officialScore = 0
  let officialRound = 1

  const submitRound = (delta) => {
    if (officialScore !== score) {
      console.error('Error: Official score and actual score are not the same')
      return
    }

    if (officialRound !== round) {
      console.error('Error: Official round and actual round are not the same')
      return
    }
  
    officialScore += delta
    officialRound++

    score = officialScore
    round = officialRound

    return officialScore
  }

  const reset = () => {
    officialScore = 0
    officialRound = 1

    score = officialScore
    round = officialRound
  }

  return { submitRound, reset }
}

const { submitRound, reset } = getMemoizedGame()

const onSubmit = async () => {
  const textField = $('#guess-val')
  textField.trigger('blur')
  if (textField.val() === '') {
    animateIncorrect(textField)
    return
  }

  if (!RegExp(/^[0-9]{1,2}$|^100$/).test(textField.val())) {
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

  const delta = 100 - Math.abs(predictedScore - expectedScore)
  animateScore(score, delta)
  submitRound(delta)
  
  refreshColorBoxes()
  textField.val('')

  await sendResponse()

  if (round === 11) {
    showFailed()
    return
  }

  $('#scoreboard-round').text(`${round}/10`)
}

const sendResponse = async () => {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ score, round }),
    headers: {
      'Content-Type': 'application/json',
    }
  })

  if (response.status !== 200) {
    console.error('Unexpected error while trying to reach backend.')
    return
  }

  const { complete, keyword } = await response.json()
  if (complete) {
    showComplete(keyword)
    return
  }
}

const showComplete = (keyword) => {
  $('#modal-title').text('Congrats, you\'ve completed the game!').removeClass('floating-animation')
  $('#modal-text').html(`<h3 class="nunito floating-animation">Keyword: ${keyword}</h3>`)
  $('#modal-close').text('New Game')
  $('#modal-container').addClass('active')
  $('#modal-body').toggleClass('active')
}

const showFailed = () => {
  $('#modal-title').text('Game over :(').addClass('floating-animation')
  $('#modal-text').html(`<h3 class="nunito">Try again (and do better) to get the keyword</h3>`)
  $('#modal-close').text('Try again')
  $('#modal-container').addClass('active')
  $('#modal-body').toggleClass('active')
}

const resetGame = () => {
  reset()
  $('#scoreboard-round').text(`${round}/10`)
  $('#scoreboard-val').text(`Score: ${score}`)
}

jQuery(() => {
  $('#scoreboard-round').text(`${round}/10`)
  $('#scoreboard-val').text('Score: 0')
  refreshColorBoxes()
  if (!DEBUG)
    $('div[id^="modal"]').toggleClass('active')
  $('#modal-close').on('click', closeModal)
  $('#submit-button').on('click', onSubmit)
  $('#guess-val').on('keypress', function (e) {
    if (e.key !== 'Enter') {
      return
    }

    onSubmit()
  })
})
