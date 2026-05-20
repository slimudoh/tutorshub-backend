export const removeUnderscoreFromString = (value: string) => {
  if (value) {
    if (value.includes("_")) {
      return value.replace(/_/g, " ");
    } else {
      return value.replace(/([a-z])([A-Z])/g, "$1 $2");
    }
  }
  return "";
};
