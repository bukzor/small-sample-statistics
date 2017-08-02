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


let renderSamples = function() {
  $('.samples').innerText = data.samples.join(', ')
}


let renderStatistics = function() {
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


let render = function() {
  renderSamples()
  renderStatistics()
}


let sampleInputClick = function(event) {
  // <circle cx="100" cy="100" r="100"/>
  let point = document.createElementNS(XML, 'circle')
  point.setAttribute('cx', event.offsetX)
  point.setAttribute('cy', event.offsetY)
  point.setAttribute('r', 3)
  event.currentTarget.append(point)

  data.samples.push(event.offsetX)
  data.samples.sort()

  render()
}

let initToleranceInput = function() {
  let svg = $('svg')
  let min = svg.x.baseVal.value
  let max = min + svg.width.baseVal.value
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

  data[slider.name] = Number(slider.value);
  slider
    .parentElement
    .querySelector('output')
    .innerText = slider.value

  let rect = $('.sampleInput__tolerance')
  if (! isNaN(data.min)) {
    rect.setAttribute('x', data.min)
    if (! isNaN(data.max)) {
      rect.setAttribute('width', data.max - data.min)
    }
  }
  if (! isNaN(data.percent)) {
    rect.style.fillOpacity = data.percent / 100;
  }
}


let init = function() {
  document
    .querySelector('.sampleInput')
    .addEventListener('click', sampleInputClick)

  initToleranceInput()
  document
    .querySelectorAll('.toleranceInput__slider')
    .forEach(e => e.addEventListener('input', inputToleranceInput))
}
