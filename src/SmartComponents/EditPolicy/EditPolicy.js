import React, { useState, useEffect } from 'react';
import propTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';
import { Button, Form, Modal, Tab, TabTitleText, Spinner } from '@patternfly/react-core';
import { RoutedTabs } from 'PresentationalComponents';
import { uniq } from 'Utilities/helpers';
import { useLinkToBackground, useAnchor } from 'Utilities/Router';
import { useTitleEntity } from 'Utilities/hooks/useDocumentTitle';
import EditPolicyDetailsTab from './EditPolicyDetailsTab';
import EditPolicyRulesTab from './EditPolicyRulesTab';
import EditPolicySystemsTab from './EditPolicySystemsTab';
import usePolicy from './usePolicy';
import useFeature from 'Utilities/hooks/useFeature';
import { mapCountOsMinorVersions } from 'Store/Reducers/SystemStore';

export const MULTIVERSION_QUERY = gql`
query Profile($policyId: String!){
    profile(id: $policyId) {
        id
        name
        refId
        external
        description
        totalHostCount
        compliantHostCount
        complianceThreshold
        majorOsVersion
        osMajorVersion
        lastScanned
        policyType
        policy {
            id
            name
            refId
            profiles {
                id
                ssgVersion
                parentProfileId
                name
                refId
                osMinorVersion
                osMajorVersion
                benchmark {
                    id
                    title
                    latestSupportedOsMinorVersions
                    osMajorVersion
                }
                rules {
                    title
                    severity
                    rationale
                    refId
                    description
                    remediationAvailable
                    identifier
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

const profilesToOsMinorMap = (profiles, hosts) => (
    (profiles || []).reduce((acc, profile) => {
        if (profile.osMinorVersion !== '') {
            acc[profile.osMinorVersion] ||= { osMinorVersion: profile.osMinorVersion, count: 0 };
        }

        return acc;
    }, mapCountOsMinorVersions(hosts || []))
);

export const EditPolicy = ({ route }) => {
    const { policy_id: policyId } = useParams();
    let { data } = useQuery(MULTIVERSION_QUERY, {
        variables: { policyId }
    });
    const policy = data?.profile;
    const policyProfiles = policy?.policy?.profiles || [];
    const newInventory = useFeature('newInventory');
    const dispatch = useDispatch();
    const anchor = useAnchor();
    const [updatedPolicy, setUpdatedPolicy] = useState(null);
    const [selectedRuleRefIds, setSelectedRuleRefIds] = useState([]);
    const [osMinorVersionCounts, setOsMinorVersionCounts] = useState({});
    const updatePolicy = usePolicy();
    const linkToBackground = useLinkToBackground('/scappolicies');
    const [isSaving, setIsSaving] = useState();
    const selectedEntities = useSelector((state) => (state?.entities?.selectedEntities));
    const saveEnabled = updatedPolicy && !updatedPolicy.complianceThresholdValid;

    const linkToBackgroundWithHash = () => {
        newInventory && dispatch({
            type: 'SELECT_ENTITIES',
            payload: { ids: [] }
        });
        linkToBackground({ hash: anchor });
    };

    const handleRuleSelect = (profile, newSelectedRuleRefIds) => {
        const filteredSelection = selectedRuleRefIds.filter((selectedProfile) =>
            selectedProfile.id !== profile.id
        );
        setSelectedRuleRefIds([
            { id: profile.id, ruleRefIds: newSelectedRuleRefIds },
            ...filteredSelection
        ]);
    };
    // TODO Move to hook
    const onSave = () => {
        if (isSaving) { return; }

        setIsSaving(true);
        updatePolicy(policy, updatedPolicy).then(() => {
            setIsSaving(false);
            linkToBackgroundWithHash();
        }).catch(() => {
            // TODO report error
            setIsSaving(false);
            linkToBackgroundWithHash();
        });
    };

    const actions = [
        <Button
            isDisabled={ saveEnabled }
            key='save'
            variant='primary'
            spinnerAriaValueText='Saving'
            isLoading={ isSaving }
            onClick={ onSave }>
            Save
        </Button>,
        <Button
            key='cancel'
            variant='secondary'
            onClick={ () => linkToBackgroundWithHash() }>
            Cancel
        </Button>
    ];

    const updateSelectedRuleRefIds = () => {
        if (policy) {
            setSelectedRuleRefIds(policyProfiles.map((policyProfile) => ({
                id: policyProfile.id,
                ruleRefIds: policyProfile.rules.map((rule) => (rule.refId))
            })));
        }
    };

    useEffect(() => {
        setUpdatedPolicy({
            ...updatedPolicy,
            hosts: selectedEntities ? selectedEntities : []
        });
        updateSelectedRuleRefIds();

        setOsMinorVersionCounts(
            profilesToOsMinorMap(policyProfiles, selectedEntities)
        );
    }, [selectedEntities]);

    useEffect(() => setUpdatedPolicy({ ...updatedPolicy, selectedRuleRefIds }), [selectedRuleRefIds]);

    useEffect(() => {
        if (policy) {
            const complianceThresholdValid =
                (policy.complianceThreshold < 101 && policy.complianceThreshold > 0);
            setUpdatedPolicy({
                ...policy,
                complianceThresholdValid
            });
            updateSelectedRuleRefIds();

            dispatch({
                type: 'SELECT_ENTITIES',
                payload: { ids: policy?.hosts || [] }
            });
            setOsMinorVersionCounts(
                profilesToOsMinorMap(policyProfiles, policy.hosts)
            );
        }
    }, [policy]);

    useTitleEntity(route, policy?.name);

    return <Modal
        isOpen
        style={ { height: '768px' } }
        width={ 1220 }
        title={ `Edit ${ policy ? policy.name : '' }` }
        onClose={ () => linkToBackgroundWithHash() }
        actions={ actions }>
        { policy ? <Form>
            <RoutedTabs defaultTab='details'>
                <Tab eventKey='details' title={<TabTitleText>Details</TabTitleText>}>
                    <EditPolicyDetailsTab
                        policy={ policy }
                        setUpdatedPolicy={ setUpdatedPolicy } />
                </Tab>

                <Tab eventKey='rules' title={ <TabTitleText>Rules</TabTitleText> }>
                    <EditPolicyRulesTab
                        policy={ policy }
                        handleSelect={ handleRuleSelect }
                        selectedRuleRefIds={ selectedRuleRefIds }
                        osMinorVersionCounts={ osMinorVersionCounts }
                    />
                </Tab>

                <Tab eventKey='systems' title={ <TabTitleText>Systems</TabTitleText> }>
                    <EditPolicySystemsTab
                        osMajorVersion={ policy.osMajorVersion }
                        policyOsMinorVersions={ uniq(policyProfiles.map(profile => profile.osMinorVersion)) }
                    />
                </Tab>
            </RoutedTabs>
        </Form> : <Spinner /> }
    </Modal>;
};

EditPolicy.propTypes = {
    route: propTypes.object
};

export default EditPolicy;
