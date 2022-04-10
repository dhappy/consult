// @ts-check

import { Flex, Button, Heading, Grid, GridItem, Input, Checkbox } from '@chakra-ui/react'
import { isEmpty } from '../lib/utils'
import React, { useMemo } from 'react'

export const Roles = ({
  title, event, editable = true,
  roles, setRoles, create, setCreate,
}) => {
  const changed = ({ persist, targetUser, role }) => {
    setRoles((roles) => {
      const entry = roles[role]
      const processed = (
        [...(entry[event] ?? [])].map((userOrObj) => {
          const name = (
            userOrObj.name ?? userOrObj
          )
          if(name === targetUser) {
            if(persist || entry.persist) {
              return { name, persist }
            }
            return name
          }
          if(
            entry.persist
            && userOrObj.persist !== false
          ) {
            return { name, persist: true }
          }
          return userOrObj
        })
      )
      return {
        ...roles,
        [role]: {
          ...entry,
          [event]: processed,
        },
      }
    })
  }

  const remove = ({ user, role, event }) => {
    setRoles((roles) => {
      const processed = (
        [...(roles[role][event] ?? [])]
        .filter((u) => (
          u.name !== user && u !== user
        ))
      )
      return {
        ...roles,
        [role]: {
          ...roles[role],
          [event]: processed,
        },
      }
    })
  }

  const add = () => {
    setCreate((old) => [
      ...old,
      {
        role: '', event,
        name: '', persist: false,
      }
    ])
  }

  if(isEmpty(roles ?? {})) {
    roles = { holder: [] }
  }

  const roleList = useMemo(() => {
    const evented = {}
    Object.entries(roles).forEach(
      ([role, events]) => {
        if(events[event] && !isEmpty(events[event])) {
          evented[role] = events[event]
        }
      }
    )
    return evented
  }, [roles, event])

  const creates = useMemo(() => (
    create.filter((entry) => (
      entry.event === event
    ))
  ), [create, event])
  
  const templateColumns = (
    !editable ? '1fr 1fr' : (
      event === 'exit'
      ? '2fr 1fr 1fr' : '2fr 2fr 1fr 1fr'
    )
  )

  return (
    <>
      <Flex>
        {editable && (
          <Button
            h="auto" minW="auto" mr={2}
            onClick={add}
          >+</Button>
        )}
        {title && (
          <Heading
            fontSize={24}
            _after={{ content: '":"' }}
          >{title}</Heading>
        )}
      </Flex>
      <Grid
        {...{ templateColumns }}
        sx={{ '& > *': {
          border: '1px solid',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        } }}
      >
        <GridItem fontWeight="bold">Role</GridItem>
        <GridItem fontWeight="bold">User</GridItem>
        {editable && (
          <>
            {event !== 'exit' && (
              <GridItem
                fontWeight="bold" fontStyle="italic"
                title="Role will appear in following siblings as well as, like all nodes, children."
              >Persist</GridItem>
            )}
            <GridItem
              fontWeight="bold" fontStyle="italic"
            >Remove</GridItem>
          </>
        )}
        {isEmpty(roleList) && isEmpty(creates) ? (
          <GridItem
            colSpan={editable ? (
              event === 'exit' ? 3 : 4
            ) : (
              2
            )}
          >
            <em>No Entries</em>
          </GridItem>
        ) : (
          Object.entries(roleList).map(
            ([role, holders], idx) => (
              <RoleItems
                key={idx}
                {...{
                  event, role, holders,
                  remove, changed, editable,
                }}
              />
            )
          )
        )}
        {creates.map((entry, idx) => (
          <RoleInputs
            key={idx}
            {...{ entry, idx, event, setCreate }}
          />
        ))}
      </Grid>
    </>
  )
}

export const RoleInputs = ({
  entry, idx, event, setCreate,
}) => (
  <React.Fragment>
    <GridItem>
      <Input
        value={entry.role} autoFocus
        textAlign="center"
        onChange={({ target: { value } }) => {
          setCreate((old) => [
            ...old.slice(0, idx),
            { ...entry, role: value },
            ...old.slice(idx + 1),
          ])
        }}
      />
    </GridItem>
    <GridItem>
      <Input
        value={entry.name}
        textAlign="center"
        onChange={({ target: { value } }) => {
          setCreate((old) => [
            ...old.slice(0, idx),
            { ...entry, name: value },
            ...old.slice(idx + 1),
          ])
        }}
      />
    </GridItem>
    {event !== 'exit' && (
      <GridItem>
        <Checkbox
          isChecked={entry.persist}
          onChange={({ target: { checked } }) => {
            setCreate((old) => [
              ...old.slice(0, idx),
              { ...entry, persist: checked },
              ...old.slice(idx + 1),
            ])
          }}
        />
      </GridItem>
    )}
    <GridItem>
      <Button
        h="auto"
        onClick={() => {
          setCreate((old) => [
            ...old.slice(0, idx),
            ...old.slice(idx + 1),
          ])
        }}
      >−</Button>
    </GridItem>
  </React.Fragment>
)

export const RoleItems = ({
  event, role, holders = [], persist = false,
  remove, changed,
}) => (
  <React.Fragment>
    <GridItem
      rowSpan={holders.length}
    >{role}</GridItem>
    {(holders).map((userOrObj, idx) => {
      const username = userOrObj.name ?? userOrObj
      return (
        <React.Fragment key={idx}>
          <GridItem>{username}</GridItem>
          {event !== 'exit' && (
            <GridItem>
              <Checkbox
                w={3} h={3} p={0}
                value={username}
                isChecked={
                  userOrObj.persist ?? persist
                }
                onChange={({ target: {
                  checked: persist, value: targetUser,
                } }) => {
                  changed({
                    persist, targetUser, role,
                  })
                }}
              />
            </GridItem>
          )}
          <GridItem>
            <Button
              h="auto" value={username}
              onClick={({
                target: { value: user }
              }) => {
                remove({ user, role, event })
              }}
            >−</Button>
          </GridItem>
        </React.Fragment>
      )
    })}
  </React.Fragment>
)

export default Roles