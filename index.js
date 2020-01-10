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
const div = el('div')
const em = el('em')
const footer = el('footer')
const fragment = el(React.Fragment)
const header = el('header')
const i = el('i')
const img = el('img')
const input = el('input')
const li = el('li')
const main = el('main')
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
      showSplash: true,
      showSuggestions: false,
      suggestions: [],
      suggestionIndex: 0
    }
  )

  React.useEffect(() => {
    const timeoutId = setTimeout(() => dispatch({ showSplash: false }), 3000)

    return () => {
      clearTimeout(timeoutId)
    }
  })

  React.useEffect(() => {
    let didCancel = false

    if (state.isGettingResults) {
      if (state.queries.length === 0) {
        dispatch({ results: [], isGettingResults: false })
        return
      }
      
      const messagesUrl = `${BASE_URL}/messages?${state.queries.map(q => `q=${encodeURIComponent(q)}`).join('&')}`

      console.log("Fetching results")
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
          suggestions: symbols.filter(({ symbol }) => !state.queries.includes(symbol)),
          isGettingSuggestions: false
        })
      }) 
    }

    return () => {
      didCancel = true
    }
  }, [state])

  React.useEffect(() => {
    if (queries.length === 0) return

    const timeoutId = setTimeout(
      () => {
        dispatch({ isGettingResults: true })
      },
      20000
    )

    return () => {
      clearTimeout(timeoutId)
    }
  })

  const { isGettingResults = false, isGettingSuggestions = false, queryInput = '', queries = [], results = [], showSplash = true, showSuggestions = false, suggestions = [], suggestionIndex = 0 } = state
  
  if (showSplash) {
    return div(
      { className: 'h-screen flex flex-col justify-center items-center shimmer-blue z-0' },
      a({ className: 'inline-flex items-center text-display text-gray-100 text-5xl mb-8 z-0' },
        i({ className: 'fas fa-comment-dollar' }, null),
        span({ className: 'ml-1' }, 'stocktalk'),
      ),
      footer(
        { className: 'p-4 fixed bottom-0 z-0 w-full flex justify-center' },
        span(
          { className: 'inline-flex items-baseline text-gray-300 z-10' },
          "Powered by",
          a(
            { className: 'ml-2', href: 'https://stocktwits.com/' },
            img(
              { className: 'h-5 grayscale-invert opacity-75', src: stocktwits, alt: 'Stocktwits' },
              null
            )
          )
        )
      )
    )
  }
  
  return (
    div(
      { 
        className: 'text-gray-700 flex flex-col justify-between',
        onClick: event => dispatch({ showSuggestions: false })
      },
      header(
        { className: 'bg-gray-100 p-4 shadow-md fixed left-0 top-0 right-0 opacity-100 z-20 flex flex-col items-start' },
        div(
          {
            className: 'relative w-full',
            onClick: event => event.stopPropagation()
          },
          i({ className: 'fas fa-search absolute left-0 top-0 mt-3 ml-4' }, null),
          input(
            {
              className: `border-1 border-2 border-blue-600 outline-none pl-10 pr-4 py-2 mb-2 w-full rounded-t-xl rounded-b-xl ${showSuggestions ? 'rounded-b-none shadow-lg bg-gray-100' : 'shadow-inner bg-gray-200 hover:bg-gray-100 hover:shadow-lg' }`,
              id: 'search',
              name: 'search',
              type: 'text',
              placeholder: 'Search stocks and cryptos',
              value: queryInput,
              onKeyDown: event => {
                switch (event.key) {
                  case 'ArrowUp':
                    if (suggestionIndex > 0) dispatch({ suggestionIndex: suggestionIndex - 1 })
                    break
                  case 'ArrowDown':
                    if (suggestionIndex < 4) dispatch({ suggestionIndex: suggestionIndex + 1 })
                    break
                  case 'Enter':
                    dispatch({
                      queryInput: '',
                      queries: [...new Set([...queries, suggestions[suggestionIndex].symbol])],
                      suggestionIndex: 0,
                      isGettingResults: true,
                      showSuggestions: false
                    })
                    break
                  default:
                    return
                }
              },
              onFocus: _ => {
                dispatch({ showSuggestions: true, isGettingSuggestions: true })
              },
              onChange: event => {
                dispatch({ queryInput: event.target.value, isGettingSuggestions: true })
              },
            },
            null
          ),
          ul(
            { id: 'suggestions', className: `border-l-2 border-r-2 border-b-2 border-solid border-blue-600 absolute left-0 top-0 mt-10 overflow-hidden rounded-b-xl shadow-lg bg-gray-100 w-full ${showSuggestions ? '' : 'hidden'}` },
            isGettingSuggestions
            ?
            fragment(
              null,
              li({ className: 'h-16 shimmer' }, null),
              li({ className: 'h-16 shimmer' }, null),
              li({ className: 'h-16 shimmer' }, null),
              li({ className: 'h-16 shimmer' }, null),
              li({ className: 'h-16 shimmer' }, null),
            )
            :
            suggestions.slice(0,5).map(({ id, title, symbol }, i) =>
              li(
                { key: id },
                button(
                  {
                    className: `px-4 py-2 w-full text-left cursor-pointer hover:text-blue-600 ${i === suggestionIndex ? 'bg-gray-200' : ''}`,
                    onMouseEnter: () => {
                      dispatch({
                        suggestionIndex: i
                      })
                    },
                    onClick: (event) => {
                      event.stopPropagation()
                      const data = {
                        queryInput: '',
                        queries: [...new Set([...queries, symbol])],
                        suggestionIndex: 0,
                        isGettingResults: true,
                        showSuggestions: false
                      }

                      dispatch(data)
                    }
                  },
                  b(null, symbol),
                  br(null, null),
                  title
                )
              )
            )
          ),
        ),
        ul(
          { className: 'inline-flex' },
          queries.map((q) =>
            li(
              {
                key: q,
                className: 'px-2 py-1 mr-2 rounded-xl bg-blue-600 text-blue-100 lightest-blue text-sm'
              },
              span(null, q),
              button(
                {
                  onClick: _ =>
                    dispatch({
                      queries: queries.filter(q2 => q2 !== q),
                      isGettingResults: true
                    })
                },
                i(
                  { className: 'fas fa-times-circle ml-1 hover:opacity-50' },
                  null
                )
              )
            )
          ),
        )
      ),
      main({ className: `px-4 pt-32 pb-16 min-h-screen ${isGettingResults ? 'shimmer' : ''}` },
        ul(null,
          results.map(({ id, user, body, created_at }) =>
            li({ key: id, className: 'bg-gray-100 rounded-xl p-4 mb-6 flex flex-col relative z-10 shadow' },
              span(
                { className: 'inline-flex items-center mb-2' },
                img(
                  { className: 'border-solid border border-gray-200 rounded-full h-12 w-12', src: user.avatar_url },
                  null
                ),
                b({ className: 'ml-2' }, user.username)
              ),
                blockquote({ className: 'mb-2 break-words' }, body),
                em(null, new Date(created_at).toUTCString())
              )
            )
          )
      ),
      footer(
        { className: 'p-4 fixed bottom-0 z-0 w-full flex justify-center' },
        span(
          { className: 'inline-flex items-baseline text-gray-600 z-10' },
          "Powered by",
          a(
            { className: 'ml-2', href: 'https://stocktwits.com/' },
            img(
              { className: 'h-5 grayscale opacity-75', src: stocktwits, alt: 'Stocktwits' },
              null
            )
          )
        )
      )
    )
  )
}

ReactDOM.render(
  React.createElement(App),
  document.getElementById('root')
)