const lookup = (from, localField, as, project) => [
  { $lookup: { from, localField, foreignField: "_id", as, pipeline: [{ $project: project }] } },
  { $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true } },
];

export const orderDetailStages = ({ withCustomer = false } = {}) => [
  ...lookup("menuItems", "itemId", "item", { itemName: 1, images: 1, price: 1, category: 1, location: 1 }),
  ...lookup("users", "vendorId", "vendor", { name: 1, businessName: 1, image: 1 }),
  ...(withCustomer ? lookup("users", "customerId", "customer", { name: 1, email: 1, image: 1 }) : []),
];