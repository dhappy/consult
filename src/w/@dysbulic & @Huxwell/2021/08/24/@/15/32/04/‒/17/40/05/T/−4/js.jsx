export const startsAt = new Date('2021-08-24@15:32:04')
export const source = 'ipfs://QmY15AGTEFeDBafJbsbFUvv87iC2E1ToSS78CNMQEz3eGe/2021⁄08⁄24@15:32:04.Pairing%20With%20@Huxwell%20&%20@Michiel%20On%20Ceramic%20Login.x264.mp4'
export const stops = [
  {
    duration: '0‒2:08:01',
    type: 'title',
    value: '@dysbulic & @Huxwell pair program to integrate Ceramic’s IDX profiles.',
    children: [
      {
        startsAt: new Date('2021-08-24@15:32:04'),
        decision: 'Use `[easy-peasy](https://easy-peasy.vercel.app/)` for frontpage state management?',
        options: [
          {
            description: 'Use `easy-peasy`.',
            pros: ['Used in the Discovery Ceramic integration which @Huxwell wrote.'],
            cons: ['Adds complexity to the app and introduces a relatively unknown library deep into the data handling processes.'],
          },
          {
            description: 'Use `redux`.',
            pros: [
              'The established name in state management.',
            ],
            cons: [
              'Added complexity of a new library which alters the flow of how information moves through the app.',
            ]
          },
          {
            description: 'Continue to use nothing.',
            pros: ['Simpler.'],
            selected: true,
          },
        ],
      },
      {
        children: [
          {
            duration: '02:00‒02:26',
            question: '¿What is the specific behavior desired as motivation for the change?',
          },
          {
            duration: '02:54‒',
            answer: 'The list of skills in a player’s profile.',
            to: '02:00‒02:26',
          },
        ],
      },
      {
        duration: '03:24‒',
        argument: "We don't need a state management library, everything is coming directly from Hasura."
      }
    ]
  }
]