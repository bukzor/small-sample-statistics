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


function hue2rgb(p, q, t){
  if(t < 0) t += 1;
  if(t > 1) t -= 1;
  if(t < 1/6) return p + (q - p) * 6 * t;
  if(t < 1/2) return q;
  if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function hsl2rgb(h, s, l){
  var r, g, b;

  if(s == 0){
    r = g = b = l; // achromatic
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h/360 + 1/3);
    g = hue2rgb(p, q, h/360);
    b = hue2rgb(p, q, h/360 - 1/3);
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
    255,
  ];
}

function colorizeThreshold(value, threshold) {
  let H = value;
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

let normalConfidence = function(x1, x2, mean, variance) {
  return (math.erf(
    (x2 - mean) / Math.sqrt(2 * variance)
  ) - math.erf(
    (x1 - mean) / Math.sqrt(2 * variance)
  )) / 2
}

let renderToleranceArea = function() {
  /* performance experiments to do: (currently 209ms)
   *   does it save time to re-use the imagedata buffer?
   *   what about filling the buffer with 255, then using rgb?
   *   make our own approximation of erf2(x1, x2)
   */
  canvas = $('.toleranceArea')
  ctx = canvas.getContext('2d')
  width = canvas.width
  height = canvas.height
  imageData = new ImageData(width, height)

  for (y = 0; y < height; y++) {
    let variance = Math.pow(y, 2)
    for (x = 0; x < width; x++) {
      let mean = x
      let value = 100 * normalConfidence(
        data.min, data.max, mean, variance,
      )
      imageData.data.set(
        colorizeThreshold(value, data.percent),
        (x + y*width) * 4,
      )
    }
  }
  ctx.putImageData(imageData, 0, 0);
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

svgNode = function(n, v) {
  n = document.createElementNS("http://www.w3.org/2000/svg", n)
  for (var p in v) n.setAttribute(p, v[p])
  return n
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
} else {
  window.addEventListener("load", init)
}
