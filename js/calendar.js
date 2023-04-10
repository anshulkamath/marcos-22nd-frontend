const endpoint = 'http://localhost:8080'
const DEBUG = true
const DateTime = luxon.DateTime
const key = 'marcos-22nd'

const verifyDate = (day) => {
  if (DEBUG) {
    return true
  }

  return DateTime.now() > DateTime.fromJSDate(new Date(`06/${day}/2023`))
}

const getPuzzles = async () => {
  const currentProgress = window.localStorage.getItem(key)

  const requestParams = {
    method: 'GET',
    headers: {
      authorization: currentProgress
    }
  }

  const response = await fetch(`${endpoint}/nextPuzzleMetadata`, requestParams)

  if (response.status !== 200) {
    console.error('Error occurred when fetching next puzzle metadata!')
    return
  }

  const items = await response.json()
  
  items.puzzles.forEach((item, i) => {
    const elem = $(`#puzzle-${i + 1}`)
    console.log(item, elem)

    // handle redirects
    if (item.redirect) {
      elem.attr('href', item.redirect)
      elem.attr('target', '_blank')
      return
    }

    // handle downloading files
    elem.on('click', () => fetch(`${endpoint}/puzzle`, {
      method: 'GET',
      headers: {
        authorization: item,
      }
    }))
    
    elem.toggleClass('clickable')
  })
}

const setup = () => {
  if (!window.localStorage.getItem(key)) {
    window.localStorage.setItem(key, 'starter pack')
  }
}

jQuery(async () => {
  setup()
  await getPuzzles()
})
