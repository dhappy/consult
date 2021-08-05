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

// Should be ذو الحجة, but the bidi isn't cooperating in VS Code
export const id = 'tip:w/MetaGame’s Builders/on/1442/Dhuʻl-Hijjah/25/@/1/26/‒/1/77/'
export const startTime = new Date('2021-08-04T10:00:30-0400')
export const url = `https://ipfs.io/ipfs/${CID['/']}`
export const title = (
  <>
    {"Builders' Align for the Week of "}
    <a href='//z13cdn.web.app'>-1442/12/22</a>
    {" ‒ "}
    <a href='//z13cdn.web.app'>28</a>
  </>
)

export const chapters = [
  {
    
  }
]
