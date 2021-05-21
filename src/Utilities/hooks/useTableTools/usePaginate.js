import { useState } from 'react';

const usePaginate = (options = {}) => {
    const { perPage = 10 } = options;
    const enablePagination = options?.pagination !== false;

    const [paginationState, setPaginationState] = useState({
        perPage,
        page: 1
    });
    const setPagination = (newState) => (
        setPaginationState({
            ...paginationState,
            ...newState
        })
    );

    const onSetPage = (_, page) => (
        setPagination({ ...paginationState, page })
    );

    const onPerPageSelect = (_, perPage) => (
        setPagination({ page: 1, perPage })
    );

    const paginator = (items) => {
        const { page, perPage } = paginationState;
        const start = (page - 1) * perPage;
        const end = start + perPage;

        return items.slice(start, end);
    };

    const setPage = (page) => (
        setPaginationState({
            ...paginationState,
            page: page < 0 ? paginationState.page + page : page
        })
    );

    return enablePagination ? {
        paginator,
        setPage,
        toolbarProps: {
            pagination: {
                ...paginationState,
                onSetPage,
                onPerPageSelect
            }
        }
    } : {};
};

export default usePaginate;
