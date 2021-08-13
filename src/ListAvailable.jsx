import { Link } from 'react-router-dom'
import { ListItem, UnorderedList } from "@chakra-ui/react";

export default () => (
  <UnorderedList>
    {
      [
        'w/MetaGame’s Builders/on/1442/12/25/@/1/27/‒/1/77/',
        'w/Raid Guild/on/0/♈/15/@/9/13/‒/9/52/',
      ]
      .map((url, idx) => (
        <ListItem key={idx}><Link to={url}>
          {url}
        </Link></ListItem>
      ))
    }
  </UnorderedList>
)