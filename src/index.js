const XML = "http://www.w3.org/2000/svg"
const data = {
  samples: [],
  min: NaN,
  max: NaN,
  percent: NaN,
}
const toleranceInput = "toleranceInput"

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
  for (slider of ["min", "max"]) {
    slider = $('.' + toleranceInput + '__' + slider)
    slider.setAttribute('min', min)
    slider.setAttribute('max', max)
    changeToleranceInput({target:slider})
  }
  changeToleranceInput({target:$('.' + toleranceInput + '__percent')})
}

let changeToleranceInput = function(event) {
  let slider = event.target
  let value = slider.value
  let name = Array.from(slider.classList).filter(
    className => className.startsWith(toleranceInput + '__')
  )[0].slice(toleranceInput.length + 2)

  data[name] = Number(value);
  slider
    .parentElement
    .querySelector('output')
    .innerText = value
}


let init = function() {
  document
    .querySelector('.sampleInput')
    .addEventListener('click', sampleInputClick)

  initToleranceInput()
  document
    .querySelectorAll('[class^="' + toleranceInput + '__"]')
    .forEach(e => e.addEventListener('change', changeToleranceInput))
}
