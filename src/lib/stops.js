// @ts-check

import { v4 as uuid } from 'uuid'
import { timeFor, isSet } from './utils'

export const newNode = (obj = {}) => (
  Object.assign(
    { id: uuid(), children: [], partition: false },
    obj,
  )
)

export const visit = ({ node, method, extra }) => {
  return method.apply(
    node, [{ node, extra, visit }]
  )
}

export const siblingsOf = (node) => {
  const {
    parent: { children: siblings } = (
      { children: null }
    )
  } = node
  return !node?.parent ? [node] : siblings
}

export const connect = ({ stops }) => {
  const parent = ({
    node, visit,
  }) => {
    const { children = [] } = node

    node.children = children.map((child) => {
      child = visit({
        node: newNode(child), method: parent
      })
      child.parent = node
      return child
    })
    return node
  }

  if(Array.isArray(stops)) {
    stops = { children: stops }
  }
  return visit({
    node: newNode(stops), method: parent,
  })
}

export const clone = (stops) => connect({ stops })

export const append = (array, ...entries) => (
  (array ?? []).concat(entries.flat())
)

export const findById = (root, id) => {
  if(root?.id === id) {
    return root
  }
  for(const child of (root?.children ?? [])) {
    const result = findById(child, id)
    if(result) {
      return result
    }
  }
}

export const interpolate = ({ root, duration, raw, toast }) => {
  const fix = ({
    node,
    extra: { roles: incomingRoles = {} } = {},
    visit,
  }) => {
    node.raw = findById(raw, node.id)

    const { children = [] } = node

    children.forEach((child) => {
      ['duration', 'startOffset'].forEach((attr) => {
        if(typeof child[attr] === 'string') {
          child[attr] = timeFor(child[attr])
        }
      })
    })

    const siblings = siblingsOf(node)
    let index = siblings.indexOf(node)
    const { parent } = node

    if(isSet(node.startOffset)) {
      if(
        index === 0
        && node.startOffset > parent.startOffset
      ) {
        siblings.splice(
          0, 0,
          {
            startOffset: parent.startOffset,
            duration: node.startOffset - parent.startOffset,
          }
        )
        index++
      } else if(
        index > 0
        && node.startOffset > siblings[index - 1].startOffset
      ) {
        const space = {
          startOffset: siblings[index - 1].startOffset,
          duration: node.startOffset - siblings[index - 1].startOffset,
        }
        siblings.splice(index - 1, 0, space)
        index++
      }
      console.info({ parent, siblings })
    }

    if(
      !isSet(node.startOffset)
      || isNaN(node.startOffset)
    ) {
      if(parent?.partition) {
        if(index === 0) {
          node.startOffset = parent.startOffset
        } else if(
          index >= 1
          && index <= siblings.length - 1
        ) {
          node.startOffset = (
            siblings[index - 1].startOffset
            + siblings[index - 1].duration
          )
        } else {
          console.warn(
            'Bad Index',
            { index, node, siblings },
          )
        }
      } else if(parent) {
        node.startOffset = parent.startOffset
      } else {
        node.startOffset = 0
      }
    }

    if(
      !isSet(node.duration)
      || isNaN(node.duration)
    ) {
      if(parent?.partition) {
        if(index >= 0 && index < siblings.length - 1) {
          const start = index
          let end = start + 1
          while(
            end < siblings.length
            && !isSet(siblings[end].startOffset)
          ) {
            end++
          }
          const total = (
            (end === siblings.length ? (
              parent.startOffset + parent.duration
            ) : (
              siblings[end].startOffset
            ))
            - siblings[start].startOffset
          )
          for(let i = start; i < end; i++) {
            siblings[i].duration = (
              total / (end - start)
            )
          }
        } else if(index === siblings.length - 1) {
          const {
            startOffset: pStart, duration: pDur
          } = parent
          node.duration = (
            (pStart + pDur) - node.startOffset
          )
        } else {
          console.warn(
            'Bad Index',
            { index, node, siblings },
          )
        }
      } else if(parent) {
        node.duration = parent.duration
      } else {
        node.duration = duration
      }
    }
  
    if(!isSet(node.startOffset)) {
      toast({
        title: 'Incalcuable Interpolation',
        description: `No Starting Time: ${node.id}`,
        status: 'error',
        duration: 12000,
        isClosable: true,
      })
    }
    if(!isSet(node.duration)) {
      toast({
        title: 'Incalcuable Interpolation',
        description: `No Event Duration: ${node.id}`,
        status: 'error',
        duration: 12000,
        isClosable: true,
      })
    }

    const roles = { ...incomingRoles }

    Object.entries(node.roles ?? {})
    .forEach(([role, exec]) => {
      Object.entries(exec)
      .forEach(([action, users]) => {
        switch(action) {
          case 'enter':
            roles[role] = (
              append(roles[role], ...users)
            )
            if(exec.persist === true) {
              incomingRoles[role] = (
                append(incomingRoles[role], ...users)
              )
            } else {
              users.forEach((userOrObj) => {
                if(userOrObj.persist) {
                  incomingRoles[role] = append(
                    incomingRoles[role], userOrObj
                  )
                }
              })
            }
            incomingRoles[role] = (
              (incomingRoles[role] ?? []).filter(
                (u) => u.persist !== false
              )
            )
          break
          case 'exit':
            users.forEach((user) => {
              incomingRoles[role]?.splice(
                incomingRoles[role].indexOf(user),
                1,
              )
            })
          break
          case 'persist': break
          default:
            toast({
              title: 'Role Actions Error',
              description: `Unknown Role Action: "${action}"`,
              status: 'error',
              duration: 12000,
              isClosable: true,
            })
          break
        }
      })
    })

    node.roles = { ...roles }

    node.children = children.map((child) => (
      visit({
        node: child, method: fix, extra: { roles }
      })
    ))

    return node
  }

  return visit({ node: clone(root), method: fix })
}
