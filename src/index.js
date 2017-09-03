const XML = "http://www.w3.org/2000/svg"
const data = {
  samples: [],
  min: NaN,
  max: NaN,
  percent: NaN,
}
const CDFHeight = 50  // in pixels

// let's use blissful?
let $ = document.querySelector.bind(document)
let $$ = document.querySelectorAll.bind(document)


function hue2rgb(p, q, t){
  if(t < 0) t += 1
  if(t > 1) t -= 1
  if(t < 1/6) return p + (q - p) * 6 * t
  if(t < 1/2) return q
  if(t < 2/3) return p + (q - p) * (2/3 - t) * 6
  return p
}

function hsl2rgb(h, s, l){
  var r, g, b

  if(s == 0){
    r = g = b = l // achromatic
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s
    var p = 2 * l - q
    r = hue2rgb(p, q, h/360 + 1/3)
    g = hue2rgb(p, q, h/360)
    b = hue2rgb(p, q, h/360 - 1/3)
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
    255,
  ]
}

function modulo(x, y) {
  return ((x % y) + y) % y
}


function colorizeThreshold(value, threshold) {
  let H = modulo(value, 360)
  let percentage = value / threshold * 100
  if ( percentage >= 100 ) {
    S = 1.0
    L = 0.5
  } else {
    S = 0.8
    L = 0.4
  }
  return hsl2rgb(H, S, L)
}

let normalConfidence = function(x1, x2, mean, deviation) {
  let distribution = jStat.normal(mean, deviation)
  return distribution.cdf(x2) - distribution.cdf(x1)
}

