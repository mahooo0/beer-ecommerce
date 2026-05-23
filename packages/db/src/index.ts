export { prisma, PrismaClient } from './prisma';
export { OrderModel, CartModel, connectMongoDB, mongoose } from './mongoose';
export type {
  IOrder,
  IOrderItem,
  IOrderAddress,
  IShippingInfo,
  IPaymentInfo,
  IOrderStatusChange,
  ICart,
  ICartItem
} from './mongoose';
