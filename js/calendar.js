const endpoint = 'http://localhost:8080'
const DEBUG = true
const DateTime = luxon.DateTime
const key = 'marcos-22nd'

const makeAuthorizedGet = async (path, keyword) =>
  fetch(`${endpoint}/${path}`, {
    method: 'GET',
    headers: {
      authorization: keyword,
    },
  })

const verifyDate = (day) => {
  if (DEBUG) {
    return true
  }

  return DateTime.now() > DateTime.fromJSDate(new Date(`06/${day}/2023`))
}

const handlePuzzleSubmit = async (currentKeyword) => {
  const input = $('#modal-input')
  if (!input.val()) {
    input.toggleClass('shake')
    setTimeout(() => input.toggleClass('shake'), 500)
    return
  }

  const response = await fetch(`${endpoint}/puzzle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: currentKeyword,
    },
    body: JSON.stringify({ keyword: input.val() }),
  })

  if (response.status !== 200) {
    console.error('The wrong keyword was given')
  }

  console.log('Success!')
}

const getPuzzles = async () => {
  const currentKeyword = window.localStorage.getItem(key)

  const response = await makeAuthorizedGet('puzzleMetadata', currentKeyword)

  if (response.status !== 200) {
    console.error('Error occurred when fetching next puzzle metadata!')
    return
  }

  const items = await response.json()
  console.log(items)

  items.puzzleInfo.forEach(({ title, description, hint, redirect }, i) => {
    if (i === 0) {
      return
    }

    const elem = $(`#puzzle-${i}`)

    elem.on('click', () => {
      $('#modal-header').text(title)
      $('#modal-description').text(description)
      $('#start-puzzle').on('click', async () => {
        // if redirect, change window location
        if (redirect) {
          console.log(redirect)
          window.open(redirect, '_blank')
          return
        }

        makeAuthorizedGet('puzzle', currentKeyword)
      })

      
      if (i == items.puzzleInfo.length - 1) {
        $('#modal-submit').on('click', () => handlePuzzleSubmit(currentKeyword))
      } else {
        $('#modal-submit').removeClass('primary').addClass('btn-secondary disabled')
      }

      $('#modal-hint')
        .on('mouseenter', function () {
          var $this = $(this) // caching $(this)
          $this.data('defaultText', 'Hint')
          $this.text(hint)
        })
        .on('mouseleave', function () {
          var $this = $(this) // caching $(this)
          $this.text($this.data('defaultText'))
        })
      $('#modal-container').toggleClass('opened')
    })

    elem.toggleClass('clickable')
  })
}

const setup = async () => {
  if (!window.localStorage.getItem(key)) {
    window.localStorage.setItem(key, 'starter pack')
  }

  $('#modal-container').on('click', function (e) {
    if (e.target !== this) {
      return
    }

    $('#modal-container').toggleClass('opened')
  })

  // populate calendar with puzzle names
  const response = await fetch(`${endpoint}/puzzle?field=names`)
  if (response.status !== 200) {
    console.error('Error occurred when fetching puzzle names!')
  }

  const data = await response.json()
  data.forEach((name, i) => {
    if (i === 0) {
      return
    }

    $(`#puzzle-${i}`).text(`${i}. ${name}`)
  })
}

jQuery(async function () {
  setup()
  await getPuzzles()
})
