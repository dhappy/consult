// @ts-check

import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, FormControl, FormLabel, Input, ModalFooter, Button } from '@chakra-ui/react'
import { isoStringFor, isSet } from '../lib/utils'
import { useState } from 'react'

export const KeyboardShortcuts = ({ open, close }) => (
  <Modal
    size="xl"
    {...{ isOpen: open, onClose: close }}
  >
    <ModalOverlay/>
    <ModalContent>
      <ModalHeader
        textOverflow="ellipsis"
        overflow="hidden"
        whiteSpace="nowrap"
      >Keyboard Shortcuts</ModalHeader>
      <ModalCloseButton/>
      <ModalBody pb={6}>
      </ModalBody>
      <ModalFooter>
        <Button
          colorScheme="red"
          onClick={close}
        >Close</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
)

export default KeyboardShortcuts