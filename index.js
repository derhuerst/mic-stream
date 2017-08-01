var spawn = require('child_process').spawn
var os = require('os')
var Through = require('audio-through')

if (process.platform !== 'linux') {
  throw new Error('Only linux is supported with Node -- alas! Please file a PR!')
}

module.exports = function micStream (outputFormat) {
  var inputFormat = {
    signed: true,
    float: false,
    bitDepth: 16,
    byteOrder: os.endianness instanceof Function ? os.endianness() : 'LE',
    channels: 2,
    sampleRate: 44100,
    interleaved: true,
    samplesPerFrame: 1024,
    sampleSize: 2,
    id: 'S_16_LE_2_44100_I',
    max: 32678,
    min: -32768
  }
  this.format = inputFormat

  outputFormat = outputFormat || inputFormat

  // TODO: use web/node based on detection
  var p = nodeMicProcess()

  var through = new Through()
  var res = p.stdout.pipe(through)

  var killed = false
  res.stop = function stop (cb) {
    killed = true
    p.kill('SIGTERM')
    p.once('exit', cb)
  }

  p.once('exit', function onStop (code) {
    if (!killed && code !== 0) {
      p.emit('error', new Error('Recorder exited with ' + code + '.'))
    } else {
      p.stdout.unpipe(through)
    }
    through.end()
  })

  return res
}

function nodeMicProcess () {
  var args = '-c 2 -r 44100 -f S16_LE --buffer-size=16384'.split(' ')
  return spawn('arecord', args)
}

// function browserMicStream () {
//   throw new Error('not implemented')
// }
