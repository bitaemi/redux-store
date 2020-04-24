<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Instructions](#instructions)
- [Caveats](#caveats)
- [Steps:](#steps)
  - [1. Start with simple REDUX implementation](#1-start-with-simple-redux-implementation)
    - [1.1. Create the Store](#11-create-the-store)
    - [1.2. Combine reducers](#12-combine-reducers)
    - [1.3. Apply MiddleWare](#13-apply-middleware)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

`index.js` contains our tiny-redux implementation (not meant for production use)

## Instructions
With node, you can run `node index.js`

In the browser, you could just paste the code into the console.

## Caveats
- createStore(), combineReducers(), applyMiddleware() appear to work according to the API.

## Steps:
 
### 1. Start with simple REDUX implementation

#### 1.1. Create the Store
```JavaScript

var defaultAppleState = 0;
function apple(state = defaultAppleState, action) {
    if (action.type === 'INCREMENT') {
        return state + 1;
    }
    return state;
}

var store = createStore(apple);

var unsub = store.subscribe(function() {
    console.log('STATE UPDATED', store.getState());
});

console.log('state:before', store.getState());
store.dispatch({type: 'INCREMENT'});
console.log('state:after', store.getState());

unsub();
store.dispatch({type: 'INCREMENT'});

function createStore(reducer) {
    return {
        getState: function() {};
        dispatch: function() {
            //call the reducer=pure fn= return some value dependent only on its params
            //call the subscribed fns
        };
        subscribe: function() {
            // call functions when dispatch is called
            // returns an unsubscribe function
        }
    }
}
```
- for  the subscribe we pass in a callback function that is called every time the state is updated; add that function to an array of subscription; after that unsubscribe from this fn subscription(remove listener fn)

```JavaScript
 subscribe: function (fn) {
      // subscribe the fn
      subscriptions.push(fn);
      // returns an unsubscribe function
      return function unsubscribe() {
        // find listener fn in sub array and remove it
        var index = subscriptions.indexOf(fn);
        subscriptions.splice(index, 1);
      }
    }
```
- now, that we have the subscribe functionality, we can finish the dispatch (sending the action) functionality:

```JavaScript
 dispatch: function (action) {
      // update the state appling the reducer
      state = reducer(state, action);
      // call the subscribed fns
      subscriptions.forEach(function (fn) {
        fn();
      })

      return action;
    },
```

Now the problem is that we create the store and immediatly call ```store.getState()``` but at this point, ``state`` is still undefined. The fix is to return the store object after calling dispatch once, in the  createStore() method.

```JavaScript
function createStore(reducer) {
    // ...

    obj =  {
        getState: function() {},
        dispatch: function() {
            // ...call the reducer=pure fn= return some value dependent only on its params
            // ...call the subscribed fns
        },
        subscribe: function() {
            // ...call functions when dispatch is called
            // ...returns an unsubscribe function
        }
    }

    obj.dispatch({type: 'REDUX_INIT'});
    return obj;

}
```

#### 1.2. Combine reducers

Add a new orange() reducer with its default state: defaultOrangeState.
After that, instead of passing that one apple() reducer to the createStore(), we pass a rootReducer in which we combine reducers:

```JavaScript
var rootReducer = combineReducers({
    apple: apple,
    orange: orange
});

var store = createStore(rootReducer);
```
Basically, the combineReducers:
- takes as param  <i>one object which reflets the shape of the state tree</i>;
- traverses the object, appling for each property its corresponding reducer;
- returns the resulting state of the object only after appling all reducers;

```JavaScript
function combineReducers(stateTree) {
    // get the list of all properties of the state tree
  var keys = Object.keys(stateTree);

  return function rootReducer(state = {}, action) {
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var reducer = stateTree[key];
      var subState = state[key];

      state[key] = reducer(subState, action);
    }

    return state;
  }
}
```

#### 1.3. Apply MiddleWare

the createStore() receives another param:
```JavaScript
var store = createStore(
    rootReducer,
    applyMiddleware(logger));
``` 
where the logger middleware is defined as :

```JavaScript
function logger(store) {

  var getState = store.getState;

  return function (next) {

    return function (action) {
      console.log('will dispatch', action);

      // Call the next dispatch method in the middleware chain.
      var returnValue = next(action);

      console.log('state after dispatch', getState());

      // This will likely be the action itself, unless
      // a middleware further in chain changed it.
      return returnValue;
    };
  };
}
```
and the applyMiddleware function that:
-  returns a function getting as param createStore, that returned function when called, returns another function;
-  the inner returned function creates a store, modifies dispatch so that it will call the middleware and returns the store with that modified dispatch

```JavaScript
function applyMiddleware(...fns) {
  // destructuring assignment or reducer used as param in function definition, takes all params passed and makes an array named fns 
  return function (createStore) {

    return function (reducer) {
      var store = createStore(reducer);
      var oldDispatch = store.dispatch;

      // modify dispatch
      store.dispatch = fns.reduceRight(function (prev, curr) {
        return curr(store)(prev); // ie: dispatch = logger(store)(oldDispatch)
      }, oldDispatch)

      return store;
    }
  }

}
```
- after you run `node index.js` you'll get:

```shell
state:before { apple: 0, orange: 10 }
will dispatch { type: 'INCREMENT' }
STATE UPDATED { apple: 1, orange: 10 }
state after dispatch { apple: 1, orange: 10 }
state:after { apple: 1, orange: 10 }
will dispatch { type: 'INCREMENT' }
state after dispatch { apple: 2, orange: 10 }

```

