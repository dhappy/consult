import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import Ceramic from '@ceramicnetwork/http-client'
import { IDX } from '@ceramicstudio/idx'
import { DID } from 'dids'
import {
  ThreeIdConnect, EthereumAuthProvider,
} from '@3id/connect'
import ids from 'ceramicIds.json'
import {
  Box, Button, Flex, FormControl, FormLabel, IconButton, Input, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spinner, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, UnorderedList, useDisclosure,
} from '@chakra-ui/react'
import { DeleteIcon } from '@chakra-ui/icons'
import Markdown from 'react-markdown'
import { useEffect, useState, useMemo } from 'react'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { create as ipfsHTTPClient } from 'ipfs-http-client'
import ChapteredVideo from 'ChapteredVideo'

const CERAMIC_URL = (
  process.env.CERAMIC_URL
  || 'http://localhost:7007'
  || 'https://d12-a-ceramic.3boxlabs.com'
)
const IPFS_URL = (
  process.env.REACT_APP_IPFS_URI ?? '/ip4/127.0.0.1/tcp/5001'
)

const DEF = ids.definitions.ConsultVideoIndex

const NewVideoModal = ({
  isOpen, onClose, setVideos, ceramic, idx, ipfs,

}) => {
  const [startTime, setStartTime] = (
    useState((new Date()).toISOString())
  )
  const [title, setTitle] = useState('')
  const [url, setURL] = useState('')
  const [tabIndex, setTabIndex] = useState(0)
  const [creating, setCreating] = useState(null)

  const video = async () => {
    setCreating('Starting')
    const video = { startTime, title }
    if(tabIndex === 0) {
      video.url = url
    } else {
      ipfs.add()
    }
    const anchorless = video.title.replace(
      /\[([^\]]+)\]\([^)]+\)/g, (_str, $1) => $1
    )
    const id = `${video.startTime}: ${anchorless}`
    setCreating('Checking IDX for Index')
    const videos = (await idx.get(DEF)) ?? {}
    let tile
    if(videos[id]) {
      setCreating('Loading Existing Tile')
      tile = await TileDocument.load(ceramic, videos[id])
      console.info('Existing', tile.id.toUrl())
    } else {
      setCreating('Creating New Tile')
      tile = (await TileDocument.create(
        ceramic,
        null,
        {
          schema: ids.schemas.ConsultVideoMetadata,
          family: 'Consult Video',
          controllers: [ceramic.did.id],
        },
      ))
      console.info('created', tile.id.toUrl())
      setCreating('Updating IDX Index')
      const record = await (
        idx.merge(DEF, { [id]: tile.id.toUrl() }, { pin: true })
      )
      console.info('added', record.toUrl())
      videos[id] = tile.id.toUrl()
      setVideos(Object.keys(videos))
    }
    setCreating('Updating Video Metadata')
    await tile.update(video)
    console.info('updated', id)
    setCreating(null)
  }

  return (
    <Modal {...{ isOpen, onClose }}>
      <ModalOverlay/>
      <ModalContent>
        <ModalHeader>New Video</ModalHeader>
        <ModalCloseButton/>
        <ModalBody>
        <FormControl>
            <FormLabel>Title</FormLabel>
            <Input/>
          </FormControl>
          <FormControl>
            <FormLabel>Start Time</FormLabel>
            <Input type="datetime-local"/>
          </FormControl>
          <Tabs isFitted variant="enclosed">
            <TabList mb="1em">
              <Tab>URL</Tab>
              <Tab>Upload</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Input placeholder="ipfs://…"/>
              </TabPanel>
              <TabPanel>
                <Input type="file"/>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button colorScheme="blue" ml={3}>
            Save
          </Button>
          <Button
            w={72} loadingText={creating}
            onClick={video}
            isLoading={!!creating}
            disabled={creating !== null}
          />

        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default () => {
  const ceramic = useMemo(
    () => new Ceramic(CERAMIC_URL), []
  )
  const idx = useEffect(
    () => new IDX({ ceramic, autopin: true }),
    [ceramic],
  )
  const ipfs = useMemo(
    () => new ipfsHTTPClient(IPFS_URL), []
  )
  const [videos, setVideos] = useState([])
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    (async () => {
      const threeIdConnect = new ThreeIdConnect()
      const addresses = await window.ethereum.enable()
      const authProvider = new EthereumAuthProvider(
        window.ethereum, addresses[0]
      )
      await threeIdConnect.connect(authProvider)
      const did = new DID({
        provider: threeIdConnect.getDidProvider(),
        resolver: ThreeIdResolver.getResolver(ceramic)
      })
      await did.authenticate()
      ceramic.did = did
      console.info('DID', did.id)
    })()
  }, [])

  useEffect(() => {
    if(ceramic && idx) {
      (async () => {
        const videos = await idx.get(DEF)
        console.info('SET VIDS', videos)
        setVideos(Object.keys(videos))
      })()
    }
  }, [ceramic, idx, DEF])

  const remove = async (id) => {
    const videos = (await idx.get(DEF)) ?? {}
    if(!videos[id]) {
      console.warn('Removing Nonexistent Id', id)
    }
    delete videos[id]
    console.info({ videos }, Object.keys(videos))
    await idx.set(DEF, videos)
    console.info('SET', [])
    setVideos([])
  }

  console.info({ videos })

  return (
    <Box align="center" mt={10}>
      <Stack maxW="50rem" align="center">
        <Button
          w={72} onClick={onOpen}
          disabled={!ceramic || !idx}
        >
          New Video
        </Button>
        <UnorderedList>
          {videos.map((vid) => (
            <ListItem key={vid}><Flex justify="center">
              <Markdown>{vid}</Markdown>
              <IconButton
                aria-label="Remove" icon={<DeleteIcon/>}
                size="sm" ml={5} onClick={() => remove(vid)}
              />
            </Flex></ListItem>
          ))}
        </UnorderedList>
      </Stack>
      <NewVideoModal {...{
        isOpen, onClose, ceramic, idx, ipfs,
      }}/>
    </Box>
  )
}