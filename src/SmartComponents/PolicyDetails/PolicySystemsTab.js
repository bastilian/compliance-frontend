/* eslint-disable react/display-name */
import React from 'react';
import propTypes from 'prop-types';
import { NoSystemsTableWithWarning } from 'PresentationalComponents';
import { SystemsTable } from 'SmartComponents';
import * as Columns from '../SystemsTable/Columns';
import EditSystemsButtonToolbarItem from './EditSystemsButtonToolbarItem';

const PolicySystemsTab = ({ policy }) => {
  return (
    <SystemsTable
      columns={[
        Columns.inventoryColumn('display_name'),
        Columns.inventoryColumn('tags'),
        Columns.OS,
        Columns.SsgVersion,
      ]}
      showOsMinorVersionFilter={[policy.osMajorVersion]}
      policyId={policy.id}
      defaultFilter={`policy_id = ${policy.id}`}
      showActions={false}
      remediationsEnabled={false}
      noSystemsTable={
        policy?.hosts?.length === 0 && <NoSystemsTableWithWarning />
      }
      complianceThreshold={policy.complianceThreshold}
      dedicatedAction={<EditSystemsButtonToolbarItem policy={policy} />}
    />
  );
};

PolicySystemsTab.propTypes = {
  policy: propTypes.shape({
    id: propTypes.string.isRequired,
    complianceThreshold: propTypes.number.isRequired,
    osMajorVersion: propTypes.string.isRequired,
    hosts: propTypes.array.isRequired,
  }),
  dedicatedAction: propTypes.object,
  systemTableProps: propTypes.object,
};

export default PolicySystemsTab;
