'use strict'

function IO (client) {
  this.devices = []
  this.index = -1

  this.controller = null
  this.source = null

  this.install = (host) => {

  }

  this.start = () => {
    this.refresh()
    console.log('IO', 'Starting..')
  }

  this.connect = (source = 'IAC Driver Bus 1', controller = 'IAC Driver Bus 1') => {
    this.controller = this.findOutputs(controller)
    this.source = this.find(source)

    if (!this.controller) {
      console.warn('IO', 'Could not connect ' + controller)
    } else {
      console.log('IO', 'Connected to controller ' + this.controller.name)
    }

    if (!this.source) {
      console.warn('IO', 'Could not connect ' + source)
    } else {
      console.log('IO', 'Connected to source ' + this.source.name)
      this.source.onmidimessage = this.onMessage
    }
  }

  this.sendClockStart = function () {
    this.controller.send([0xFA], 0)
    console.log('MIDI', 'MIDI Start Sent')
  }

  this.sendClockStop = function () {
    this.controller.send([0xFC], 0)
    console.log('MIDI', 'MIDI Stop Sent')
  }

  this.sendClockBeat = function () {
    this.controller.send([0xF8], 0)
  }

  this.find = (name) => {
    for (const device of this.devices) {
      if (device.name.indexOf(name) < 0) { continue }
      return device
    }
  }

  this.findOutputs = (name) => {
    for (const output of this.outputs) {
      if (output.name.indexOf(name) < 0) { continue }
      return output
    }
  }

  this.refresh = () => {
    if (!navigator.requestMIDIAccess) { return }
    navigator.requestMIDIAccess().then(this.access, (err) => {
      console.warn('No Midi', err)
    })
  }

  this.list = () => {
    for (const device of this.devices) {
      console.info('IO', device.name)
    }
  }

  this.onControl = (msg) => {
    if (msg.data[0] >= 176 && msg.data[0] < 184) {
      const ch = msg.data[0] - 176
      const knob = msg.data[1] - 1
      const val = msg.data[2]
      client.mixer.tweak(ch, knob, val)
    } else if (msg.data[0] === 144) {
      const pad = msg.data[1]
      const vel = msg.data[2]
      client.rack.play(client.channel, pad, vel)
    }
  }

  this.onMessage = (msg) => {
    if (msg.data[0] >= 144 && msg.data[0] < 160) {
      const ch = msg.data[0] - 144
      const pad = msg.data[1] - 24
      const vel = msg.data[2]
      client.rack.play(ch, pad, vel)
    } else if (msg.data[0] >= 176 && msg.data[0] < 184) {
      const ch = msg.data[0] - 176
      const knob = msg.data[1] - 1
      const vel = msg.data[2]
      client.mixer.tweak(ch, knob, vel)
    }
  }

  this.access = (midiAccess) => {
    const inputs = midiAccess.inputs.values()
    this.devices = []
    for (let i = inputs.next(); i && !i.done; i = inputs.next()) {
      this.devices.push(i.value)
    }

    const outputs = midiAccess.outputs.values()
    this.outputs = []
    for (let i = outputs.next(); i && !i.done; i = outputs.next()) {
      this.outputs.push(i.value)
    }
    this.connect()
  }
}
