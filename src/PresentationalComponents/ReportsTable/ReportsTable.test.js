import { render } from '@testing-library/react';
import { queryByText } from '@testing-library/dom';
import { policies as rawPolicies } from '@/__fixtures__/policies.js';
import ReportsTable from './ReportsTable';
import {
  policyNameFilter,
  policyTypeFilter,
  operatingSystemFilter,
  policyComplianceFilter,
} from './Filters';
import { uniq } from 'Utilities/helpers';
import { filterHelpers } from 'Utilities/hooks/useTableTools/testHelpers.js';

expect.extend(filterHelpers);

jest.mock(
  '@redhat-cloud-services/frontend-components-utilities/useInsightsNavigate',
  () => () => ({})
);

jest.mock('@redhat-cloud-services/frontend-components/InsightsLink', () => ({
  __esModule: true,
  default: ({ children, isDisabled, ...props }) => {
    return (
      <button {...props} disabled={isDisabled}>
        {children}
      </button>
    );
  },
}));

const profiles = rawPolicies.edges.map((profile) => profile.node);

describe('ReportsTable', () => {
  it('expect to render without error', () => {
    const { container } = render(<ReportsTable profiles={profiles} />);

    expect(
      queryByText(
        container.querySelector('tbody>tr button'),
        'C2S for Red Hat Enterprise Linux 7'
      )
    ).not.toBeNull();
  });

  it('expect to have filters properly rendered', () => {
    const policyTypes = uniq(
      profiles.map(({ policyType }) => policyType).filter((i) => !!i)
    );
    const operatingSystems = uniq(
      profiles.map(({ osMajorVersion }) => osMajorVersion).filter((i) => !!i)
    );
    const component = <ReportsTable profiles={profiles} />;

    expect(component).toHaveFiltersFor([
      ...policyNameFilter,
      ...policyComplianceFilter,
      ...policyTypeFilter(policyTypes),
      ...operatingSystemFilter(operatingSystems),
    ]);
  });
});
