'use strict';

const https = require('https')

module.exports.messages = async event => {
  // const { multiValueQueryStringParameters = { q: [] } } = JSON.parse(event)
  console.log(event)

  const responses = (await Promise.all(
      event
        .multiValueQueryStringParameters
        .q
        .map(async q => {
          try {
            const { messages } = await new Promise((resolve, reject) => {
              const chunks = []

              https
                .get(`https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(q)}.json`, response => {
                  response.on('data', chunk => chunks.push(chunk))
                  response.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))))
                })
                .on('error', reject)
            })

            // JSON.parse(response)

            console.log(messages)
            return messages
            // const { messages } = await fetch(`https://api.stocktwits.com/api/2/search/symbols.json?q=${encodeURIComponent(q)}`)
            // return response
          } catch (error) {
            console.error(error)
            return '{}'
          }
        })
    )
  )

  console.log(responses)

  const messages = responses.reduce((a, b) => [...a, ...b], [])

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(
      { messages },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
