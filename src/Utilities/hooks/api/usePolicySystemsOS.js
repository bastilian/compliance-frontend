import useComplianceQuery from './useComplianceQuery';

export const convertToArray = (params) => {
  if (Array.isArray(params)) {
    return params;
  } else {
    const { filter, policyId } = params;

    return [
      policyId,
      undefined, // xRHIDENTITY
      filter,
    ];
  }
};

const usePolicySystemsOS = (options) =>
  useComplianceQuery('policySystemsOS', { ...options, convertToArray });

export default usePolicySystemsOS;
