const XML = "http://www.w3.org/2000/svg";

let init = function() {
  // <circle cx="100" cy="100" r="100"/>
  document.querySelectorAll('.samples').forEach(samples => {
    samples.addEventListener('click', event => {
      let point = document.createElementNS(XML, 'circle');
      point.setAttribute('cx', event.offsetX);
      point.setAttribute('cy', event.offsetY);
      point.setAttribute('r', 3);

      samples.append(point);
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
