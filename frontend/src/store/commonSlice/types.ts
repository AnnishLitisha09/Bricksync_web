export interface CommonStoreProps {
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export type CommonStoreSliceTypes = CommonStoreProps;
