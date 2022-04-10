// @ts-check

import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Tabs, TabList, Tab, TabPanels, TabPanel, Text, FormControl, FormLabel, Input, Textarea, Flex, Button, ModalFooter } from '@chakra-ui/react'
import { useRef, useState, useMemo } from 'react'
import Markdown from 'react-markdown'
import { newNode } from '../lib/stops'
import { timeFor, ifSet, isSet, stringFor, isEmpty } from '../lib/utils'
import Roles from './Roles'
import TypeSelect from './TypeSelect'

export const NodeSettings = ({
  open, closeNodeSettings, node,
  replaceNode, ...props
}) => {
  const { partition, children, raw } = node
  const initialRef = useRef()
  const [title, setTitle] = useState(node.title)
  const [body, setBody] = useState(node.body)
  const [startOffset, baseStartOffset] = (
    useState(raw.startOffset ?? '')
  )
  const [duration, baseDuration] = (
    useState(raw.duration ?? '')
  )
  const [roles, setRoles] = (
    useState(node.raw.roles ?? {})
  )
  const [create, setCreate] = useState([])
  const [type, setType] = (
    useState(node.raw.type ?? '')
  )
  const defaultEnd = (
    timeFor(ifSet(startOffset) ?? node.startOffset)
    + timeFor(ifSet(duration) ?? node.duration)
  )
  const [endOffset, baseEndOffset] = (
    useState(
      (isSet(startOffset) && isSet(duration)) ? (
        stringFor(defaultEnd)
      ) : (
        ''
      )
    )
  )

  const onClose = () => {
    delete node.new
    delete node.raw.new
    setTitle((t) => `${t}`)
    closeNodeSettings()
  }

  const setStartOffset = (str) => {
    str = onlyTime({ setter: baseStartOffset })(str)
    const start = (
      timeFor(ifSet(str) ?? node.startOffset)
    )
    if(isSet(endOffset)) {
      const end = timeFor(endOffset)
      setDuration(
        stringFor(end - start),
        { sync: false },
      )
    } else if(isSet(duration)) {
      const length = timeFor(duration)
      setEndOffset(
        stringFor(start + length),
        { sync: false },
      )
    }
  }
  const setDuration = (str, { sync = true } = {}) => {
    str = onlyTime({ setter: baseDuration })(str)
    if(sync !== false && (isSet(endOffset) || isSet(startOffset))) {
      const start = (
        timeFor(ifSet(startOffset) ?? node.startOffset)
      )
      setEndOffset(
        stringFor(start + timeFor(str)),
        { sync: false },
      )
    }
  }
  const setEndOffset = (str, { sync = true } = {}) => {
    str = onlyTime({ setter: baseEndOffset })(str)
    if(
      sync !== false
      && (isSet(duration) || isSet(startOffset))
    ) {
      const start = (
        timeFor(ifSet(startOffset) ?? node.startOffset)
      )
      const end = timeFor(str)
      setDuration(
        stringFor(end - start),
        { sync: false },
      )
    }
  }
  const replacement = useMemo(() => {
    const fields = {
      title, body, duration, startOffset,
      partition, children, id: node.id,
      roles, type,
    }
    const gen = newNode()
    Object.entries(fields).forEach(
      ([key, value]) => {
        if(isSet(value)) {
          gen[key] = value
        }
      }
    )
    return gen
  }, [
    body, children, duration,
    partition, startOffset, title,
    node.id, roles, create, type,
  ])

  const save = (evt) => {
    evt.preventDefault()

    create.forEach(({ role, event, name, persist }) => {
      replacement.roles ??= {}
      replacement.roles[role] ??= {}
      replacement.roles[role][event] ??= []
      replacement.roles[role][event].push(
        persist ? { name, persist } : name
      )
    })
    Object.entries(replacement.roles).forEach(
      ([role, exec]) => {
        const numEntries = (
          Object.values(exec).map(
            (users) => (
              Array.isArray(users) ? users.length : 0
            )
          )
          .reduce((acc, l) => acc + (l ?? 0), 0)
        )
        if(numEntries === 0) {
          delete replacement.roles[role]
        }
      }
    )
    if(isEmpty(replacement.roles)) {
      delete replacement.roles
    }
    setCreate([])
    replaceNode({ node, replacement })
    onClose()
  }

  if(node.new) {
    open = true
  }

  return (
    <Modal
      size="xl" initialFocusRef={initialRef}
      lockFocusAcrossFrames={true}
      {...{ ...props, onClose }}
      isOpen={open}
    >
      <ModalOverlay/>
      <ModalContent as="form" onSubmit={save}>
        <ModalHeader
          textOverflow="ellipsis"
          overflow="hidden"
          whiteSpace="nowrap"
        >Node: <q>{title}</q></ModalHeader>
        <ModalCloseButton/>
        <ModalBody pb={6}>
          <Tabs isFitted variant="enclosed">
            <TabList mb="1em">
              <Tab>Text</Tab>
              <Tab>Timing</Tab>
              <Tab>Roles</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
              <FormControl mt={4}>
                <FormLabel>Title</FormLabel>
                  <Input
                    autoFocus
                    ref={initialRef} value={title ?? ''}
                    onChange={({ target: { value }}) => {
                      setTitle(value)
                    }}
                  />
                </FormControl>
                <FormControl
                  id={`typeselect-${node.id}`}
                  mt={4}
                >
                  <FormLabel>Type</FormLabel>
                  <TypeSelect
                    {...{ type, setType }}
                    scrollId={
                      `typeselect-${node.id}-label`
                    }
                  />
                </FormControl>
                <FormControl mt={4}>
                  <Tabs isFitted variant="enclosed">
                    <TabList mb="1em">
                      <Tab>Body</Tab>
                      <Tab>Preview</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
                        <Textarea
                          value={body} minH="5em"
                          placeholder="Markdown"
                          onChange={({ target: { value }}) => {
                            setBody(value)
                          }}
                          onKeyPress={(evt) => {
                            if(evt.key === 'Enter' && evt.ctrlKey) {
                              save(evt)
                              onClose()
                            }
                          }}
                        />
                      </TabPanel>
                      <TabPanel>
                        <Markdown>{body}</Markdown>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </FormControl>
              </TabPanel>
              <TabPanel>
                <FormControl>
                  <FormLabel>Start Offset</FormLabel>
                  <Flex>
                    <Input
                      ref={initialRef} value={startOffset}
                      placeholder={
                        'automatic or HH:mm:ss.msms or mm:ss or ssss'
                      }
                      onChange={({ target: { value }}) => (
                        setStartOffset(value)
                      )}
                    />
                    {
                      (
                        isSet(node.defaultStartsOffset)
                        || startOffset === '' && node.startOffset >= 0
                      ) && ((() => {
                        const time = stringFor(
                          ifSet(node.defaultStartsOffset) ?? node.startOffset
                        )
                        return (
                          <Button
                            variant="outline"
                            p={2} ml={2} fontWeight="bold"
                            onClick={() => {
                              setStartOffset(time)
                            }}
                            title={
                              `Autocomplete with ${time}`
                            }
                          >←</Button>
                        )
                      })())
                    }
                  </Flex>
                </FormControl>

                <Flex>
                  <FormControl mt={4}>
                    <FormLabel>End Offset</FormLabel>
                    <Flex>
                      <Input
                        placeholder="automatic"
                        value={endOffset}
                        onChange={({ target: { value }}) => {
                          setEndOffset(value)
                        }}
                      />
                      {
                        endOffset === '' && !!defaultEnd
                        && ((() => {
                          const time = stringFor(defaultEnd.toString())
                          return (
                            <Button
                              variant="outline"
                              p={2} ml={2} fontWeight="bold"
                              onClick={() => {
                                setEndOffset(time)
                              }}
                              title={
                                `Autocomplete with ${time}`
                              }
                            >←</Button>
                          )
                        })())
                      }
                    </Flex>
                  </FormControl>
                  <Text alignSelf="end" mb={2} mx={2}>or</Text>
                  <FormControl mt={4}>
                    <FormLabel>Duration</FormLabel>
                    <Flex>
                      <Input
                        placeholder="automatic"
                        value={duration}
                        onChange={({ target: { value }}) => (
                          setDuration(value)
                        )}
                      />
                      {
                        !isSet(duration) && isSet(node.duration)
                        && ((() => {
                          const time = stringFor(node.duration.toString())
                          return (
                            <Button
                              variant="outline"
                              p={2} ml={2} fontWeight="bold"
                              onClick={() => {
                                setDuration(time)
                              }}
                              title={
                                `Autocomplete with ${time}`
                              }
                            >←</Button>
                          )
                        })())
                      }
                    </Flex>
                  </FormControl>
                </Flex>
              </TabPanel>
              <TabPanel>
                <FormControl mt={4}>
                  <Roles
                    title="Entrances"
                    {...{
                      node, event: 'enter',
                      roles, setRoles,
                      create, setCreate,
                    }}
                  />
                </FormControl>
                <FormControl mt={4}>
                  <Roles
                    title="Exits"
                    {...{
                      node, event: 'exit',
                      roles, setRoles,
                      create, setCreate,
                    }}
                  />
                </FormControl>
                <FormControl mt={4}>
                  <Roles
                    title="Inherited"
                    editable={false}
                    {...{
                      node, roles, setRoles,
                      create, setCreate,
                    }}
                  />
                </FormControl>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="red"
            onClick={closeNodeSettings}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            colorScheme="blue" ml={3}
          >Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default NodeSettings