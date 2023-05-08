const endpoint = `${ENDPOINT}/rsa`

const makeRequest = async () => {
  const requestParams = {
    type: 'GET',
    contentType: 'application/json',
  }
  
  const response = await $.ajax(endpoint, requestParams)
  $('#help-link').attr('href', response.link)
}

jQuery(async () => {
  await makeRequest()
})
