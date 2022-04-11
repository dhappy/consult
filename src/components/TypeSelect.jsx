// @ts-check

import { useColorModeValue, Box, Flex, Input, Tooltip, IconButton, Button, UnorderedList, ListItem, Image, Text } from '@chakra-ui/react'
import { useMemo } from 'react'
import { TiBackspace } from 'react-icons/ti'
import useDownshift from 'use-downshift'
import { isSet } from '../lib/utils'
import Plan from '../images/planning.svg'
import Decision from '../images/gavel.svg'
import Issue from '../images/ticket.svg'
import Presenter from '../images/speaker.svg'
import Unknown from '../images/question mark.svg'
import Previously from '../images/left arrow.svg'
import Discussion from '../images/discuss.svg'
import Logistics from '../images/certification.svg'
import Blocked from '../images/brick wall.svg'
import Roundtable from '../images/roundtable.svg'
import Pairing from '../images/pear.svg'

export const icons = {
  Roundtable, Pairing,
  Plan, Decision, Issue, Presenter, Previously,
  Discussion, Logistics, Blocked, 
  Unknown,
}

export const TypeSelect = ({
  type, setType, scrollId,
}) => {
  const types = useMemo(
    () => Object.keys(icons),
    [icons],
  )
  const borderColor = useColorModeValue(
    'gray.200', 'whiteAlpha.300'
  )
  const bgColor = useColorModeValue(
    'white', 'gray.700'
  )
  const {
    inputValue,
    isOpen,
    getRootProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getToggleButtonProps,
    highlightedIndex,
    selectedItem,
  } = useDownshift({
    onChange: () => {
      if(scrollId) {
        const elem = (
          document.getElementById(scrollId)
        )
        elem?.scrollIntoView()
      }
    },
    onInputValueChange: (input) => {
      setType(input)
    },
    selectedItem: type,
  })

  const found = []
  const missed = []
  types.forEach((item) => {
    if(
      !isSet(inputValue)
      || (
        item.toLowerCase()
        .includes(inputValue.toLowerCase())
      )
    ) {
      found.push(item)
    } else {
      missed.push(item)
    }
  })
  const splitIndex = found.length - 1
  const sorted = found.concat(missed)

  return (
    <Box
      w="full"
      {...getRootProps()}
    >
      <Flex>
        <Box h={8} minW={8} mr={2}>
          {icons[type] && (
            <Image
              src={icons[type]}
              w="full" h="full" mt={1}
            />
          )}
        </Box>
        <Input {...getInputProps()}/>
        <Tooltip hasArrow label="Clear the Field">
          <IconButton
            aria-label="clear"
            zIndex={6} variant="outline"
            tabIndex={-1}
            icon={<TiBackspace/>}
            onClick={() => setType('')}
          />
        </Tooltip>
        <Tooltip hasArrow label="Type Options">
          <Button
            zIndex={6} tabIndex={-1}
            {...getToggleButtonProps()}
          >
            ▼
          </Button>
        </Tooltip>
      </Flex>

      {isOpen && (
        <UnorderedList
          {...getMenuProps()}
          position="absolute"
          sx={{
            listStyle: 'none',
            '.split': {
              borderBottom: '5px double',
              borderColor,
            },
          }}
          w="full" zIndex={5} m={0}
          bg={bgColor} border="1px solid"
          {...{ borderColor }}
          borderBottomRightRadius="md"
          borderBottomLeftRadius="md"
        >
          {sorted.map((item, idx) => (
            <ListItem
              {...getItemProps({
                key: idx,
                item,
                selected: selectedItem === item,
              })}
              bg={
                highlightedIndex === idx
                ? '#FF55FF66' : 'auto'
              }
              pl={3} lineHeight={2}
              display="flex" justify="center"
              className={
                idx === splitIndex ? 'split' : ''
              }
            >
              <Image
                src={icons[item]}
                w={8} maxH={8} py={0.5} mr={2}
                bg={idx > splitIndex ? 'white' : 'yellow'}
              />
              <Text flexGrow={1}>{item}</Text>
            </ListItem>
          ))}
        </UnorderedList>
      )}
    </Box>
  )
}

export default TypeSelect