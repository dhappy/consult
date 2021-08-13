export const propsFor = (tag) => {
  const props = {
    psych: { bg: '#19FF20' },
    personal: { bg: 'red' },
    skippable: { bg: 'pink' },
    BP: { bg: 'blue', color: 'white' },
    logistics: { bg: 'orange' },
    pertinent: { bg: 'green', color: 'white' },
    pitch: { bg: 'teal', color: 'white' },
    recommendation: { bg: 'purple', color: 'white' },
    chatter: { bg: 'darkgray', color: 'white' },
    tangential: { bg: 'cyan' },
  }
  if(props[tag]) return props[tag]
  return { bg: 'yellow' }
}

export const timeFor = (str) => (
  (str) ? ((() => {
    const [secondsStr, minutesStr, ...hoursStrs] = str.split(':').reverse()
    if(hoursStrs.length > 1) {
      console.warn(`Got ${hoursStrs} for hours parsing ${str}.`)
    }
    let [seconds, minutes, hours] = (
      [parseFloat(secondsStr), parseFloat(minutesStr ?? 0), parseFloat(hoursStrs?.[0] ?? 0)]
    )
    minutes += hours * 60
    return seconds + minutes * 60
  })()) : (
    undefined
  )
)

export const stringFor = (time) => {
  if(Number(time) !== time) return undefined

  const hours = Math.floor(time / (60 * 60))
  const minutes = Math.floor((time % (60 * 60)) / 60)
  const seconds = time % 60

  return (
    `${
      hours > 0 ? (
        `${hours}:${minutes.toString().padStart(2, '0')}`
      ) : (
        minutes
      )
    }:${
      seconds.toString().padStart(2, '0')
    }`
  )
}