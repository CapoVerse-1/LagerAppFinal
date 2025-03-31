export const getTotalItemsForBrand = (items, brandName) => {
  return items.filter(item => item.brand === brandName).reduce((sum, item) => sum + item.total, 0);
}

export const sortByActive = (a, b) => {
  if (a.isActive === b.isActive) return 0;
  return a.isActive ? -1 : 1;
};

export const sortByPinAndActive = (a, b) => {
  if (a.isPinned && !b.isPinned) return -1;
  if (!a.isPinned && b.isPinned) return 1;
  if (a.isPinned && b.isPinned) {
    return a.pinOrder - b.pinOrder;
  }
  return sortByActive(a, b);
};

