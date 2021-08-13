import View from 'View'
import New from 'New'
import ListAvailable from 'ListAvailable'
import {
  HashRouter as Router, Switch, Route,
} from 'react-router-dom'

export default () => (
  <Router>
    <Switch>
      <Route exact path="/new" component={New}/>
      <Route exact path="/" component={ListAvailable}/>
      <Route path="/" component={View}/>
    </Switch>
  </Router>
)