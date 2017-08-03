const XML = "http://www.w3.org/2000/svg"
const data = {
  samples: [],
  min: NaN,
  max: NaN,
  percent: NaN,
}

// let's use blissful?
let $ = document.querySelector.bind(document)
let $$ = document.querySelectorAll.bind(document)


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
  var timeout
  return function() {
    var context = this, args = arguments
    var later = function() {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    var callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}

function svgNode(n, v) {
  n = document.createElementNS("http://www.w3.org/2000/svg", n)
  for (var p in v) n.setAttribute(p, v[p])
  return n
}

function colorizeThreshold(value, threshold) {
  let percentage = value / threshold * 100
  if ( percentage >= 100 ) {
    S = 100
    L = 50
  } else {
    S = 80
    L = 40
  }
  return 'hsl(' + value + ', ' + S + '%, ' + L + '%)'
}

let normalCDF = function(x, mean, variance) {
  return 1/2 * (1 + math.erf(
    (x - mean) / Math.sqrt(2 * variance)
  ))
}

let renderToleranceArea = function() {
  canvas = $('.toleranceArea')
  ctx = canvas.getContext('2d')
  let step = 1

  for (x = 0; x <= canvas.width; x = x + step) {
    let mean = x
    for (y = 0; y <= canvas.height; y = y + step) {
      let variance = Math.pow(y, 2)
      let value = 100 * (
        normalCDF(data.max, mean, variance) -
        normalCDF(data.min, mean, variance)
      )
      ctx.fillStyle = colorizeThreshold(value, data.percent)
      ctx.fillRect(x, y, step, step)
    }
  }
}


let renderSamples = function() {
  $('.samples').innerText = data.samples.join(', ')

  // sample statistics
  let count = data.samples.length
  $('.statistics__count').innerText = count
  let mean = (
    data.samples.reduce((acc, next) => acc + next, 0) / count
  )
  $('.statistics__mean').innerText = mean.toFixed(2)
  $('.statistics__variance').innerText = Math.pow(
    data.samples.reduce((acc, next) => acc + Math.pow(next - mean, 2), 0) / count,
    0.5,
  ).toFixed(2)
}


let sampleInputClick = function(event) {
  // <circle cx="100" cy="100" r="100"/>
  event.currentTarget.append(svgNode('circle', {
    cx: event.offsetX,
    cy: event.offsetY,
    r: 3,
  }))

  data.samples.push(event.offsetX)
  data.samples.sort()

  renderSamples()
}

let initToleranceInput = function() {
  let svg = $('.sampleInput')
  let min = svg.x.baseVal.value
  let max = min + svg.width.baseVal.value
  console.log('min: ' + min)
  console.log('max:', max)
  $$('.toleranceInput__slider').forEach(slider => {
    if (['min', 'max'].includes(slider.name)) {
      slider.setAttribute('min', min)
      slider.setAttribute('max', max)
    }
    inputToleranceInput({target:slider})
  })

  let rect = $('.sampleInput__tolerance')
  rect.setAttribute('y', svg.y.baseVal.value)
  rect.setAttribute('height', svg.height.baseVal.value)
}

let inputToleranceInput = function(event) {
  let slider = event.target

  data[slider.name] = Number(slider.value)
  slider
    .parentElement
    .querySelector('output')
    .innerText = slider.value

  renderToleranceRect()
}

let renderToleranceRect = function() {
  let rect = $('.sampleInput__tolerance')
  if (! isNaN(data.min)) {
    rect.setAttribute('x', data.min)
    if (! isNaN(data.max)) {
      rect.setAttribute('width', data.max - data.min)
    }
  }
  if (! isNaN(data.percent)) {
    rect.style.fillOpacity = data.percent / 100
  }
}



let init = function() {
  $$('canvas').forEach(canvas => {
    canvas.width = canvas.scrollWidth
    canvas.height = canvas.scrollHeight
  })

  document
    .querySelector('.sampleInput')
    .addEventListener('click', sampleInputClick)

  initToleranceInput()
  renderToleranceArea()
  document
    .querySelectorAll('.toleranceInput__slider')
    .forEach(slider => {
        slider.addEventListener('input', inputToleranceInput)
        slider.addEventListener('change', renderToleranceArea)
    })

}


if (document.readyState == "complete") {
  init()
}
else {
  window.addEventListener("load", init)
}