let renderCanvasHeatmap = function(canvas, color) {
  /* performance experiments to do: (currently 209ms)
   *   does it save time to re-use the imagedata buffer?
   *   what about filling the buffer with 255, then using rgb?
   *   make our own approximation of erf2(x1, x2)
   */
  ctx = canvas.getContext('2d')
  width = canvas.width
  height = canvas.height
  imageData = new ImageData(width, height)

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      imageData.data.set(
        color(x, height - y),
        (x + y*width) * 4,
      )
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

let renderToleranceArea = function() {
  let color = function(x, y) {
    let mean = x
    let deviation = y
    let value = 100 * normalConfidence(
      data.min, data.max, mean, deviation,
    )
    return colorizeThreshold(value, data.percent)
  }
  renderCanvasHeatmap($('.toleranceArea'), color)
}

let renderCanvasCDF = function(canvas, y) {
  ctx = canvas.getContext('2d')
  width = canvas.width
  height = canvas.height
  scale = y => height * (1 - y)

  ctx.clearRect(0, 0, width, height)
  ctx.beginPath()
  ctx.moveTo(0, scale(y(0)))
  for (x = 0; x < width; x++) {
    ctx.lineTo(x, scale(y(x)))
  }
  ctx.stroke()
}

function renderMeanCDF() {
  /* http://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm
   *
   *  Xbar + invt(p,n-1) * s / sqrt(n) > mu
   *  invt(p, n-1) >  (mu - Xbar) * sqrt(n) / s
   *  p >  t((mu - Xbar) * sqrt(n) / s, n-1)
   */

  let deviation = jStat.stdev(data.samples, true)
  let mean = jStat.mean(data.samples)
  let multiplier
  if (deviation === 0) {
    multiplier = 1e100
  } else {
    multiplier = Math.sqrt(data.samples.length) / deviation
  }
  let distribution = jStat.studentt(data.samples.length - 1)

  let y = function(x) {
    return distribution.cdf((x - mean) * multiplier)
  }
  renderCanvasCDF($('.meanCDF'), y)

  y = function(x) {
    return distribution.pdf((x - mean) * multiplier) * multiplier * CDFHeight
  }
  renderCanvasCDF($('.meanPDF'), y)
}

function renderStandardDeviationCDF() {
  /* https://brownmath.com/stat/stdev1.htm
   *
   * sigma^2 < (n - 1) s^2 / chi2inv(n - 1, p)
   * chi2inv(n - 1, p) < (n - 1) s^2 / sigma^2
   * p < chi2(n - 1, (n - 1) s^2 / sigma^2)
   */
  let deviation = jStat.stdev(data.samples, true)
  let multiplier = (data.samples.length - 1) * Math.pow(deviation, 2)
  let distribution = jStat.chisquare(data.samples.length - 1)

  let y = function(x) {
    let sigma = x
    return 1 - distribution.cdf(multiplier * Math.pow(sigma, -2))
  }
  renderCanvasCDF($('.standardDeviationCDF'), y)

  y = function(x) {
    let sigma = x
    return -distribution.pdf(multiplier * Math.pow(sigma, -2)) * (-2 * multiplier * Math.pow(sigma, -3)) * CDFHeight
  }
  renderCanvasCDF($('.standardDeviationPDF'), y)
}

function renderJointCDF() {
  // TODO: DRY me
  let deviation = jStat.stdev(data.samples, true)
  let mean = jStat.mean(data.samples)
  let meanMultiplier
  if (deviation === 0) {
    meanMultiplier = 1e100
  } else {
    meanMultiplier = Math.sqrt(data.samples.length) / deviation
  }
  let meanDistribution = jStat.studentt(data.samples.length - 1)
  let deviationMultiplier = (data.samples.length - 1) * Math.pow(deviation, 2)
  let deviationDistribution = jStat.chisquare(data.samples.length - 1)

  let color = function(x, y) {
    let meanPDF  = meanDistribution.pdf((x - mean) * meanMultiplier) * meanMultiplier * CDFHeight
    let sigma = y
    let deviationPDF = -deviationDistribution.pdf(deviationMultiplier * Math.pow(sigma, -2)) * (-2 * deviationMultiplier * Math.pow(sigma, -3)) * CDFHeight
    let value = 100 * meanPDF * deviationPDF
    return colorizeThreshold(value, 0)
  }
  renderCanvasHeatmap($('.jointCDF'), color)
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

  renderMeanCDF()
  renderStandardDeviationCDF()
  renderJointCDF()
}

svgNode = function(n, v) {
  n = document.createElementNS("http://www.w3.org/2000/svg", n)
  for (var p in v) n.setAttribute(p, v[p])
  return n
}

let sampleInputClick = function(event) {
  bbox = this.getBoundingClientRect()
  x = event.clientX - bbox.left
  y = event.clientY - bbox.top
  event.currentTarget.append(svgNode('circle', {cx: x, cy: y, r: 3}))

  data.samples.push(Number(x))
  data.samples.sort((x, y) => x - y)

  renderSamples()
}

let initToleranceInput = function() {
  let svg = $('.sampleInput')
  let min = svg.x.baseVal.value
  let max = min + svg.width.baseVal.value
  $$('.toleranceInput__slider').forEach(slider => {
    if (['min', 'max'].includes(slider.name)) {
      slider.setAttribute('min', min)
      slider.setAttribute('max', max)
    }
    if (slider.name === "min") {
      slider.setAttribute('value', min + (max - min) * 2 / 5)
    } else if (slider.name === "max") {
      slider.setAttribute('value', min + (max - min) * 3 / 5)
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
    rect.style.fillOpacity = (data.percent / 100) * 0.65 + 0.2
  }
}

let onResize = function() {
  $$('canvas').forEach(canvas => {
    canvas.width = canvas.scrollWidth
    canvas.height = canvas.scrollHeight
  })
  initToleranceInput()
  renderToleranceArea()
}

let init = function() {
  document
    .querySelector('.sampleInput')
    .addEventListener('click', sampleInputClick)
  document
    .querySelectorAll('.toleranceInput__slider')
    .forEach(slider => {
        slider.addEventListener('input', inputToleranceInput)
        slider.addEventListener('change', renderToleranceArea)
    })
  window.addEventListener("resize", onResize)

  onResize()
}

if (document.readyState == "complete") {
  init()
} else {
  window.addEventListener("load", init)
}
