import { Checkbox, CheckboxGroup, Flex, Tag, Wrap } from "@chakra-ui/react"
import { propsFor } from 'utils'

export default ({ allTags, activeTags, setActiveTags }) => {
  if(allTags.length === 0) return null

  return (
    <CheckboxGroup
      colorScheme="green"
    >
      <Flex>
        <Checkbox
          px={8}
          onChange={(evt) => (
            setActiveTags(
              Object.fromEntries(
                allTags.map((tag) => (
                  [tag, evt.target.checked]
                ))
              )
            )
          )}
        />
        <Wrap>
          {allTags.map((t, i) => {
            const changed = (evt) => (
              setActiveTags((ts) => ({
                ...ts,
                [t]: evt.target.checked,
              }))
            )
            return (
              <Tag key={i} border="2px solid #00000066" {...propsFor(t)}>
                <Checkbox key={i} isChecked={activeTags[t]} onChange={changed}>
                  {t}
                </Checkbox>
              </Tag>
            )
          })}
        </Wrap>
      </Flex>
    </CheckboxGroup>
  )
}