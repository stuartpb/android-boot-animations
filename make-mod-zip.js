var gm = require('gm');
var JSZip = require('jszip');
var fs = require('fs');

var fullSvg = fs.readFileSync('base.svg', {encoding:'utf8'});

var caps = /^([\s\S]*)\$TEXT_X_POSITION([\s\S]*)\$TEXT_OPACITY([\s\S]*)$/.exec(fullSvg);

var preXBuf = new Buffer(caps[1]);
var postOpacBuf = new Buffer(caps[3]);

var midBuf = new Buffer(caps[2]);

var postXBuf = Buffer.concat([midBuf, new Buffer('1'), postOpacBuf]);
var preOpacBuf = Buffer.concat([preXBuf, new Buffer('-1309.1608'), midBuf]);

var bazip = new JSZip();

function padded(n) {
  return ('000'+n).slice(-3);
}

function addFileToAnimation(path, buffer) {
  //until I can track down the ZIP issue
  fs.writeFileSync('out/' + path, buffer);
  bazip.file(path, buffer);
}

function addScrollFrame(i) {
  var offset = 720 + (-2029.1608 / 120) * i;
  var frameBuf = Buffer.concat([preXBuf,
    new Buffer(offset.toString()), postXBuf])
  gm(frameBuf,'frame.svg')
    .toBuffer('png',function (err, buffer) {
    if (err) throw new Error(err);
    else {
      addFileToAnimation('scroll/' + padded(i) + '.png', buffer);
    }
  });
}

function addFadeOut(i) {
  var opacity = 1 - 0.1 * i;
  var frameBuf = Buffer.concat([preOpacBuf,
    new Buffer(opacity.toString()), postOpacBuf]);

  gm(frameBuf,'frame.svg')
    .toBuffer('png',function (err, buffer) {
    if (err) throw new Error(err);
    else {
      addFileToAnimation('blink/' + padded(i) + '.png', buffer);
      addFileToAnimation('fade/' + padded(i) + '.png', buffer);
    }
  });
}

function addBlack(i) {
  var frameBuf = Buffer.concat([preOpacBuf, new Buffer('0'), postOpacBuf]);

  gm(frameBuf,'frame.svg')
    .toBuffer('png',function (err, buffer) {
    if (err) throw new Error(err);
    else {
      addFileToAnimation('blink/' + padded(i) + '.png', buffer);

      // Yes, I realize this is a ton of extra complexity
      // for the sake of rendering a completely black PNG.

      if (i == 10) {
        addFileToAnimation('fade/' + padded(i) + '.png', buffer);
      }
    }
  });
}

function addFadeIn(i) {
  var opacity = (1/3) * (i-12);
  var frameBuf = Buffer.concat([preOpacBuf,
    new Buffer(opacity.toString()), postOpacBuf]);

  gm(frameBuf,'frame.svg')
    .toBuffer('png',function (err, buffer) {
    if (err) throw new Error(err);
    else {
      addFileToAnimation('blink/' + padded(i) + '.png',buffer);
    }
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

bazip.file('desc.txt',fs.readFileSync('desc.txt','utf8'));

fs.writeFileSync('bootanimation.zip',bazip.generate({type:'nodebuffer'}));

/* //commented until I figure out flashable ZIPs
fs.writeFileSync('big-o-boot-mod.zip',
  new JSZip().file('system/media/bootanimation.zip',
    bazip.generate({type:'nodebuffer'}))
  .generate({type:'nodebuffer'}));
*/
