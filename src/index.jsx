import React from 'react'
import ReactDOM from 'react-dom'
import {
  ChakraProvider, ColorModeScript,
} from '@chakra-ui/react'
import {
  CeramicProvider, Networks,
} from 'use-ceramic'
import { EthereumAuthProvider } from '@3id/connect'
import Web3 from 'web3'
import App from './App'

const connect = async () => {
  const [address] = (
    await window.ethereum.request({
      method: 'eth_requestAccounts',
      params: [{}],
    })
  )
  const web3 = new Web3(window.ethereum)
  return new EthereumAuthProvider(
    web3.currentProvider, address
  )
}

ReactDOM.render(
  <React.StrictMode>
    <ColorModeScript initialColorMode="system"/>
    <CeramicProvider
      network={Networks.TESTNET_CLAY}
      endpoint="https://ceramic-clay.3boxlabs.com"
      // endpoint="http://localhost:7007"
      {...{ connect }}
    >
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </CeramicProvider>
  </React.StrictMode>,
  document.getElementById('root'),
)