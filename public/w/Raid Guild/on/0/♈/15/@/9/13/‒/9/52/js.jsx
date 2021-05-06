import { Link } from '@chakra-ui/react'
import CID from './cid'

// ToDo: load from App.jsx
export const timeFor = (str) => (
  (str) ? ((() => {
    const [start, ...end] = str.split(':')
    return parseInt(start) * 60 + parseInt(end)
  })()) : (
    undefined
  )
)

export const url = `https://ipfs.io/ipfs/${CID['/']}`
export const title = 'Raid Guild Initial Consultation Call w/ @joshsdoug'

const baseChapters = {
  '00:00': {
    name: 'Musical Intro',
    tags: ['skippable']
  },
  '08:45': {
    name: 'High Volume',
    tags: ['chatter'],
  },
  '09:30': {
    name: 'Blood Pressure',
    tags: ['BP'],
  },
  '10:37': {
    name: 'Bleeding Edge',
    tags: ['pertinent'],
  },
  '13:06': {
    name: 'Ceramic',
    tags: ['pertinent'],
  },
  '15:26': {
    name: 'Jitsi',
    tags: ['logistics'],
  },
  '17:40': {
    name: 'Call me “Δυς”.',
    tags: ['personal'],
  },
  '18:04': {
    name: 'Blood Pressure',
    tags: ['BP'],
  },
  '18:50': {
    name: 'Reread',
    tags: ['skippable'],
  },
  '19:32': {
    name: 'Peyote',
    tags: ['BP'],
  },
  '20:16': {
    name: 'Fractured',
    tags: ['skippable'],
  },
  '20:54': {
    name: 'BP Persistence',
    tags: ['BP'],
  },
  '22:48': {
    name: 'Reschedule',
    tags: ['logistics'],
  },
  '24:06': {
    name: 'Jitsi Found',
    tags: ['logistics'],
  },
  '24:45': {
    name: 'Stretch Goals',
    tags: ['skippable'],
  },
  '26:45': {
    name: 'Anarchism',
    tags: ['pertinent'],
  },
  '26:45': {
    name: 'Passed',
    tags: ['personal'],
  },
  '28:23': {
    name: 'Triage List',
    tags: ['tangential'],
  },
  '30:08': {
    name: 'Scattered',
    tags: ['skippable'],
  },
  '33:29': {
    name: 'Français',
    tags: ['logistics'],
  },
  '35:15': {
    name: "Odin's Eye",
    tags: ['pertinent'],
  },
  '35:41': {
    name: 'Hard Stop',
    tags: ['logistics'],
  },
  '36:20': {
    name: 'BP Resolution',
    tags: ['BP'],
  },
  '36:43': {
    name: 'Pairing Partners',
    tags: ['pertinent'],
  },
  '37:21': {
    name: 'Beggars in Spain',
    tags: ['recommendation'],
  },
  '37:27': {
    name: 'Ancillae',
    tags: ['skippable'],
  },
  '37:53': {
    name: 'Kubernetes',
    tags: ['pertinent'],
  },
  '38:38': {
    name: 'BP Mindlessness',
    tags: ['BP'],
  },
  '40:00': {
    name: 'Render Tree',
    tags: ['algorithm'],
  },
  '41:25': {
    name: 'Donnie Darko',
    // ToDo: Fix loader issues that prevent this from working
    // name: (
    //   <Link
    //     href="https://ipfs.io/ipfs/QmTAdBoj7guxtLroQrdFTHrA1M2vSa37VQZoh4D77rdANc/Donnie.Darko.2001.mp4"
    //   >Donnie Darko</Link>
    // ),
    tags: ['recommendation'],
  },
  '43:42': {
    name: 'Kinesthetic Reasoning',
    tags: ['psych'],
  },
  '44:19': {
    name: 'T-minus 5 Minutes',
    tags: ['logistics'],
  },
  '44:52': {
    name: '¿Will it happen?',
    tags: ['pitch', 'pertinent'],
  },
  '46:27': {
    name: 'Revolution through Election',
    tags: ['pertinent'],
  },
  '47:22': {
    name: '¿What year is it?',
    tags: ['pitch', 'pertinent'],
  },
  '49:45': {
    name: '1968',
    tags: ['pertinent'],
  },
  '50:35': {
    name: 'Dissatisfied',
    tags: ['logistics'],
  },
  '52:48': {
    name: '¿Make Sense?',
    tags: ['pertinent'],
  },
  '53:26': {
    name: "Inch'allah",
    tags: ['logistics'],
  },
  '53:34': {
    name: 'Euthanasia',
    tags: ['personal'],
  },
  '54:04': {
    name: 'Dead Air',
    tags: ['skippable'],
  },
}

let prev
for(let [time, info] of Object.entries(baseChapters)) {
  info.start = timeFor(time)
  if(prev) {
    prev.end = timeFor(time)
  }
  prev = info
}

export const chapters = baseChapters

// https://github.com/umdjs/umd
// (function (root, factory) {
//   if(typeof define === 'function' && define.amd) {
//     // AMD. Register as an anonymous module.
//     define(['exports', 'b'], factory)
//   } else if(
//     typeof exports === 'object'
//     && typeof exports.nodeName !== 'string'
//   ) {
//     // CommonJS
//     factory(exports, require('b'))
//   } else {
//     // Browser globals
//     factory((root.commonJsStrict = {}), root.b)
//   }
// }(this, function (exports, b) {
//   //use b in some fashion.
//   b.chapters = chapters

//   // attach properties to the exports object to define
//   // the exported module properties.
//   exports.action = function () {}
// }))

