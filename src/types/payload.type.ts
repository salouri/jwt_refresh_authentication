import { Types } from 'mongoose';

interface PayloadType {
  id: Types.ObjectId;
  exp: number;
  iat?: number;
}
export default PayloadType;
