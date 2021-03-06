'use strict';

const https = require('https')

module.exports.messages = async event => {
  try {
    const responses = (await Promise.all(
        event
          .multiValueQueryStringParameters
          .q
          .map(async q => {
            // try {
              const { messages } = await new Promise((resolve, reject) => {
                const chunks = []

                https
                  .get(`https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(q)}.json`, response => {
                    response.on('data', chunk => chunks.push(chunk))
                    response.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))))
                  })
                  .on('error', reject)
              })

              return messages
          })
      )
    )

    const messages = responses.reduce((a, b) => [...a, ...b], [])
    const uniqueMessageIds = [...new Set(messages.map(({ id }) => id))]
    const uniqueMessages = uniqueMessageIds.map(id => messages.find(message => message.id === id))

    const sortedMessages =
      uniqueMessages
        .sort((message1, message2) =>
          new Date(message2.created_at) - new Date(message1.created_at)
        )

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(
        { messages: sortedMessages },
        null,
        2
      ),
    };
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(
        { messages: [], error: error.message },
        null,
        2
      ),
    };
  }


  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

module.exports.symbols = async event => {
  const q = event.multiValueQueryStringParameters.q[0]
  
  try {
    const response = await new Promise((resolve, reject) => {
      const chunks = []

      https
        .get(`https://api.stocktwits.com/api/2/search/symbols.json?q=${encodeURIComponent(q)}`, response => {
          response.on('data', chunk => chunks.push(chunk))
          response.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))))
        })
        .on('error', reject)
    })

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(
        { symbols: response.results || [] },
        null,
        2
      ),
    };
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(
        { symbols: [], error: error.message },
        null,
        2
      ),
    };
  }


  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};