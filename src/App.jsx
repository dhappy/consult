import {
  HashRouter as Router, Switch, Route,
} from 'react-router-dom'
import Publish from './Publish'
import New from './New'
import View from './View'
import ListAvailable from './ListAvailable'

export default () => (
  <Router>
    <Switch>
      <Route exact path="/new" component={New}/>
      <Route path="/publish" component={Publish}/>
      <Route path="/" component={View}/>
      <Route exact path="/" component={ListAvailable}/>
    </Switch>
  </Router>
)