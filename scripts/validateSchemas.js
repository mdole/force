// @ts-check

// Grab the schema for reaction out of the node_modules
// to see if it is a subset of the production schema
//
// Used both by Danger during the deploy PR, and also
// before the deployment on circle
//
const path = require("path")
const { readFileSync } = require("fs")
const {
  introspectionQuery,
  buildClientSchema,
  printSchema,
  buildSchema,
} = require("graphql")

const { diff } = require("@graphql-inspector/core")
const fetch = require("isomorphic-fetch")

const downloadMetaphysicsSchema = async endpoint => {
  const postBody = {
    query: introspectionQuery,
    operationName: "IntrospectionQuery",
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(postBody),
    headers: {
      "Content-Type": "application/json",
    },
  })
  const { data } = await response.json()
  // commentDescriptions is hidden
  // @ts-ignore
  return printSchema(buildClientSchema(data), { commentDescriptions: true })
}

const getBreakingChanges = async (metaphysicsEnv, metaphysicsVersion = 2) => {
  const localSchema = readFileSync(
    path.join(__dirname, "../data/schema.graphql"),
    {
      encoding: "utf8",
    }
  )
  const metaphysicsEndpoint = metaphysicsVersion === 2 ? "/v2" : ""
  const metaphyicsSchema = await downloadMetaphysicsSchema(
    `https://metaphysics-${metaphysicsEnv}.artsy.net${metaphysicsEndpoint}`
  )

  const allChanges = diff(
    buildSchema(localSchema),
    buildSchema(metaphyicsSchema)
  )
  const breakings = allChanges.filter(c => c.criticality.level === "BREAKING")
  const messages = breakings.map(c => c.message)
  return messages
}

module.exports = {
  getBreakingChanges,
}

// @ts-ignore
if (require.main === module) {
  // When this is being called as a script via `node scripts/validateSchemas.js`
  if (process.argv.length !== 3) {
    console.log(
      'This script must be called with either "staging" or "production"'
    )
    process.exitCode = 1
  } else {
    const env = process.argv[2]
    getBreakingChanges(env).then(changes => {
      if (changes.length) {
        process.exitCode = 1
        console.error(
          `The schema in Force is incompatible with ${env} Metaphysics's Schema:\n\n`
        )
        console.error(changes)
        console.error(
          `\n\nYou should update Force's schema before releasing these changes`
        )
      } else {
        console.log("No breaking changes found!")
      }
    })
  }
}
