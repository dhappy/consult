import CID from './cid'
import { isoStringFor } from 'utils'

export const startTime = new Date('2021-04-25T21:55:37-0400')
export const url = `https://ipfs.io/ipfs/${CID['/']}`
export const title = 'Raid Guild Initial Consultation Call w/ @joshsdoug'

export const stops = {
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
  '25:45': {
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
    name: (
      '[Donnie Darko](https://ipfs.io/ipfs/QmTAdBoj7guxtLroQrdFTHrA1M2vSa37VQZoh4D77rdANc/Donnie.Darko.2001.mp4)'
    ),
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

export default {
  title,
  startTime: isoStringFor(startTime),
  source: url,
  stops,
}