const endpoint = ENDPOINT

let acrossClues
let downClues
let clueMap

let numRows
let numCols
let crossword

const getRow = (i) => parseInt(i / numRows)
const getCol = (i) => i % numCols
const getCoords = (i) => [getRow(i), getCol(i)]
const getCellId = (i) => `${getRow(i)}-${getCol(i)}`
const coordToId = ([row, col]) => `${row}-${col}`
const readId = (id) => id.match(/[0-9]+/g).map((x) => parseInt(x))
const readIndex = (element, attr_key) => {
  const data = element.attr(attr_key)
  if (!data) {
    return undefined
  }
  
  return parseInt(element.attr(attr_key).match(/[0-9]+/g)[0])
}

const LEFT_ARROW = 37
const UP_ARROW = 38
const RIGHT_ARROW = 39
const DOWN_ARROW = 40
const DELETE = 8
const SPACE = 32
const TAB = 9
const ENTER = 13

const A_KEY = 65
const Z_KEY = 90

const horizontalKeys = [LEFT_ARROW, RIGHT_ARROW]
const verticalKeys = [UP_ARROW, DOWN_ARROW]
const forwardKeys = [DOWN_ARROW, RIGHT_ARROW]
const backwardKeys = [LEFT_ARROW, UP_ARROW]

const DATA_KEY_HORIZONTAL = 'data-across-clue'
const DATA_KEY_VERTICAL = 'data-down-clue'

let MAX_ACROSS_KEY
let MAX_DOWN_KEY

let isHorizontal = true
let activeElements = []
let lastFocus = null

const shiftBackward = () => {
  const element = $(document.activeElement)
  const [row, col] = readId(element.attr('id'))
  
  const start = row * numCols + col
  const step = isHorizontal ? 1 : numCols 
  let idx = start - step
  const terminal = isHorizontal ? row * numCols : 0

  if (idx >= terminal && crossword.charAt(idx) === '-') {
    onTab({ shiftKey: true })
    return
  }
  
  if (idx >= terminal) {
    element.trigger('blur')
    $(`#input-${getCellId(idx)}`).trigger('focus')
  }
}

const shiftForward = (skipFilled = true) => {
  const element = $(document.activeElement)
  const [row, col] = readId(element.attr('id'))
  
  const start = row * numCols + col
  const step = isHorizontal ? 1 : numCols 
  let idx = start + step
  const terminal = isHorizontal ? (row + 1) * numCols : crossword.length
  const isFilled = (x) => (x.length > 0 && RegExp(/[a-z]/i).test(x))

  // if we are at the end of the row
  if ((idx == terminal) || (!isHorizontal && idx > numRows * numCols)) {
    onTab()
    return
  }

  while (idx < terminal && (skipFilled && isFilled($(`#input-${getCellId(idx)}`).val()))) {
    idx += step
  }

  // word has been completed
  if (crossword.charAt(idx) === '-') {
    onTab()
    return
  }
  
  if (idx < terminal) {
    element.trigger('blur')
    $(`#input-${getCellId(idx)}`).trigger('focus')
  }
}

const onFocus = () => {
  const element = $(document.activeElement)
  const [row, col] = readId(element.attr('id'))
  
  const start = row * numCols + col
  const forwardTerminal = isHorizontal ? (row + 1) * numCols : crossword.length
  const backwardsTerminal = isHorizontal ? row * numCols : 0
  const step = isHorizontal ? 1 : numCols

  let i = start
  // forward pass
  while (i < forwardTerminal && crossword.charAt(i) !== '-') {
    activeElements.push($(`#cell-${getCellId(i)}`))
    i += step
  }

  i = start - step
  while (i >= backwardsTerminal && crossword.charAt(i) !== '-') {
    activeElements.push($(`#cell-${getCellId(i)}`))
    i -= step
  }

  $.each(activeElements, function (i, elem) {
    elem.addClass('grid-item-highlighted')
  })

  // add focus look
  $('.grid-item-focused').removeClass('grid-item-focused')
  element.parent().removeClass('grid-item-highlighted').addClass('grid-item-focused')

  removeLinks()
  const linkId = readIndex(element,  isHorizontal ? DATA_KEY_HORIZONTAL : DATA_KEY_VERTICAL)
  const previewId = readIndex(element,  !isHorizontal ? DATA_KEY_HORIZONTAL : DATA_KEY_VERTICAL)
  focusClue(linkId)
  focusPreview(previewId)}

