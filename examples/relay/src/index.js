import React from 'react'
import {createFragmentContainer, graphql} from 'react-relay'

const Hello = ({fullName}) => React.createElement('h1', null, `Hello ${fullName}`)

export default createFragmentContainer(Hello, {
  data: graphql`
    fragment src_data on User {
      fullName
    }
  `
})
