import React, { useEffect, useState, useRef, useCallback } from 'react';
import { withApollo } from '@apollo/react-hoc';
import PropTypes from 'prop-types';
import { useStore, useDispatch, useSelector, shallowEqual } from 'react-redux';
import { getRegistry } from '@redhat-cloud-services/frontend-components-utilities/Registry';
import SkeletonTable from '@redhat-cloud-services/frontend-components/SkeletonTable';
import { policyFilter } from './constants';
import { systemsReducer } from 'Store/Reducers/SystemStore';
import { selectAll, clearSelection } from 'Store/ActionTypes';
import { exportFromState } from 'Utilities/Export';
import { DEFAULT_SYSTEMS_FILTER_CONFIGURATION, COMPLIANT_SYSTEMS_FILTER_CONFIGURATION } from '@/constants';
import debounce from 'lodash/debounce';
import {
    ErrorPage,
    StateView,
    StateViewPart
} from 'PresentationalComponents';
import { Alert } from '@patternfly/react-core';
import { TableVariant } from '@patternfly/react-table';
// eslint-disable-next-line max-len
import ComplianceRemediationButton from '@redhat-cloud-services/frontend-components-inventory-compliance/ComplianceRemediationButton';
import { systemsWithRuleObjectsFailed } from 'Utilities/ruleHelpers';
import useFilterConfig from 'Utilities/hooks/useFilterConfig';
import { InventoryTable as FECInventoryTable } from '@redhat-cloud-services/frontend-components/Inventory';

import useCollection from 'Utilities/hooks/api/useCollection';

const InventoryTable = ({
    columns,
    showAllSystems,
    policyId,
    showActions,
    enableExport,
    compliantFilter,
    policies,
    showOnlySystemsWithTestResults,
    showOsFilter,
    error,
    showComplianceSystemsInfo,
    compact,
    remediationsEnabled,
    systemProps,
    defaultFilter
}) => {
    const store = useStore();
    const dispatch = useDispatch();
    const inventory = useRef(null);

    const { conditionalFilter, activeFilters, buildFilterString } = useFilterConfig([
        ...DEFAULT_SYSTEMS_FILTER_CONFIGURATION,
        ...(compliantFilter ? COMPLIANT_SYSTEMS_FILTER_CONFIGURATION : []),
        ...(policies?.length > 0 ? policyFilter(policies, showOsFilter) : [])
    ]);
    // TODO use table tool
    const [pagination, setPagination] = useState({
        perPage: 50,
        page: 1
    });
    const fetchSystems = useCollection('systems', {
        pagination,
        type: 'host',
        filter: (() => {
            const filter = buildFilterString();
            return [
                ...defaultFilter ? [defaultFilter] : [],
                ...showOnlySystemsWithTestResults ? ['has_test_results = true'] : [],
                ...filter?.length > 0 ? [filter] : []
            ].join(' and ');
        })(),
        ...policyId && { policyId }
    });

    const selectedEntities = useSelector(({ entities } = {}) => (entities?.selectedEntities || []), shallowEqual);
    // const onBulkSelect = (isSelected) => isSelected ? dispatch(selectAll()) : dispatch(clearSelection());

    const getEntities = async (...args) => {
        console.log(...args);
        const { collection: systems, total } = await fetchSystems();
        return {
            results: systems,
            total,
            loaded: true
        };
    };

    //
    //     const debounceFetchSystems = useCallback(
    //         debounce(fetchSystems, 800),
    //         [conditionalFilter.activeFiltersConfig.filters]
    //     );
    //
    //     useEffect(() => {
    //         if (conditionalFilter.activeFiltersConfig.filters) {
    //             debounceFetchSystems(pagination.perPage, 1);
    //         }
    //     }, [activeFilters]);
    //
    //     const onRefresh = (options, callback) => {
    //         query && fetchSystems(options.per_page, options.page);
    //         if (!callback && inventory && inventory.current) {
    //             inventory.current.onRefreshData(options);
    //         } else if (callback) {
    //             callback(options);
    //         }
    //     };
    //

    return <StateView stateValues={{ error, noError: error === undefined }}>
        <StateViewPart stateKey='error'>
            <ErrorPage error={error}/>
        </StateViewPart>
        <StateViewPart stateKey='noError'>

            { showComplianceSystemsInfo && <Alert
                isInline
                variant="info"
                title={ 'The list of systems in this view is different than those that appear in the Inventory. ' +
                    'Only systems currently associated with or reporting against compliance policies are displayed.' } /> }
            <FECInventoryTable
                { ...systemProps }
                onLoad={({ mergeWithEntities, INVENTORY_ACTION_TYPES }) => {
                    getRegistry().register({
                        ...mergeWithEntities()
                    });
                }}
                fallback={<SkeletonTable colSize={2} rowSize={15} />}
                tableProps={{
                    canSelectAll: false
                }}
                variant={compact ? TableVariant.compact : ''}
                ref={inventory}
                // TODO use table tool
                // bulkSelect={{
                //     checked: selectedEntities.length > 0 ?
                //         (items?.every(id => selectedEntities?.find((selected) => selected?.id === id)) ? true : null)
                //         : false,
                //     onSelect: onBulkSelect,
                //     count: selectedEntities.length,
                //     label: selectedEntities.length > 0 ? `${ selectedEntities.length } Selected` : undefined
                // }}
                getEntities={ getEntities }
                {...!showAllSystems && {
                    ...pagination,
                    ...conditionalFilter,
                    ...remediationsEnabled && {
                        dedicatedAction: <ComplianceRemediationButton
                            allSystems={ systemsWithRuleObjectsFailed(selectedEntities) }
                            selectedRules={ [] } />
                    }
                }}
                {...enableExport && {
                    exportConfig: {
                        isDisabled: false, // TODO  total === 0 && selectedEntities.length === 0,
                        onSelect: (_, format) => exportFromState(store.getState()?.entities, format)
                    }
                }}
                {...showActions && {
                    actions: [{
                        title: 'View in inventory',
                        onClick: (_event, _index, { id }) => {
                            const beta = window.location.pathname.split('/')[1] === 'beta';
                            window.location.href = `${window.location.origin}${beta ? '/beta' : ''}/insights/inventory/${id}`;
                        }
                    }]
                }}
            />
        </StateViewPart>
    </StateView>;
};

InventoryTable.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({})),
    policies: PropTypes.arrayOf(PropTypes.shape({})),
    client: PropTypes.object,
    showAllSystems: PropTypes.bool,
    policyId: PropTypes.string,
    query: PropTypes.string,
    showActions: PropTypes.bool,
    enableExport: PropTypes.bool,
    compliantFilter: PropTypes.bool,
    showOnlySystemsWithTestResults: PropTypes.bool,
    showOsFilter: PropTypes.bool,
    showComplianceSystemsInfo: PropTypes.bool,
    error: PropTypes.object,
    compact: PropTypes.bool,
    remediationsEnabled: PropTypes.bool,
    defaultFilter: PropTypes.string,
    systemProps: PropTypes.shape({
        isFullView: PropTypes.bool
    })
};

InventoryTable.defaultProps = {
    policyId: '',
    showActions: true,
    enableExport: true,
    compliantFilter: false,
    showOnlySystemsWithTestResults: false,
    showComplianceSystemsInfo: false,
    compact: false,
    remediationsEnabled: true
};

export default withApollo(InventoryTable);
