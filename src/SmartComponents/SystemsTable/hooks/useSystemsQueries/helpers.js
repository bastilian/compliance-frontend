import { filtersSerialiser } from 'PresentationalComponents/ComplianceTable/serialisers';
import * as filters from '../../Filters';

export const inventoryFiltersSerialiser = (inventoryFilterState = {}) =>
  filtersSerialiser(inventoryFilterState, [
    filters.name,
    filters.os,
    filters.group,
    filters.tags,
  ]);

export const inventorySortSerialiser = (
  { key: sortByKey, direction } = {},
  columns
) => {
  const index = columns.findIndex(({ key }) => key === sortByKey);

  if (index >= 0 && columns[index]?.sortable) {
    return `${columns[index].sortable}:${direction}`;
  }
};

export const buildOSObjects = (osVersions = []) => ({
  results: osVersions
    .filter((version) => !!version && typeof version === 'string')
    .map((version) => {
      const [major, minor] = version.split('.');
      return {
        value: {
          name: 'RHEL',
          major,
          minor,
        },
      };
    }),
});
