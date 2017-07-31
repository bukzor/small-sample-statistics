const XML = "http://www.w3.org/2000/svg";
const samples = [];

    console.log(1);
let init = function() {
    console.log(2);
  document.querySelectorAll('.sampleInput').forEach(sampleInput => {
    console.log(3);
    sampleInput.addEventListener('click', event => {
    console.log(4);
      // <circle cx="100" cy="100" r="100"/>
      let point = document.createElementNS(XML, 'circle');
      point.setAttribute('cx', event.offsetX);
      point.setAttribute('cy', event.offsetY);
      point.setAttribute('r', 3);
      sampleInput.append(point);

      samples.push(event.offsetX);
      samples.sort();

      renderSamples();
      renderStatistics();
    });
  });
};

let renderSamples = function() {
  document.querySelector('.samples').innerText = samples.join(', ');
};

let renderStatistics = function() {
  let count = samples.length;
  document.querySelector('.statistics__count').innerText = count;
  let mean = (
    samples.reduce((acc, next) => acc + next, 0) / count
  );
  document.querySelector('.statistics__mean').innerText = mean.toFixed(2);
  document.querySelector('.statistics__variance').innerText = Math.pow(
    samples.reduce((acc, next) => acc + Math.pow(next - mean, 2), 0) / count,
    0.5,
  ).toFixed(2);
};

document.addEventListener("DOMContentLoaded", init);
