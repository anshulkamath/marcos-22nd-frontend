const endpoint = 'http://localhost:8080'
const DEBUG = true
const DateTime = luxon.DateTime
const key = 'marcos-22nd'

const puzzlePopulators = []
const puzzleData = [null]

const verifyDate = (day) => {
  if (DEBUG) {
    return true
  }

  return DateTime.now() > DateTime.fromJSDate(new Date(`06/${day}/2023`))
}

const handlePuzzleSubmit = async (currentKeyword) => {
  const input = $('#modal-input')
  const keywordGuess = input.val().toLowerCase()
  if (!keywordGuess) {
    input.toggleClass('shake')
    setTimeout(() => input.toggleClass('shake'), 500)
    return
  }

  const response = await fetch(`${endpoint}/puzzle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword: keywordGuess }),
  })

  const data = await response.json()

  const alertType = response.status === 200 ? 'alert-success' : 'alert-danger'
  if ($('#modal-alert').length) {
    $('#modal-alert').remove()
  }
  $('#modal-body').append(`<div id="modal-alert" role="alert" class="alert ${alertType}">${data.message}</div>`)

  if (response.status === 200) {
    setCookie(key, keywordGuess, 30)
    $('#modal-submit').removeClass('primary').addClass('btn-secondary disabled')
  }
}

const populateButtons = () => {
  const currentKeyword = getCookie(key)
  
  puzzleData.forEach((datum, i) => {
    if (i === 0) {
      return
    }

    const { title, description, redirect, hint } = datum

    const elem = $(`#puzzle-${i}`)

    elem.unbind('click').on('click', function () {
      $('#modal-header').text(title)
      $('#modal-description').text(description)
      $('#start-puzzle').unbind('click').on('click', async function () {
        // if redirect, change window location
        if (redirect) {
          window.location.href = redirect
          return
        }

        console.log(currentKeyword)
        const response = await fetch(`${endpoint}/puzzle?day=${i}`, currentKeyword)
        const blob = await response.blob()
        const _url = URL.createObjectURL(blob)
        window.open(_url, target='_blank')
      })

      if (i == puzzleData.length - 1) {
        $('#modal-submit').addClass('primary').removeClass('btn-secondary disabled')
        $('#modal-submit').on('click', () => handlePuzzleSubmit(currentKeyword))
      } else {
        $('#modal-submit').removeClass('primary').addClass('btn-secondary disabled')
      }

      $('#modal-hint')
        .on('mouseenter', function () {
          var $this = $(this) // caching $(this)
          $this.text(hint)
        })
        .on('mouseleave', function () {
          var $this = $(this) // caching $(this)
          $this.text('Hint')
        })

      $('#modal-container').toggleClass('opened')

      elem.attr('added', true)
    })

    elem.addClass('clickable')
  })
}

const getPuzzles = async () => {
  const response = await fetch(`${endpoint}/puzzleMetadata`)

  if (response.status !== 200) {
    console.error('Error occurred when fetching next puzzle metadata!')
    return
  }

  const items = await response.json()

  items.puzzleInfo.forEach(({ title, description, hint, redirect }, i) => {
    if (i === 0) {
      return
    }

    if (i < puzzleData.length) {
      return
    }

    puzzleData.push({ title, description, hint, redirect })
    populateButtons()
  })
}

const closeModal = () => {
  $('#modal-container').toggleClass('opened')
  getPuzzles()
  $('#modal-input').val('')
  $('#modal-alert').remove()
}

const setup = async () => {
  if (!getCookie(key)) {
    setCookie(key, 'starter pack', 30)
  }

  $(document).on('keypress', (e) => {
    if (e.key === "Escape" && $('#modal-container').hasClass('opened')) {
      closeModal()
    }
  })

  $('#modal-container').on('click', function (e) {
    if (e.target !== this) {
      return
    }

    closeModal()
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

  $('#marcos-bday-link').on('click', async () => {
    window.location.href = `${endpoint}/marcos-bday`
  })
}

jQuery(async function () {
  setup()
  await getPuzzles()
})
