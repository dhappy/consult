const props = [
  { bg: '#19FF20' },
  { bg: 'red' },
  { bg: 'pink' },
  { bg: 'blue', color: 'white' },
  { bg: 'orange' },
  { bg: 'green', color: 'white' },
  { bg: 'teal', color: 'white' },
  { bg: 'purple', color: 'white' },
  { bg: 'darkgray', color: 'white' },
  { bg: 'cyan' },
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
  if(idx >= proppedTags.length) {
    return { bg: 'black', color: 'red' }
  }
  return proppedTags[idx]
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