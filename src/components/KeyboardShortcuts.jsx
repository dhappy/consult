// @ts-check

import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, FormControl, FormLabel, Input, ModalFooter, Button, SimpleGrid, GridItem } from '@chakra-ui/react'

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
      <ModalBody>
        <SimpleGrid
          sx={{
            '& > div:nth-of-type(2n + 1)': {
              textAlign: 'right',
              marginRight: '1rem'
            }
          }}
          columns={2} templateColumns="4rem 1fr"
          maxW="15rem" margin="auto">
          <GridItem>p / P</GridItem>
          <GridItem>Toggle Pause</GridItem>
          <GridItem>s</GridItem>
          <GridItem>Seek Backwards 10%</GridItem>
          <GridItem>b / 4</GridItem>
          <GridItem>Seek Backwards 5s</GridItem>
          <GridItem>B</GridItem>
          <GridItem>Seek Backwards 20s</GridItem>
          <GridItem>j</GridItem>
          <GridItem>Seek Forward 10%</GridItem>
          <GridItem>f / 6</GridItem>
          <GridItem>Seek Forward 5s</GridItem>
          <GridItem>F</GridItem>
          <GridItem>Seek Forward 20s</GridItem>
          <GridItem>c</GridItem>
          <GridItem>Insert Child</GridItem>
          <GridItem>t</GridItem>
          <GridItem>Partition Parent</GridItem>
          <GridItem>T</GridItem>
          <GridItem>Partition Children</GridItem>
          <GridItem>m</GridItem>
          <GridItem>Toggle Color Mode</GridItem>
          <GridItem>2</GridItem>
          <GridItem>Activate Preceding</GridItem>
          <GridItem>8</GridItem>
          <GridItem>Activate Postceding</GridItem>
          <GridItem>e</GridItem>
          <GridItem>Edit Active Node</GridItem>
          <GridItem>k</GridItem>
          <GridItem>Keyboard Shortcuts</GridItem>
        </SimpleGrid>
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