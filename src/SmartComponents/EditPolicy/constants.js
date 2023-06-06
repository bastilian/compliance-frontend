import gql from 'graphql-tag';

export const BENCHMARKS_QUERY = gql`
  query Benchmarks($filter: String!, $enableRuleTree: Boolean = false) {
    benchmarks(search: $filter) {
      nodes {
        id
        latestSupportedOsMinorVersions
        ruleTree @include(if: $enableRuleTree)
        valueDefinitions {
          defaultValue
          description
          id
          refId
          title
          valueType
        }
        profiles {
          id
          refId
          ssgVersion
        }
      }
    }
  }
`;

export const MULTIVERSION_QUERY = gql`
  query Profile($policyId: String!, $enableRuleTree: Boolean = false) {
    profile(id: $policyId) {
      id
      name
      refId
      external
      description
      totalHostCount
      compliantHostCount
      complianceThreshold
      osMajorVersion
      supportedOsVersions
      lastScanned
      policyType
      policy {
        id
        name
        refId
        profiles {
          id
          parentProfileId
          name
          refId
          osMinorVersion
          osMajorVersion
          values
          benchmark {
            id
            title
            latestSupportedOsMinorVersions
            osMajorVersion
            version
            ruleTree @include(if: $enableRuleTree)
          }
          rules {
            title
            severity
            rationale
            refId
            description
            remediationAvailable
            identifier
            values
          }
        }
      }
      businessObjective {
        id
        title
      }
      hosts {
        id
        osMinorVersion
        osMajorVersion
      }
    }
  }
`;

export const RULE_VALUE_DEFINITIONS_QUERY = gql`
  query Profile($policyId: String!, $enableRuleTree: Boolean = false) {
    profile(id: $policyId) {
      id
      policy {
        id
        refId
        profiles {
          id
          parentProfileId
          refId
          benchmark {
            id
            ruleTree @include(if: $enableRuleTree)
            valueDefinitions {
              defaultValue
              description
              id
              refId
              title
              valueType
            }
          }
        }
      }
    }
  }
`;
