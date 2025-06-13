import * as dotenv from 'dotenv';
dotenv.config();

export const vnp_Config = {
  vnp_TmnCode: process.env.VNP_TMNCODE,
  vnp_HashSecret: process.env.VNP_HASH_SECRET,
  vnp_Url: process.env.VNP_URL,
  vnp_ReturnUrl: process.env.VNP_RETURN_URL,
  returnUrl: process.env.RETURN_URL,
};
