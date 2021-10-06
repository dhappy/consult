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

export const timeFor = (str, opts = {}) => (
  (str) ? ((() => {
    const [secondsStr, minutesStr, ...hoursStrs] = str.split(':').reverse()
    if(hoursStrs.length > 1) {
      console.warn(`Got ${hoursStrs} for hours parsing ${str}.`)
    }
    let [seconds, minutes, hours] = ([
      parseFloat(!!secondsStr.length ? secondsStr : 0),
      parseInt(minutesStr ?? 0),
      parseInt(hoursStrs?.[0] ?? 0),
    ])
    minutes += hours * 60
    return seconds + minutes * 60
  })()) : (
    opts.default
  )
)

export const isSet = (value) => (
  Boolean(value) || value === 0
)

export const stringFor = (time, opts = {}) => {
  if(!isSet(time)) return opts.default

  const hours = Math.floor(time / (60 * 60))
  const minutes = Math.floor((time % (60 * 60)) / 60)
  const seconds = Math.floor(time % 60)
  const milliseconds = time - Math.floor(time)

  if(
    ![hours, minutes, seconds, milliseconds].reduce(
      (acc, num) => acc && !isNaN(num),
      true
    )
  ) {
    return opts.default
  }

  let [msStr] = (
    milliseconds.toFixed(4).split('.').slice(-1)
  )
  msStr = msStr.replace(/0+$/, '')

  return (
    `${
      hours > 0 ? (
        `${hours}:${minutes.toString().padStart(2, '0')}`
      ) : (
        minutes
      )
    }:${
      seconds.toString().padStart(2, '0')
    }${
      msStr === '' ? '' : `.${msStr}`
    }`
  )
}

export const isoStringFor = (date, opts = {}) => {
  const tzo = -date.getTimezoneOffset()
  const dif = tzo >= 0 ? '+' : '-'
  const pad = (num) => {
    const norm = Math.floor(Math.abs(num));
    return (norm < 10 ? '0' : '') + norm;
  }
  const dateSeparator = opts.dateSeparator ?? '-'

  let ret = (
    date.getFullYear()
    + dateSeparator + pad(date.getMonth() + 1)
    + dateSeparator + pad(date.getDate())
    + 'T' + pad(date.getHours())
    + ':' + pad(date.getMinutes())
  )
  if(opts.seconds ?? true) {
    ret += ':' + pad(date.getSeconds())
  }
  ret += `​(ᴜᴛᴄ${dif}${Math.abs(tzo / 60)}`
  if((opts.tzMinutes ?? true) || tzo % 60 !== 0) {
    ret += ':' + pad(tzo % 60)
  }
  ret += ')'
  return ret
}