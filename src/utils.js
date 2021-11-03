import JSON5 from 'json5'

const props = [
  { bg: '#19FF20' },
  { bg: '#FF0000BB' },
  { bg: 'pink' },
  { bg: 'blue', color: 'white' },
  { bg: 'orange' },
  { bg: 'green', color: 'white' },
  { bg: 'teal', color: 'white' },
  { bg: 'purple', color: 'white' },
  { bg: 'darkgray', color: 'white' },
  { bg: 'cyan' },
  { bg: 'black', color: 'red' },
]
const proppedTags = []
export const propsFor = (info) => {
  const search = info.tags?.[0] ?? info.speakers?.[0]
  if(!search) return { bg: 'orange' }

  let idx = proppedTags.indexOf(search)
  if(idx < 0) {
    idx = proppedTags.length
    proppedTags.push(search)
  }
  idx = idx % props.length
  return props[idx]
}

export const isSet = (value) => (
  ['number', 'boolean'].includes(typeof value)
  || Boolean(value)
)

export const ifSet = (value, { default: def } = {}) => (
  isSet(value) ? value : def
)

export const durationFor = (str) => {
  if(typeof str !== 'string') {
    throw new Error(`Bad Argument: expected string, got ${typeof str}`)
  }
  const [from, to = from] = str.split('‒').map(timeFor)
  return {
    startsOffset: from,
    duration: to - from,
  }
}

export const timeFor = (str, { default: def } = {}) => (
  !isSet(str) ? def : (
    (() => {
      str = str.toString()
      const [secondsStr, minutesStr, hoursStr, ...rest] = (
        str.split(':').reverse()
      )
      if(rest.length >= 1) {
        console.warn(`Got [${rest}] extraneous parameters in ${str}.`)
      }
      let [seconds, minutes, hours] = ([
        parseFloat(ifSet(secondsStr) ?? 0 ),
        parseInt(ifSet(minutesStr) ?? 0),
        parseInt(ifSet(hoursStr) ?? 0),
      ])
      minutes += hours * 60
      return seconds + minutes * 60
    })()
  )
)

export const stringFor = (
  (time, { default: def, milliseconds = true } = {}) => {
    if(!isSet(time)) return def

    const sign = time < 0 ? '−' : ''
    const hours = Math.floor(Math.abs(time / (60 * 60)))
    const minutes = (
      Math.floor(Math.abs((time % (60 * 60)) / 60))
    )
    const seconds = Math.floor(Math.abs(time % 60))
    const mss = (
      Math.abs(time) - Math.floor(Math.abs(time))
    )

    if(
      ![hours, minutes, seconds, mss].reduce(
        (acc, num) => acc && !isNaN(num),
        true
      )
    ) {
      return def
    }

    let [msStr] = (
      mss.toFixed(4).split('.').slice(-1)
    )
    msStr = msStr.replace(/0+$/, '')

    return (
      `${sign}${
        hours > 0 ? (
          `${hours}:${minutes.toString().padStart(2, '0')}`
        ) : (
          minutes
        )
      }:${
        seconds.toString().padStart(2, '0')
      }${
        (!milliseconds || msStr === '') ? '' : `.${msStr}`
      }`
    )
  }
)

export const isoStringFor = (date, opts = {}) => {
  if(!date) return opts.default

  const tzo = -date.getTimezoneOffset()
  const dif = tzo >= 0 ? '+' : '-'
  const pad = (num, length = 2) => {
    const norm = Math.floor(Math.abs(num));
    return norm.toString().padStart(length, '0')
  }
  const { dateSeparator: sep = '-' } = opts

  let ret = ''
  if(opts.date !== false) {
    ret += (
      date.getFullYear()
      + sep + pad(date.getMonth() + 1)
      + sep + pad(date.getDate())
    )
    if(opts.time !== false) {
      ret += opts.partsSeparator ?? 'T'
    }
  }
  if(opts.time !== false) {
    ret += (
      pad(date.getHours())
      + ':' + pad(date.getMinutes())
    )
    if(opts.seconds ?? true) {
      ret += ':' + pad(date.getSeconds())
    }
    if(opts.tz !== false) {
      if(!opts.standard) {
        ret += '​(ᴜᴛᴄ'
      }
      ret += dif + pad(
        Math.abs(tzo / 60),
        opts.standard ? 2 : 1
      )
      if((opts.tzMinutes ?? true) || tzo % 60 !== 0) {
        ret += ':' + pad(tzo % 60)
      }
      if(!opts.standard) {
        ret += ')'
      }
    }
  }
  return ret
}

export const capitalize = (str) => {
  if(!str?.split) return str
  return (
    str.trim().split(/\s+/g)
    .map((sub) => (`${
      sub[0]?.toUpperCase() ?? ''
    }${
      sub.substring(1)?.toLowerCase() ?? ''
    }`))
    .join(' ')
  )
}

export const toHTTP = (URI) => {
  const regex = /^ipfs:(\/\/)?(([^/]+)\/?(.*))$/i
  const match = URI?.match(regex)
  if(match) {
    if(match[2].startsWith('bafybe')) {
      return (
        `//${match[3]}.ipfs.dweb.link`
        + `/${match[4]}`
      )
    }
    return `//ipfs.io/ipfs/${match[2]}`
  }
  return URI
}

export const load = async (URI) => {
  const response = await fetch(toHTTP(URI))
  const text = await response.text()
  return (
    isSet(text)
    ? await JSON5.parse(text)
    : null
  )
}

export const isEmpty = (obj, { undefIs = false } = {}) => {
  if(obj === '') {
    return true
  }
  if(typeof obj !== 'object') {
    return undefIs
  }
  if(typeof obj.length === 'number') {
    return obj.length === 0
  }
  if(Object.keys(obj).length === 0) {
    return true
  }
  return false
}