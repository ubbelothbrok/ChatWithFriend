import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'chat_user_id';

export const getUserId = (): string => {
    let userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
        userId = uuidv4();
        localStorage.setItem(STORAGE_KEY, userId);
    }
    return userId;
};
