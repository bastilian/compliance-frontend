const useActiveRefresh = (options) => {
  const { activeRefreshCheck: activeRefreshCheckOption, onActiveRefresh } =
    options;

  const activeRefreshCheck = (item) => {
    if (activeRefreshCheckOption(item)) {
      onActiveRefresh?.();
    }
  };

  return {
    activeRefreshCheck,
  };
};

export default useActiveRefresh;