const onBlur = () => {
  activeElements = []
  $('div').removeClass('grid-item-highlighted grid-item-focused')
  removeLinks()
}

const refocus = () => {
  onBlur()
  onFocus()
}

const rotateInPlace = () => {
  if (
    (isHorizontal && !$(document.activeElement).attr(DATA_KEY_VERTICAL)) ||
    (!isHorizontal && !$(document.activeElement).attr(DATA_KEY_HORIZONTAL))
  ) {
    return
  }

  isHorizontal = !isHorizontal
  refocus()
}

const inputClickHandler = (e) => {
  if (e.target !== lastFocus) {
    lastFocus = e.target
    const dataKey = isHorizontal ? DATA_KEY_HORIZONTAL : DATA_KEY_VERTICAL
    if (!$(lastFocus).attr(dataKey)) {
      rotateInPlace()
    }
    return
  }

  rotateInPlace()
}

const populateCrossword = async () => {
  const crosswordResponse = await fetch(`${ENDPOINT}/crossword`)

  if (crosswordResponse.status !== 200) {
    alert('Unauthorized access error while trying to access puzzle. Tell Anshul.')
    return
  }

  const data = await crosswordResponse.json()
  clueMap = data.clueMap
  acrossClues = data.acrossClues
  downClues = data.downClues

  const { crosswordTemplate } = data
  crossword = crosswordTemplate.join('')
  numRows = crosswordTemplate.length
  numCols = crosswordTemplate[0].length

  MAX_ACROSS_KEY = acrossClues.length - 1
  MAX_DOWN_KEY = downClues.length - 1
  
  // fill crossword grid
  for (let i = 0; i < crossword.length; i++) {
    const id = getCellId(i)

    const clue = $(`<div id="cell-${id}" class="grid-item"><div id="clue-${id}" class="clue"></div><input id="input-${id}" class="grid-item noselect" minlength="1" maxlength="1" /></div>`)
    clue.appendTo('#crossword-container')
    
    const input = clue.children(`#input-${id}`)
    
    if (crossword.charAt(i) === '-') {
      clue.addClass('grid-item-disabled')
      input.attr('disabled', 'disabled')
    }
  }

  // label clue numbers
  for (let i = 0; i < clueMap.length; i++) {
    const [row, col] = clueMap[i]
    const id = `#clue-${row}-${col}`
    $(id).text(i + 1)
  }

  for (let i = 0; i < acrossClues.length; i++) {
    const [val, clue] = acrossClues[i]
    $(`<div id="across-link-${i}" class="clue-link">${val}. ${clue}</div>`).appendTo('#across-list')
  }

  for (let i = 0; i < downClues.length; i++) {
    const [val, clue] = downClues[i]
    $(`<div id="down-link-${i}" class="clue-link">${val}. ${clue}</div>`).appendTo('#down-list')
  }

  addDataAttributes()
  onResize()
}

const onTab = (e) => {
  let isShifted = 1
  if (e) {
    isShifted = e.shiftKey ? -1 : 1
  }

  let dataKey = isHorizontal ? DATA_KEY_HORIZONTAL : DATA_KEY_VERTICAL
  let curr = parseInt($(document.activeElement).attr(dataKey))
  let element = $(`input[${dataKey}-start=${curr + isShifted}]`)

  if (element.length === 0) {
    isHorizontal = !isHorizontal
    dataKey = isHorizontal ? DATA_KEY_HORIZONTAL : DATA_KEY_VERTICAL
    let newStart = 0
    if (e && e.shiftKey && isHorizontal) {
      newStart = MAX_ACROSS_KEY
    } else if (e && e.shiftKey && !isHorizontal) {
      newStart = MAX_DOWN_KEY
    }
  
    element = $(`input[${dataKey}-start=${newStart}]`)
  }

  // tabs should go to next fillable letter
  const inputs = $(`input[${dataKey}=${element.attr(dataKey)}]`)
  $(inputs).each(function (i, e) {
    if (element.val() === '') {
      return
    }

    element = $(e)
  })

  $(document.activeElement).trigger('blur')
  element.trigger('focus')
}

