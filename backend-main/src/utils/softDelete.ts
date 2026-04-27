// Soft Delete Utility
// Instead of removing records, set isDeleted to true

export const softDelete = async (model: any, id: string) => {
  return model.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const queryActive = (where: any = {}) => {
  return {
    ...where,
    isDeleted: false,
  };
};

export const hardDelete = async (model: any, id: string) => {
  return model.delete({
    where: { id },
  });
};
