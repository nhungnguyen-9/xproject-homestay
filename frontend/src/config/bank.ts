/**
 * Cấu hình tài khoản ngân hàng nhận thanh toán (VietQR)
 * Các giá trị được nạp từ tệp .env (VITE_BANK_ID, VITE_BANK_ACCOUNT, VITE_ACCOUNT_NAME)
 */
export const BANK_CONFIG = {
    bankId: import.meta.env.VITE_BANK_ID || 'MB',
    bankAccount: import.meta.env.VITE_BANK_ACCOUNT || '0123456789',
    accountName: import.meta.env.VITE_ACCOUNT_NAME || 'CHON CINEHOME',
};
