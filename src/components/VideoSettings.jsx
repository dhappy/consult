// @ts-check

import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, FormControl, FormLabel, Input, ModalFooter, Button } from '@chakra-ui/react'
import { isoStringFor, isSet } from '../lib/utils'
import { useState } from 'react'

export const VideoSettings = ({
  open, close, info, setInfo,
}) => {
  if(!isSet(info.startsAt)) {
    info.startsAt = new Date()
  }
  const [startsAt, setStartsAt] = useState(
    isoStringFor(info.startsAt, { tz: false })
  )
  const [source, setSource] = (
    useState(info.source)
  )
  const [url, setURL] = useState(
    process.env.IPFS_API_URL
    ?? 'https://ipfs.infura.io:5001'
  )

  const save = (evt) => {
    evt.preventDefault()
    setInfo((info) => ({
      ...info,
      startsAt: new Date(startsAt),
      source,
    }))
    close()
  }

  return (
    <Modal
      size="xl"
      {...{ isOpen: open, onClose: close }}
    >
      <ModalOverlay/>
      <ModalContent as="form" onSubmit={save}>
        <ModalHeader
          textOverflow="ellipsis"
          overflow="hidden"
          whiteSpace="nowrap"
        >Video Settings</ModalHeader>
        <ModalCloseButton/>
        <ModalBody pb={6}>
          <FormControl mt={4}>
            <FormLabel>Start Time</FormLabel>
            <Input
              type="datetime-local"
              value={startsAt} autoFocus
              onChange={({ target: { value }}) => {
                setStartsAt(value)
              }}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Video Source</FormLabel>
            <Input
              value={source ?? ''}
              onChange={({ target: { value }}) => {
                setSource(value)
              }}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="red"
            onClick={close}
          >Cancel</Button>
          <Button
            type="submit"
            colorScheme="blue" ml={3}
          >Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default VideoSettings