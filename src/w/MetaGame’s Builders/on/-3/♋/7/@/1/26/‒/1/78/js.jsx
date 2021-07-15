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

export const startTime = new Date('2021-07-14T10:00:30-0400')
export const url = `https://ipfs.io/ipfs/${CID['/']}`
export const title = (
  <>
    {"Builders' Align for the Week of "}
    <a href='//z13cdn.web.app'>-3/♋/6</a>
    {" ‒ "}
    <a href='//z13cdn.web.app'>0</a>
  </>
)

const baseChapters = {
  '00:00': {
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