const onKeydown = (e) => {
  e.preventDefault()

  if (
    (!isHorizontal && horizontalKeys.includes(e.keyCode)) ||
    (isHorizontal && verticalKeys.includes(e.keyCode))
  ) {
    rotateInPlace()
    return
  }

  if (backwardKeys.includes(e.keyCode)) {
    shiftBackward()
    return
  } else if (forwardKeys.includes(e.keyCode)) {
    shiftForward(skipFilled = false)
    return
  }

  if (A_KEY <= e.keyCode && e.keyCode <= Z_KEY) {
    $(document.activeElement).val(e.key.toUpperCase())
    shiftForward()
    return
  }

  switch (e.keyCode) {
    case DELETE:
      const val = $(document.activeElement).val()
      if (!val) {
        shiftBackward()
      }
      $(document.activeElement).val('')
      break
    case SPACE:
      shiftForward()
      break
    case ENTER:
    case TAB:
      onTab(e)
      break
    default:
      break
  }
}

const addDataAttributes = () => {
  const populateBreadcrumbs = (start, step, terminal, attr_key, attr_val) => {
    $(`#input-${getCellId(start)}`).attr(`${attr_key}-start`, attr_val)
    
    let i = start
    while (i < terminal && !$(`#input-${getCellId(i)}`).attr('disabled')) {
      $(`#input-${getCellId(i)}`).attr(attr_key, attr_val)
      
      i += step
    }
  }

  acrossClues.forEach(([_, __, clueIdx], i) => {
    const [row, col] = clueMap[clueIdx]
    const start = row * numCols + col
    const step = 1
    const terminal = (row + 1) * numCols
    const attr_key = DATA_KEY_HORIZONTAL
    populateBreadcrumbs(start, step, terminal, attr_key, i)

    $(`#across-link-${i}`).on('click', () => {
      isHorizontal = true
      $(`#input-${row}-${col}`).trigger('focus')
    })
  })

  downClues.forEach(([_, __, clueIdx], i) => {
    const [row, col] = clueMap[clueIdx]
    const start = row * numCols + col
    const step = numCols
    const terminal = numCols * numRows
    const attr_key = DATA_KEY_VERTICAL
    populateBreadcrumbs(start, step, terminal, attr_key, i)

    $(`#down-link-${i}`).on('click', () => {
      isHorizontal = false
      $(`#input-${row}-${col}`).trigger('focus')
    })
  })
}

const checkPuzzleCorrect = async () => {
  let submit = true
  let puzzleSolution = ''
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      const input = $(`#input-${getCellId(i * numCols + j)}`)
      if (input.attr('disabled')) {
        puzzleSolution += '-'
        continue
      }
      
      if (input.val() === '') {
        submit = false
      }

      puzzleSolution += input.val()
    }
  }

  if (submit) {
    console.log('submitting')
    const response = await fetch(`${ENDPOINT}/crossword`, { 
      method: 'POST',
      body: JSON.stringify({ solution: puzzleSolution }),
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (response.status !== 200) {
      return
    }

    const { correct: solution } = await response.json()

    solution.forEach((hint) => {
      $(`#cell-${coordToId(hint)}`).removeClass('grid-item-highlighted grid-item-focused').addClass('grid-item-solution')
    })

    finishPuzzle()
  }

  return false
}

const finishPuzzle = () => {
  $(document).off('focusin')
  $(document).off('blur')
  $(document).off('click')
  $(document).off('keydown')
  $(document).off('keyup')
}

const onKeypress = async (e) => {
  checkPuzzleCorrect()
}

const removeLinks = () => {
  $('div[id*="link"]').each(function (i, e) {
    $(this).removeClass('clue-link-highlighted clue-link-highlighted-preview')
  })
}

const focusClue = (i) => {
  const direction = isHorizontal ? 'across' : 'down'
  $(`#${direction}-link-${i}`).addClass('clue-link-highlighted')
  scrollToDiv(`${direction}-link-${i}`)
}

const focusPreview = (i) => {
  if (i === undefined) {
    return
  }

  const direction = !isHorizontal ? 'across' : 'down'
  $(`#${direction}-link-${i}`).addClass('clue-link-highlighted-preview')
  scrollToDiv(`${direction}-link-${i}`)
}

const scrollToDiv = (targetDiv) => {
  const elem = document.getElementById(targetDiv)
  if (!elem) {
    return
  }

  elem.scrollIntoView({ block: "start", behavior: "smooth" })
}

const onResize = () => {
  $('#clues').outerHeight($('#crossword-container').outerHeight())
}

jQuery(async () => {
  $(document).on('focusin', 'input', onFocus)
  $(document).on('blur', 'input', onBlur)
  $(document).on('click', 'input', inputClickHandler)
  $(document).on('keydown', 'input', onKeydown)
  $(document).on('keyup', 'input', onKeypress)
  $(window).on('resize', onResize)
  await populateCrossword()
})
