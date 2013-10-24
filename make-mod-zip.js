var gm = require('gm');
var jszip = require('node-zip');
var fs = require('fs');

var fullSvg = fs.readFileSync('base.svg',{encoding:'utf8'});

var caps = /^(.*)$TEXT_X_POSITION(.*)$TEXT_OPACITY(.*)$/.exec(fullSvg);

var preXBuf = new Buffer(caps[1]);
var postOpacBuf = new Buffer(caps[3]);

var midBuffer = new Buffer(caps[2]);

var postXBuf = Buffer.concat([midBuffer,new Buffer('1'),postOpacBuffer]);
var preOpacBuf = Buffer.concat([postOpacBuffer,new Buffer('-1309.1608'),midBuffer]);

var bazip = jszip();

function padded(n) {
  return ('000'+n).slice(-3);
}

var scrollFol = bazip.folder("scroll");
var blinkFol = bazip.folder("blink");
var fadeFol = bazip.folder("fade");

function addScrollFrame(i) {
  var offset = 720 + (-2029.1608 / 120) * i;
  gm.source(Buffer.concat([preXBuf,
      new Buffer(offset.toString()),postXBuf]))
    .toBuffer(function (err, buffer) {
    if (err) throw new Error(err);
    else scrollFol.file(padded(i) + '.png', buffer);
  });
}

function addFadeOut(i) {
  var opacity = 1 - 0.1 * i;
  gm.source(Buffer.concat([preXBuf,
      new Buffer(opacity.toString()), postXBuf]))
    .toBuffer(function (err, buffer) {
    if (err) throw new Error(err);
    else {
      blinkFol.file(padded(i) + '.png', buffer);
      fadeFol.file(padded(i) + '.png', buffer);
    }
  });
}

function addBlack(i) {
  gm.source(Buffer.concat([preXBuf, new Buffer('0'), postXBuf]))
    .toBuffer(function (err, buffer) {
    if (err) throw new Error(err);
    else {
      blinkFol.file(padded(i) + '.png', buffer);
      // Yes, I realize this is a ton of extra complexity
      // for the sake of rendering a completely black PNG.
      if (i == 10) {
        fadeFol.file(padded(i) + '.png', buffer);
      }
    }
  });
}

function addFadeIn(i) {
  var opacity = (1/3) * (i-12);
  gm.source(Buffer.concat([preXBuf,
      new Buffer(opacity.toString()), postXBuf]))
    .toBuffer(function (err, buffer) {
    if (err) throw new Error(err);
    else blinkFol.file(padded(i) + '.png', buffer);
  });
}

var i;

for (i = 0; i < 120; i++) {
  addScrollFrame(i);
}

for (i = 0; i < 10; i++) {
  addFadeOut(i);
}
for (i = 10; i < 13; i++) {
  addBlack(i);
}
for (i = 13; i < 16; i++) {
  addFadeIn(i);
}


bazip.file('desc.txt',fs.readFileSync('desc.txt'));

fs.writeFileSync('big-o-boot-mod.zip',
  jszip().file('system/media/bootanimation.zip',
    bazip.generate({type:'nodebuffer'}))
  .generate({type:'nodebuffer'}));
