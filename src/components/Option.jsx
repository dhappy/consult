// @ts-check

import { Button } from '@chakra-ui/react'

export const Option = ({ children, onClick, ...props }) => {
  const clicked = (evt) => {
    evt.stopPropagation()
    onClick(evt)
  }
  return (
    <Button
      {...props}
      fontWeight="normal" variant="outline" mt={1.25}
      fontSize={15} p={1} _hover={{ bg: '#00000077' }}
      onClick={onClick ? clicked : null}
    >{children}</Button>
  )
}

export default Option