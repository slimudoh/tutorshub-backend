import WishList from "../models/wishlist.models";

export const getWishList = async (userId: string) => {
  return await WishList.findAll({
    where: {
      userId,
    },
  });
};
