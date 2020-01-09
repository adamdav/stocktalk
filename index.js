import curry from 'lodash.curry'
import throttle from 'lodash.throttle'
import React from 'react'
import ReactDOM from 'react-dom'
import stocktwits from './stocktwits.svg'

const BASE_URL = 'https://v61drjipwi.execute-api.us-east-1.amazonaws.com/dev'

const el = curry(React.createElement)

const a = el('a')
const b = el('b')
const blockquote = el('blockquote')
const br = el('br')
const button = el('button')
const datalist = el('datalist')
const div = el('div')
const form = el('form')
const footer = el('footer')
const fragment = el(React.Fragment, null)
const header = el('header')
const i = el('i')
const img = el('img')
const input = el('input')
const li = el('li')
const main = el('main')
const option = el('option')
const span = el('span')
const ul = el('ul')

function App() {
  const safeFetch = throttle(
    async function(url) {
      try {
        return (await (await fetch(url)).json())
      } catch (error) {
        console.error(error)
        return []
      }
    },
    1000,
    {
      leading: true,
      trailing: false
    }
  )

  const [state, dispatch] = React.useReducer(
    (state, action) => ({ ...state, ...action }),
    {
      isGettingResults: false,
      isGettingSuggestions: false,
      queryInput: '',
      queries: [],
      results: [],
      showSuggestions: false,
      suggestions: [],
      suggestionIndex: 0
    }
  )

  React.useEffect(() => {
    let didCancel = false

    if (state.isGettingResults) {
      const messagesUrl = `${BASE_URL}/messages?${state.queries.map(({ symbol }) => `q=${encodeURIComponent(symbol)}`).join('&')}`

      safeFetch(messagesUrl).then(({ messages }) => {
        if (didCancel) return

        dispatch({
          results: messages,
          isGettingResults: false
        })
      })
    }
      

    if (state.isGettingSuggestions) {
      const symbolsUrl = `${BASE_URL}/symbols?q=${/\w/.test(state.queryInput) ? encodeURIComponent(state.queryInput) : 'a'}` 

      safeFetch(symbolsUrl).then(({ symbols }) => {
        if (didCancel) return
        
        dispatch({
          suggestions: symbols,
          isGettingSuggestions: false
        })
      }) 
    }

    return () => {
      didCancel = true
    }
  }, [state.isGettingResults, state.isGettingSuggestions])

  console.log(state)

  const { isGettingResults = false, isGettingSuggestions = false, queryInput = '', queries = [], results = [], showSuggestions = false, suggestions = [], suggestionIndex = 0 } = state

  return (
    div(
      { 
        className: `text-gray-700 h-screen flex flex-col justify-between pt-24 ${isGettingResults ? 'skeleton' : ''}`,
        onClick: event => dispatch({ showSuggestions: false })
      },
      header({ className: 'bg-white p-4 shadow-md fixed left-0 top-0 right-0 opacity-100 z-10 flex items-center' },
        a({ className: 'inline-flex items-center' },
          i({ className: 'fas fa-comment-dollar fa-3x text-blue-500' }, null),
          span({ className: 'text-3xl ml-1 hidden sm:block' }, 'stocktalk'),
        ),
        form({
          className: 'relative bg-gray-200 shadow-inner w-full ml-2 pl-10 pr-4 py-2 rounded-xl',
          onClick: event => event.stopPropagation(),
          onSubmit: event => {
            event.preventDefault()

            dispatch({
              queryInput: '',
              queries: [...new Set([...queries, suggestions[suggestionIndex]])],
              suggestionIndex: 0,
              isGettingResults: true,
              showSuggestions: false
            })
          }
        },
          i({ className: 'fas fa-search absolute left-0 top-0 mt-3 ml-4' }, null),
          ...queries.map(({ symbol }) => symbol),
          input({
            className: 'outline-none bg-transparent',
            id: 'search',
            name: 'search',
            list: 'suggestions',
            // placeholder: 'Search stocks and cryptos',
            value: queryInput,
            onKeyDown: event => {
              switch (event.key) {
                case 'ArrowUp':
                  if (suggestionIndex > 0) dispatch({ suggestionIndex: suggestionIndex - 1 })
                  break
                case 'ArrowDown':
                  if (suggestionIndex < 4) dispatch({ suggestionIndex: suggestionIndex + 1 })
                  break
                default:
                  return
              }
            },
            onFocus: event => {
              dispatch({ showSuggestions: true, isGettingSuggestions: true })
            },
            // onBlur: event => {
            //   dispatch({ showSuggestions: false })
            // },
            onChange: event => {
              dispatch({ queryInput: event.target.value, isGettingSuggestions: true })
            }
          },
          null),
          ul({ id: 'suggestions', className: `absolute left-0 overflow-hidden rounded-xl shadow-lg bg-white w-full ${showSuggestions ? '' : 'hidden'}` },
            isGettingSuggestions
            ?
            fragment(
              null,
              li({ className: 'h-20 skeleton' }, null),
              li({ className: 'h-20 skeleton' }, null),
              li({ className: 'h-20 skeleton' }, null),
              li({ className: 'h-20 skeleton' }, null),
              li({ className: 'h-20 skeleton' }, null),
            )
            
            :
            suggestions.slice(0,5).map(({ id, title, symbol }, i) =>
              li(
                { key: id },
                button({
                  className: `p-4 w-full text-left cursor-pointer hover:shadow-inner ${i === suggestionIndex ? 'bg-gray-200' : ''}`,
                  onMouseEnter: () => {
                    dispatch({
                      suggestionIndex: i
                    })
                  },
                  onClick: (event) => {
                    event.stopPropagation()
                    dispatch({
                      queryInput: '',
                      queries: [...new Set([...queries, suggestions[suggestionIndex]])],
                      suggestionIndex: 0,
                      isGettingResults: true,
                      showSuggestions: false
                    })
                  }
                },
                  b(null, symbol),
                  br(null, null),
                  title
                )
              )
            )
          )
        ),
      ),
      main({ className: 'px-4' },
        ul(null,
          results.map(({ id, user, body, created_at }) =>
            li({ key: id, className: 'bg-white rounded-xl p-4 mb-6 flex flex-col relative z-0 shadow' },
              span({ className: 'inline-flex items-center mb-2' },
              // border-solid border border-gray-200
                img({ className: ' rounded-full h-12 w-12', src: user.avatar_url }, null),
                b({ className: 'mx-1' }, user.username)),
              blockquote({ className: 'mb-2 break-words' }, body),
              created_at)))
      ),
      footer({ className: 'text-gray-500 p-4 flex justify-center items-baseline' },
        "Powered by",
        a({ className: 'ml-2', href: 'https://stocktwits.com/' },
          img({ className: 'h-5 grayscale', src: stocktwits, alt: 'Stocktwits' }, null))
      )
    )
  )
}

ReactDOM.render(
  React.createElement(App),
  document.getElementById('root')
)