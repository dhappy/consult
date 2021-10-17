import {
  HashRouter as Router, Switch, Route,
} from 'react-router-dom'
import Access from './Access'
import New from './New'
import View from './View'
import ListAvailable from './ListAvailable'

export default () => (
  <Router>
    <Switch>
      <Route exact path="/new" component={New}/>
      <Route exact path="/access" component={Access}/>
      <Route path="/" component={View}/>
      <Route exact path="/" component={ListAvailable}/>
    </Switch>
  </Router>
)