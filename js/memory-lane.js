const endpointRoot = 'http://localhost:8080'
const endpoint = `${endpointRoot}/memory-lane/api`
let playlistId = '0v0OpK2jpvsOv1EKjcq6lv'
const gracePeriod = 750

const seenIds = new Set()

let score = 0
let level = 1
let audioPlayer = null
const dateFields = ['#month-input', '#day-input', '#year-input']
const gameFields = [...dateFields, '#name-input']
const levelDurations = { 1: 1000, 2: 5000, 3: 15000 }
let previewUrl = ''
let songId = ''
let round = 1

const updateScore = (delta) => {
  score += delta
  $('#scoreboard').html(`<h1 class="nunito">Score: ${score}</h1>`)
}

const checkFilled = () => {
  let formFilled = true
  $.each([...dateFields, '#name-input'], (i, e) => {
    const currVal = $(e).val()

    if (currVal === '') {
      formFilled = false
      $(e).toggleClass('shake')
      setTimeout(() => {
        $(e).toggleClass('shake')
      }, 500)
      return
    }
  })

  return formFilled
}

const validateDate = async () => {
  let date = ''
  let validSubmission = true

  $('#date-form > input').each(function () {
    const currVal = $(this).val()

    if (currVal === '' || isNaN(currVal)) {
      validSubmission = false
      $(this).toggleClass('shake')
      setTimeout(() => {
        $(this).toggleClass('shake')
      }, 500)
      return
    }
    date += `${currVal}/`
  })

  if (!validSubmission) {
    return ''
  }

  const dateRegex =
    /^([1-9]|0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01]|[0-9])\/(20[0-9][0-3]|[0-9][0-3])$/
  date = date.substring(0, date.length - 1)
  if (!date.match(dateRegex)) {
    $('#date-form > input').toggleClass('shake')
    setTimeout(() => {
      $('#date-form > input').toggleClass('shake')
    }, 500)
    return ''
  }

  return new Date(date).toISOString()
}

const submit = async () => {
  audioPlayer.pause()

  const filled = checkFilled()
  if (!filled) {
    console.log('Form not adequately filled')
    return
  }

  const date = validateDate()
  if (!date) {
    console.error('Date not formatted properly')
    return
  }

  const name = $('#name-input').val()

  const requestParams = {
    method: 'POST',
    headers: {
      "Content-Type": 'application/json',
    },
    body: JSON.stringify({
      name,
      date,
      id: songId,
      level,
      round,
    }),
  }

  const fetchResponse = await fetch(endpoint, requestParams)
  console.log(fetchResponse)
  const response = await fetchResponse.json()
  
  if (_.has(response, 'terminated')) {
    const keyword = _.get(response, 'terminated.keyword')
    const resourceName = _.get(response, 'resourceName')
    setCookie('marcos-22nd', keyword, 30)
    window.location.href = resourceName
    return
  }
  
  const correctDate = new Date(response.correctDate)
  const expected = [
    correctDate.getMonth(),
    correctDate.getDate(),
    correctDate.getFullYear(),
    response.nameAccepted,
  ]
  $.each(gameFields, (i, e) => {
    if (e === '#name-input') {
      $(e).val(response.correctName)
      if (!response.nameAccepted) {
        $(e).addClass('wrong-answer')
      }
      return
    }

    if ($(e).val() != expected[i]) {
      $(e).val(expected[i]).addClass('wrong-answer')
    }
  })

  setTimeout(async () => {
    // clear all fields
    $.each(gameFields, (i, e) => {
      $(e).val('').removeClass('wrong-answer')
    })

    updateScore(response.score)
    await getSong()
    round++

    level = 1
    $('#more-time').removeClass('off')

    waitAndPlay(levelDurations[level])
  }, 1500)
}

const addLevel = () => {
  level += 1

  waitAndPlay(levelDurations[level])
}

const getSong = async (num_retries = 5) => {
  const requestParams = {
    type: 'GET',
    data: {
      playlistId,
    },
  }
  const response = await $.ajax(endpoint, requestParams)

  songId = response.id
  previewUrl = response.preview_url

  // if we have already seen the song, then regenerate another song
  if (seenIds.has(songId) && num_retries > 0) {
    await getSong(num_retries - 1)
    return
  }

  seenIds.add(songId)

  audioPlayer = new Audio(previewUrl)
}

const toggleButtons = () => {
  $.each(['#more-time', '#guess'], (i, e) => {
    $(e).toggleClass('off')
  })
}

const waitAndPlay = (duration) => {
  setTimeout(() => {
    playSong(duration)
  }, gracePeriod)
}

const playSong = (milliseconds) => {
  toggleButtons()
  audioPlayer.play()
  setTimeout(() => {
    audioPlayer.pause()
    toggleButtons()
    if (level == 3) {
      $('#more-time').addClass('off')
    }
  }, milliseconds)
}

const closeModal = async () => {
  $('#modal-container').toggleClass('active')
  $('#modal-body').toggleClass('active')

  const newPlaylist = $('#playlist-input').val()
  if (newPlaylist) {
    playlistId = newPlaylist
    await getSong()
  }

  waitAndPlay(1000)
}

const prepareGame = async () => {
  // sets score to 0
  updateScore(0)

  // turn off media keyboard buttons
  navigator.mediaSession.setActionHandler('play', () => {})
  navigator.mediaSession.setActionHandler('pause', () => {})
  navigator.mediaSession.setActionHandler('seekbackward', () => {})
  navigator.mediaSession.setActionHandler('seekforward', () => {})
  navigator.mediaSession.setActionHandler('previoustrack', () => {})
  navigator.mediaSession.setActionHandler('nexttrack', () => {})

  // sets auto-resizing on for textarea
  $('textarea')
    .each(function () {
      this.setAttribute('style', 'height:' + this.scrollHeight + 'px; overflow-y:hidden;')
    })
    .on('input', function () {
      this.style.height = 0
      this.style.height = this.scrollHeight + 'px'
    })

  // attaches submit action to guess button
  $('#guess').on('click', submit)

  $('#more-time').on('click', addLevel)
  await getSong()
}

jQuery(async () => {
  $('div[id^="modal"]').toggleClass('active')
  $('#modal-close').on('click', closeModal)
  await prepareGame()
})
