Some notes on which libraries I picked, why, and the alternatives I looked at.


graphics
========

 * none -- raw canvas ✔
 * d3 -- svg only
 * svgjs -- low-level svg
 * paperjs -- canvas only
 * threejs -- webgl only

math -- probabilities
=====================

jstat ✔

Requirements
 * erf() -- normal CDF
 * student's t

Nice-to-have
 * pdf and cdf of each distribution
 * normal distribution
 * lognormal
 * cdnjs

Rejected:
 * distributions -- no cdnjs
 * mathjs -- no t-distribution


math -- double integration
==========================
 * by hand (ugh!) ✔
  * <https://rosettacode.org/wiki/Numerical_integration#CoffeeScript>
 * <https://github.com/scijs/integrate-adaptive-simpson/blob/master/vector.js>
