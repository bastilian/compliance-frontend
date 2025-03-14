import useComplianceQuery from './useComplianceQuery';

export const convertToArray = (params) => {
  if (Array.isArray(params)) {
    return params;
  } else {
    const { tags, limit, offset, idsOnly, sortBy, filter } = params;

    return [
      undefined, // xRHIDENTITY
      tags,
      limit,
      offset,
      idsOnly,
      sortBy,
      filter,
    ];
  }
};

const useSystems = (options) =>
  useComplianceQuery('systems', { ...options, convertToArray });

export default useSystems;
