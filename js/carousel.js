let carouselIndex = 0
let carouselImages = []

const getCarouselImage = (index) => $( `img[src="${carouselImages[index]}"]` )
const checkRight = () => carouselIndex < carouselImages.length - 1
const checkLeft = () => carouselIndex > 0

function shiftRight() {
  if (!checkRight()) {
    return
  }

  const oldLeftImage = checkLeft() ? getCarouselImage(carouselIndex - 1) : null
  const oldFocusImage = getCarouselImage(carouselIndex)
  const oldRightImage = getCarouselImage(carouselIndex + 1)

  oldLeftImage?.toggleClass('carousel-left-hover')
  oldFocusImage.toggleClass('carousel-focus carousel-left-hover')
  oldRightImage.toggleClass('carousel-focus carousel-right-hover')

  oldRightImage.off('click')
  oldLeftImage?.off('click')
  oldFocusImage.on('click', shiftLeft)

  carouselIndex += 1
  console.log(`increased index from ${carouselIndex - 1} to ${carouselIndex}`)

  const newRightImage = checkRight() ? getCarouselImage(carouselIndex + 1) : null
  newRightImage?.toggleClass('carousel-right-hover')
  newRightImage?.on('click', shiftRight)
}

function shiftLeft() {
  if (!checkLeft()) {
    return
  }

  const oldLeftImage = getCarouselImage(carouselIndex - 1)
  const oldFocusImage = getCarouselImage(carouselIndex)
  const oldRightImage = checkRight() ? getCarouselImage(carouselIndex + 1) : null

  oldLeftImage.toggleClass('carousel-focus carousel-left-hover')
  oldFocusImage.toggleClass('carousel-focus carousel-right-hover')
  oldRightImage?.toggleClass('carousel-right-hover')

  oldRightImage?.off('click')
  oldLeftImage.off('click')
  oldFocusImage.on('click', shiftRight)

  carouselIndex -= 1
  console.log(`decreased index from ${carouselIndex + 1} to ${carouselIndex}`)

  const newLeftImage = checkLeft() ? getCarouselImage(carouselIndex - 1) : null
  newLeftImage?.toggleClass('carousel-left-hover')
  newLeftImage?.on('click', shiftLeft)
}

function prepareCarousel() {
  carouselImages = $('#marcos-carousel').children().map((_, elem) => elem.getAttribute("src"))

  // add z index to current carousel image
  getCarouselImage(carouselIndex).addClass('carousel-focus')
  getCarouselImage(carouselIndex + 1).on('click', shiftRight)
  getCarouselImage(carouselIndex - 1).on('click', shiftLeft)
}

function carouselEnterExit() {
  if (checkRight()) {
    getCarouselImage(carouselIndex + 1).toggleClass('carousel-right-hover')
  }

  if (checkLeft()) {
    getCarouselImage(carouselIndex - 1).toggleClass('carousel-left-hover')
  }
}

jQuery(() => {
  prepareCarousel();
  $('.carousel-image').on('mouseenter mouseleave', carouselEnterExit)
})
