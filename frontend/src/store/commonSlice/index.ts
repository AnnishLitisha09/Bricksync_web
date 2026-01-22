import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CommonStoreProps } from './types';
import { CommonStoreSlice } from './commonSlice';

export const useCommonStore = create<CommonStoreProps>()(
    immer((...a) => ({
        ...CommonStoreSlice(...a),
    })),
);
